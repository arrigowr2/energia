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

    // Buscar e-mails específicos do kp-net@kp-net.com
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'from:kp-net@kp-net.com',
      maxResults: 30
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      return NextResponse.json({
        message: 'Nenhum e-mail da KP-Net encontrado',
        data: []
      });
    }

    const emailsData = [];

    // Processar cada e-mail
    for (const message of response.data.messages) {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full'
      });

      const emailData = fullMessage.data;
      
      if (emailData.payload?.body?.data) {
        // Decodificar base64
        const emailBody = Buffer.from(emailData.payload.body.data, 'base64').toString('utf-8');
        
        // Extrair dados do e-mail
        const parsedData = parseEmailContent(emailBody);
        
        if (parsedData) {
          emailsData.push({
            ...parsedData,
            date: new Date(parseInt(emailData.internalDate!) / 1000).toISOString().split('T')[0]
          });
        }
      }
    }

    return NextResponse.json({
      message: `Encontrados ${emailsData.length} e-mails da KP-Net`,
      data: emailsData
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
  // Padrões para extrair dados de energia
  const patterns = {
    energiaProduzida: /(?:energia\s+produzida|produzida)[:\s]*(\d+\.?\d*)\s*kWh?/i,
    energiaConsumida: /(?:energia\s+consumida|consumida)[:\s]*(\d+\.?\d*)\s*kWh?/i,
    energiaVendida: /(?:energia\s+vendida|vendida|excedente)[:\s]*(\d+\.?\d*)\s*kWh?/i,
    energiaComprada: /(?:energia\s+comprada|comprada|adquirida)[:\s]*(\d+\.?\d*)\s*kWh?/i
  };

  const data: any = {
    energiaProduzida: 0,
    energiaConsumida: 0,
    energiaVendida: 0,
    energiaComprada: 0
  };

  let foundAny = false;

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = content.match(pattern);
    if (match) {
      data[key] = parseFloat(match[1]);
      foundAny = true;
    }
  }

  return foundAny ? data : null;
}
