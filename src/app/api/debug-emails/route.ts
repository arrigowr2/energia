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

    // Buscar todos os e-mails recentes para debug
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10
    });

    const emails = [];
    
    if (response.data.messages) {
      for (const message of response.data.messages) {
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
          isTarget: from.includes('takayama.sp@gmail.com') || from.includes('kp-net@kp-net.com')
        });
      }
    }

    return NextResponse.json({
      message: `Encontrados ${emails.length} e-mails recentes`,
      emails,
      targetEmails: emails.filter(e => e.isTarget),
      summary: {
        total: emails.length,
        fromTakayama: emails.filter(e => e.from.includes('takayama.sp@gmail.com')).length,
        fromKpNet: emails.filter(e => e.from.includes('kp-net@kp-net.com')).length
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
