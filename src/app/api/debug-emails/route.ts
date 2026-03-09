import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Busca 1: Todos os e-mails recentes
    const allEmails = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20
    });

    // Busca 2: Específica de takayama.sp@gmail.com
    const takayamaEmails = await gmail.users.messages.list({
      userId: 'me',
      q: 'from:takayama.sp@gmail.com',
      maxResults: 20
    });

    // Busca 3: Específica de kp-net@kp-net.com
    const kpnetEmails = await gmail.users.messages.list({
      userId: 'me',
      q: 'from:kp-net@kp-net.com',
      maxResults: 20
    });

    // Busca 4: Qualquer e-mail com "takayama" no conteúdo
    const takayamaContent = await gmail.users.messages.list({
      userId: 'me',
      q: 'takayama',
      maxResults: 20
    });

    const emails = [];
    
    if (allEmails.data.messages) {
      for (const message of allEmails.data.messages) {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date']
        });

        const headers = fullMessage.data.payload?.headers || [];
        const from = headers.find(h => h.name === 'From')?.value || '';
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        emails.push({
          id: message.id,
          from,
          subject,
          date,
          isTakayama: from.includes('takayama.sp@gmail.com') || from.includes('takayama'),
          isKpNet: from.includes('kp-net@kp-net.com')
        });
      }
    }

    return NextResponse.json({
      message: `Análise completa de e-mails`,
      searchResults: {
        allEmails: allEmails.data.messages?.length || 0,
        takayamaEmails: takayamaEmails.data.messages?.length || 0,
        kpnetEmails: kpnetEmails.data.messages?.length || 0,
        takayamaContent: takayamaContent.data.messages?.length || 0
      },
      emails,
      summary: {
        total: emails.length,
        fromTakayama: emails.filter(e => e.isTakayama).length,
        fromKpNet: emails.filter(e => e.isKpNet).length
      },
      recommendations: {
        ifZeroTakayama: [
          "Verifique se o e-mail está na caixa de entrada principal",
          "Verifique se está na pasta Spam",
          "Verifique se foi movido para outra pasta",
          "Verifique se o e-mail é muito antigo",
          "Verifique se o remetente está exatamente como 'takayama.sp@gmail.com'"
        ]
      }
    });

  } catch (error) {
    console.error('Erro debug e-mails:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar e-mails: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
