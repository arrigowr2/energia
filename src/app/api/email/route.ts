import { NextRequest, NextResponse } from 'next/server';
import Imap from 'imap';

interface EmailConfig {
  email: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

interface EnergyData {
  date: string;
  energiaProduzida: number;
  energiaConsumida: number;
  energiaVendida: number;
  energiaComprada: number;
}

function parseEmailContent(content: string): EnergyData | null {
  // Este parser precisa ser adaptado conforme o formato do e-mail da sua companhia elétrica
  // Exemplo de parser - ajuste conforme necessário
  
  const patterns = {
    produzida: /(?:energia\s+produzida|produzida)[:\s]+([\d.,]+)\s*kWh?/i,
    consumida: /(?:energia\s+consumida|consumida)[:\s]+([\d.,]+)\s*kWh?/i,
    vendida: /(?:energia\s+vendida|vendida|exportada)[:\s]+([\d.,]+)\s*kWh?/i,
    comprada: /(?:energia\s+comprada|comprada|importada)[:\s]+([\d.,]+)\s*kWh?/i
  };

  const parseValue = (text: string): number => {
    const match = text.match(/[\d.,]+/);
    return match ? parseFloat(match[0].replace(',', '.')) : 0;
  };

  try {
    const data: EnergyData = {
      date: new Date().toISOString().split('T')[0],
      energiaProduzida: parseValue(content.match(patterns.produzida)?.[1] || '0'),
      energiaConsumida: parseValue(content.match(patterns.consumida)?.[1] || '0'),
      energiaVendida: parseValue(content.match(patterns.vendida)?.[1] || '0'),
      energiaComprada: parseValue(content.match(patterns.comprada)?.[1] || '0')
    };

    // Retorna null se nenhum dado válido for encontrado
    if (data.energiaProduzida === 0 && data.energiaConsumida === 0 && 
        data.energiaVendida === 0 && data.energiaComprada === 0) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao parsear e-mail:', error);
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const config: EmailConfig = await request.json();

    // Validação básica
    if (!config.email || !config.password || !config.host) {
      return NextResponse.json(
        { error: 'Configurações de e-mail incompletas' },
        { status: 400 }
      );
    }

    const imap = new Imap({
      user: config.email,
      password: config.password,
      host: config.host,
      port: config.port || 993,
      tls: config.tls !== false,
      tlsOptions: { 
        rejectUnauthorized: false,
        servername: config.host
      },
      authTimeout: 60000,  // Aumentado para 60 segundos
      connTimeout: 60000,  // Aumentado para 60 segundos
      keepalive: {
        interval: 10000,
        idleInterval: 300000,
        forceNoop: true
      }
    });

    return new Promise((resolve) => {
      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            resolve(NextResponse.json(
              { error: 'Erro ao abrir caixa de entrada' },
              { status: 500 }
            ));
            return;
          }

          // Busca e-mails de remetentes relacionados à companhia elétrica
          const searchCriteria = [
            ['FROM', '@energia'],
            ['FROM', '@light'],
            ['FROM', '@eletropaulo'],
            ['FROM', '@celpe'],
            ['FROM', '@coelba'],
            ['SUBJECT', 'energia'],
            ['SUBJECT', 'consumo'],
            ['SUBJECT', 'fatura']
          ];

          imap.search(['OR', ...searchCriteria], (err, results) => {
            if (err) {
              resolve(NextResponse.json(
                { error: 'Erro ao buscar e-mails' },
                { status: 500 }
              ));
              return;
            }

            if (!results || results.length === 0) {
              imap.end();
              resolve(NextResponse.json(
                { message: 'Nenhum e-mail da companhia elétrica encontrado' },
                { status: 200 }
              ));
              return;
            }

            const emailsData: EnergyData[] = [];
            let processed = 0;

            const fetch = imap.fetch(results, { bodies: '' });
            
            fetch.on('message', (msg, seqno) => {
              msg.on('body', (stream, info) => {
                let buffer = '';
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });
                stream.once('end', () => {
                  const parsedData = parseEmailContent(buffer);
                  if (parsedData) {
                    emailsData.push(parsedData);
                  }
                  processed++;
                  
                  if (processed === results.length) {
                    imap.end();
                    resolve(NextResponse.json({
                      message: `Processados ${emailsData.length} e-mails com dados de energia`,
                      data: emailsData
                    }));
                  }
                });
              });
            });

            fetch.once('error', (err) => {
              imap.end();
              resolve(NextResponse.json(
                { error: 'Erro ao buscar e-mails: ' + err.message },
                { status: 500 }
              ));
            });
          });
        });
      });

      imap.once('error', (err) => {
        console.error('IMAP Error Details:', {
          message: err.message,
          code: err.code,
          source: err.source,
          stack: err.stack
        });
        
        let errorMessage = 'Erro de conexão IMAP';
        
        if (err.message.includes('LOGIN failed')) {
          errorMessage = 'Falha no login. Tente: 1) Verificar se a senha de app está correta, 2) Usar "Office 365" como provedor, 3) Desabilitar TLS temporariamente.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Timeout. Verifique conexão ou tente servidor alternativo.';
        } else if (err.message.includes('certificate')) {
          errorMessage = 'Erro de certificado. Tente desabilitar TLS.';
        } else if (err.message.includes('authentication')) {
          errorMessage = 'Erro de autenticação. Verifique se IMAP está habilitado.';
        }
        
        resolve(NextResponse.json(
          { 
            error: errorMessage,
            details: err.message,
            troubleshooting: 'Para Outlook: use senha de app, verifique IMAP habilitado, ou tente Office 365'
          },
          { status: 500 }
        ));
      });

      imap.connect();
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
