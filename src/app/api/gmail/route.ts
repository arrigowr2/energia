import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    // Configurar OAuth2
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Buscar e-mails específicos do kp-net@kp-net.com e também recebidos de takayama.sp@gmail.com para testes
    // Tenta busca mais ampla primeiro, depois específica
    let response;
    let searchType = '';
    
    try {
      // Busca ampla - qualquer e-mail de takayama.sp@gmail.com
      response = await gmail.users.messages.list({
        userId: 'me',
        q: 'from:takayama.sp@gmail.com',
        maxResults: 30
      });
      searchType = 'takayama.sp@gmail.com';
      
      if (!response.data.messages || response.data.messages.length === 0) {
        // Se não encontrar, busca de kp-net@kp-net.com
        response = await gmail.users.messages.list({
          userId: 'me',
          q: 'from:kp-net@kp-net.com',
          maxResults: 30
        });
        searchType = 'kp-net@kp-net.com';
      }
    } catch (error) {
      // Se tudo falhar, busca genérica
      response = await gmail.users.messages.list({
        userId: 'me',
        q: '(from:kp-net@kp-net.com OR from:takayama.sp@gmail.com)',
        maxResults: 30
      });
      searchType = 'generic';
    }

    if (!response.data.messages || response.data.messages.length === 0) {
      return NextResponse.json({
        message: 'Nenhum e-mail encontrado. Verifique se os e-mails existem na caixa de entrada.',
        debug: {
          searchedFor: ['takayama.sp@gmail.com', 'kp-net@kp-net.com'],
          suggestion: 'Verifique se os e-mails estão na caixa de entrada principal (não em spam/pasta)'
        },
        data: []
      });
    }

    const emailsData = [];
    let processedCount = 0;
    let successCount = 0;

    // Processar cada e-mail
    for (const message of response.data.messages) {
      try {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full'
        });

        // Extrair conteúdo do e-mail
        let content = '';
        if (fullMessage.data.payload?.parts) {
          // E-mail multipart
          for (const part of fullMessage.data.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              content = Buffer.from(part.body.data, 'base64').toString('utf-8');
              break;
            }
          }
        } else if (fullMessage.data.payload?.body?.data) {
          // E-mail simples
          content = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString('utf-8');
        }

        // Extrair data do e-mail
        const dateHeader = fullMessage.data.payload?.headers?.find(h => h.name === 'Date')?.value || '';
        const date = new Date(dateHeader).toISOString().split('T')[0];

        // Parse do conteúdo
        const parsedData = parseEmailContent(content);
        
        processedCount++;
        
        if (parsedData) {
          emailsData.push({
            date,
            ...parsedData
          });
          successCount++;
          console.log(`✅ E-mail processado: ${date} - ${JSON.stringify(parsedData)}`);
        } else {
          console.log(`❌ E-mail sem dados válidos: ${date}`);
          console.log(`Conteúdo: ${content.substring(0, 200)}...`);
        }
      } catch (error) {
        console.error(`Erro ao processar e-mail ${message.id}:`, error);
      }
    }

    return NextResponse.json({
      message: `Processados ${processedCount} e-mails, ${successCount} com dados válidos (busca: ${searchType})`,
      data: emailsData,
      debug: {
        searchType,
        processedCount,
        successCount,
        emailsFound: response.data.messages?.length || 0
      }
    });

  } catch (error) {
    console.error('Erro Gmail OAuth2:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar e-mails via Gmail: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

function parseEmailContent(content: string) {
  // Padrões para extrair dados de energia (Português e Japonês)
  const patterns = {
    // Consumo - Portuguese e Japanese
    consumo: {
      pt: /(?:consumo|consumida|energia\s+consumida)[:\s]*(\d+\.?\d*)\s*kWh?/i,
      jp: /(?:消費|消費電力量|使用量)[:\s]*(\d+\.?\d*)\s*kWh?/i
    },
    // Comprado - Portuguese e Japanese  
    comprado: {
      pt: /(?:comprado|comprada|adquirida|importada)[:\s]*(\d+\.?\d*)\s*kWh?/i,
      jp: /(?:購入|買電|買電量)[:\s]*(\d+\.?\d*)\s*kWh?/i
    },
    // Vendido - Portuguese e Japanese
    vendido: {
      pt: /(?:vendido|vendida|exportada|excedente)[:\s]*(\d+\.?\d*)\s*kWh?/i,
      jp: /(?:売電|売電量|販売)[:\s]*(\d+\.?\d*)\s*kWh?/i
    },
    // Gerado - Portuguese e Japanese
    gerado: {
      pt: /(?:gerado|gerada|produzida|produção)[:\s]*(\d+\.?\d*)\s*kWh?/i,
      jp: /(?:発電|発電量|生成)[:\s]*(\d+\.?\d*)\s*kWh?/i
    }
  };

  const data: any = {
    energiaConsumida: 0,
    energiaComprada: 0,
    energiaVendida: 0,
    energiaGerada: 0
  };

  let foundAny = false;

  // Tentar extrair cada campo em português e japonês
  for (const [key, langs] of Object.entries(patterns)) {
    const langPatterns = langs as any;
    
    // Tentar português primeiro
    let match = content.match(langPatterns.pt);
    if (!match) {
      // Se não encontrar em português, tentar japonês
      match = content.match(langPatterns.jp);
    }
    
    if (match) {
      const fieldMap: any = {
        consumo: 'energiaConsumida',
        comprado: 'energiaComprada', 
        vendido: 'energiaVendida',
        gerado: 'energiaGerada'
      };
      
      data[fieldMap[key]] = parseFloat(match[1]);
      foundAny = true;
    }
  }

  // Se não encontrou nada, tentar padrões genéricos
  if (!foundAny) {
    const genericPatterns = {
      energiaConsumida: /(?:consumo|消費)[:\s]*(\d+\.?\d*)\s*kWh?/i,
      energiaComprada: /(?:comprado|購入)[:\s]*(\d+\.?\d*)\s*kWh?/i,
      energiaVendida: /(?:vendido|売電)[:\s]*(\d+\.?\d*)\s*kWh?/i,
      energiaGerada: /(?:gerado|発電)[:\s]*(\d+\.?\d*)\s*kWh?/i
    };

    for (const [key, pattern] of Object.entries(genericPatterns)) {
      const match = content.match(pattern);
      if (match) {
        data[key] = parseFloat(match[1]);
        foundAny = true;
      }
    }
  }

  return foundAny ? data : null;
}
