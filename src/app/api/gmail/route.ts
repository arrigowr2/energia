import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  console.log('🚀 API /api/gmail chamada');
  
  try {
    const { accessToken } = await request.json();
    console.log('🔑 AccessToken recebido:', accessToken ? 'SIM' : 'NÃO');

    if (!accessToken) {
      console.log('❌ Token não fornecido');
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    // Configurar OAuth2
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Buscar e-mails específicos do kp-net@kp-net.com
    let response;
    let searchType = '';
    
    try {
      // Busca apenas e-mails de kp-net@kp-net.com com limite alto para grandes volumes
      response = await gmail.users.messages.list({
        userId: 'me',
        q: 'from:kp-net@kp-net.com',
        maxResults: 2000
      });
      searchType = 'kp-net@kp-net.com';
    } catch (error) {
      // Se falhar, tenta busca genérica apenas de kp-net
      response = await gmail.users.messages.list({
        userId: 'me',
        q: 'from:kp-net@kp-net.com',
        maxResults: 2000
      });
      searchType = 'fallback';
    }

    if (!response.data.messages || response.data.messages.length === 0) {
      return NextResponse.json({
        message: 'Nenhum e-mail de kp-net@kp-net.com encontrado. Verifique se os e-mails existem na caixa de entrada.',
        debug: {
          searchedFor: ['kp-net@kp-net.com'],
          suggestion: 'Verifique se os e-mails de kp-net@kp-net.com estão na caixa de entrada principal (não em spam/pasta)'
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

        // Tentar decodificar se tiver caracteres estranhos
        try {
          // Se já estiver UTF-8, mantém
          if (content.includes('�') || content.includes('?')) {
            // Tenta decodificar como ISO-8859-1 depois converter para UTF-8
            const isoBuffer = Buffer.from(fullMessage.data.payload?.body?.data || '', 'base64');
            const isoContent = isoBuffer.toString('latin1');
            content = Buffer.from(isoContent, 'latin1').toString('utf-8');
          }
        } catch (decodeError) {
          console.log('Erro na decodificação:', decodeError);
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
      message: `Encontrados ${response.data.messages?.length || 0} e-mails de kp-net@kp-net.com. Processados ${processedCount} e-mails, ${successCount} com dados válidos (busca: ${searchType})`,
      data: emailsData,
      debug: {
        searchType,
        processedCount,
        successCount,
        emailsFound: response.data.messages?.length || 0
      }
    });

  } catch (error: any) {
    console.log('❌ Erro geral na API:', error);
    console.log('❌ Detalhes do erro:', error?.message);
    console.log('❌ Stack do erro:', error?.stack);
    
    return NextResponse.json({ 
      error: 'Erro ao buscar e-mails',
      details: error?.message,
      stack: error?.stack
    }, { status: 500 });
  }
}

function parseEmailContent(content: string) {
  // Padrões específicos para os termos do e-mail japonês
  const patterns = {
    // 消費電力量 (Consumo)
    consumo: {
      jp: /□?\s*消費電力量[:\s]*(\d+\.?\d*)\s*kWh?/i,
      pt: /(?:consumo|consumida|energia\s+consumida|consumo\s+total|total\s+consumido)[:\s]*(\d+\.?\d*)\s*kWh?/i
    },
    // 買電電力量 (Comprado)
    comprado: {
      jp: /□?\s*買電電力量[:\s]*(\d+\.?\d*)\s*kWh?/i,
      pt: /(?:comprado|comprada|adquirida|importada|compra|energia\s+comprada)[:\s]*(\d+\.?\d*)\s*kWh?/i
    },
    // 売電電力量 (Vendido)
    vendido: {
      jp: /□?\s*売電電力量[:\s]*(\d+\.?\d*)\s*kWh?/i,
      pt: /(?:vendido|vendida|exportada|excedente|venda|energia\s+vendida)[:\s]*(\d+\.?\d*)\s*kWh?/i
    },
    // 全体の発電電力量 (Gerado/Produzido)
    gerado: {
      jp: /□?\s*全体の発電電力量[:\s]*(\d+\.?\d*)\s*kWh?/i,
      pt: /(?:gerado|gerada|produzida|produção|geração|energia\s+gerada|energia\s+produzida)[:\s]*(\d+\.?\d*)\s*kWh?/i
    }
  };

  const data: any = {
    energiaConsumida: 0,
    energiaComprada: 0,
    energiaVendida: 0,
    energiaGerada: 0
  };

  let foundAny = false;

  // Função auxiliar para extrair valor
  const extractValue = (text: string, patterns: any) => {
    for (const [lang, patternStr] of Object.entries(patterns)) {
      const match = text.match(patternStr as RegExp);
      if (match) {
        console.log(`✅ Encontrado ${lang}: ${match[0]} -> ${match[1]}`);
        return parseFloat(match[1]);
      }
    }
    return null;
  };

  // Procurar cada campo em todo o conteúdo
  for (const [key, langs] of Object.entries(patterns)) {
    const value = extractValue(content, langs);
    if (value !== null) {
      const fieldMap: any = {
        consumo: 'energiaConsumida',
        comprado: 'energiaComprada', 
        vendido: 'energiaVendida',
        gerado: 'energiaGerada'
      };
      
      data[fieldMap[key]] = value;
      foundAny = true;
    }
  }

  // Se não encontrou nada, tentar padrões mais genéricos
  if (!foundAny) {
    console.log('🔍 Tentando padrões genéricos...');
    
    const genericPatterns = {
      energiaConsumida: [
        /消費電力量[:\s]*(\d+\.?\d*)\s*kWh?/i,
        /(\d+\.?\d*)\s*kWh?.*consumo/i,
        /consumo.*?(\d+\.?\d*)\s*kWh?/i
      ],
      energiaComprada: [
        /買電電力量[:\s]*(\d+\.?\d*)\s*kWh?/i,
        /(\d+\.?\d*)\s*kWh?.*comprad/i,
        /comprad.*?(\d+\.?\d*)\s*kWh?/i
      ],
      energiaVendida: [
        /売電電力量[:\s]*(\d+\.?\d*)\s*kWh?/i,
        /(\d+\.?\d*)\s*kWh?.*vendid/i,
        /vendid.*?(\d+\.?\d*)\s*kWh?/i
      ],
      energiaGerada: [
        /全体の発電電力量[:\s]*(\d+\.?\d*)\s*kWh?/i,
        /(\d+\.?\d*)\s*kWh?.*gerad/i,
        /gerad.*?(\d+\.?\d*)\s*kWh?/i
      ]
    };

    for (const [key, patterns] of Object.entries(genericPatterns)) {
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          data[key] = parseFloat(match[1]);
          foundAny = true;
          console.log(`✅ Padrão genérico ${key}: ${match[0]} -> ${match[1]}`);
          break;
        }
      }
    }
  }

  console.log(`📊 Parse final:`, data);
  console.log(`📄 Conteúdo do e-mail:`, content.substring(0, 500) + '...');
  
  return foundAny ? data : null;
}
