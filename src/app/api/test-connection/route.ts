import { NextRequest, NextResponse } from 'next/server';
import Imap from 'imap';

interface EmailConfig {
  email: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const config: EmailConfig = await request.json();

    if (!config.email || !config.password || !config.host) {
      return NextResponse.json(
        { error: 'Configurações incompletas' },
        { status: 400 }
      );
    }

    console.log('Testando conexão com:', {
      host: config.host,
      port: config.port,
      tls: config.tls,
      email: config.email
    });

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
      authTimeout: 30000,
      connTimeout: 30000
    });

    return new Promise((resolve) => {
      const startTime = Date.now();

      imap.once('ready', () => {
        const connectionTime = Date.now() - startTime;
        console.log('Conexão bem-sucedida em', connectionTime, 'ms');
        
        imap.end();
        resolve(NextResponse.json({
          success: true,
          message: 'Conexão IMAP estabelecida com sucesso!',
          connectionTime: `${connectionTime}ms`,
          details: {
            host: config.host,
            port: config.port,
            tls: config.tls
          }
        }));
      });

      imap.once('error', (err) => {
        const connectionTime = Date.now() - startTime;
        console.error('Erro de conexão:', err);
        
        resolve(NextResponse.json({
          success: false,
          error: 'Falha na conexão IMAP',
          details: err.message,
          connectionTime: `${connectionTime}ms`,
          troubleshooting: getSuggestion(err.message, config)
        }, { status: 500 }));
      });

      imap.connect();
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

function getSuggestion(errorMsg: string, config: EmailConfig): string {
  if (errorMsg.includes('LOGIN failed')) {
    return 'Verifique: 1) Senha de app está correta, 2) IMAP está habilitado, 3) Tente porta 143 sem TLS';
  }
  if (errorMsg.includes('timeout')) {
    return 'Timeout. Verifique servidor ou tente outlook.office365.com';
  }
  if (errorMsg.includes('certificate')) {
    return 'Erro SSL. Tente desabilitar TLS';
  }
  if (errorMsg.includes('ECONNREFUSED')) {
    return 'Conexão recusada. Verifique servidor e porta';
  }
  return 'Verifique configurações do servidor e credenciais';
}
