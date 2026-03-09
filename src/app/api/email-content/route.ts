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

    // Buscar e-mail de takayama.sp@gmail.com
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'from:takayama.sp@gmail.com',
      maxResults: 1
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      return NextResponse.json({ error: 'Nenhum e-mail encontrado' });
    }

    const messageId = response.data.messages[0].id!;
    const fullMessage = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    // Extrair conteúdo completo
    let content = '';
    let subject = '';
    let from = '';

    // Headers
    const headers = fullMessage.data.payload?.headers || [];
    subject = headers.find(h => h.name === 'Subject')?.value || '';
    from = headers.find(h => h.name === 'From')?.value || '';

    // Conteúdo
    if (fullMessage.data.payload?.parts) {
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

    return NextResponse.json({
      message: 'Contúdo do e-mail extraído',
      email: {
        id: messageId,
        from,
        subject,
        content,
        contentLength: content.length
      }
    });

  } catch (error) {
    console.error('Erro ao extrair conteúdo:', error);
    return NextResponse.json(
      { error: 'Erro ao extrair conteúdo: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
