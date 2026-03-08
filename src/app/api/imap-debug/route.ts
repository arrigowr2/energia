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

    console.log('=== DEBUG IMAP ===');
    console.log('Host:', config.host);
    console.log('Port:', config.port);
    console.log('TLS:', config.tls);
    console.log('Email:', config.email);
    console.log('Password Length:', config.password.length);

    // Testar diferentes configurações para Gmail
    const gmailConfigs = [
      {
        name: 'Gmail Padrão',
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      },
      {
        name: 'Gmail TLS Strict',
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: true }
      }
    ];

    // Testar diferentes configurações para Outlook
    const outlookConfigs = [
      {
        name: 'Outlook Office365',
        host: 'outlook.office365.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      },
      {
        name: 'Outlook Porta 143',
        host: 'outlook.office365.com',
        port: 143,
        tls: false,
        tlsOptions: { rejectUnauthorized: false }
      },
      {
        name: 'Outlook Alt Server',
        host: 'imap-mail.outlook.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      }
    ];

    const configs = config.host.includes('gmail') ? gmailConfigs : outlookConfigs;
    const results = [];

    for (const testConfig of configs) {
      console.log(`\n--- Testando: ${testConfig.name} ---`);
      
      try {
        const result = await testImapConnection({
          ...config,
          ...testConfig
        });
        
        results.push({
          config: testConfig.name,
          success: true,
          message: result.message,
          time: result.time
        });
        
        // Se funcionou, podemos parar
        break;
        
      } catch (error) {
        results.push({
          config: testConfig.name,
          success: false,
          error: (error as Error).message
        });
      }
    }

    return NextResponse.json({
      provider: config.host.includes('gmail') ? 'Gmail' : 'Outlook',
      results: results,
      suggestions: getSuggestions(results)
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro no debug: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

async function testImapConnection(config: any): Promise<{ message: string; time: string }> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.email,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: config.tlsOptions || { rejectUnauthorized: false },
      authTimeout: 30000,
      connTimeout: 30000
    });

    const startTime = Date.now();

    imap.once('ready', () => {
      const time = Date.now() - startTime;
      imap.end();
      resolve({ message: 'Conexão bem-sucedida', time: `${time}ms` });
    });

    imap.once('error', (err) => {
      const time = Date.now() - startTime;
      console.error(`Erro em ${config.host}:${config.port}:`, err.message);
      reject(new Error(`${err.message} (${time}ms)`));
    });

    imap.connect();
  });
}

function getSuggestions(results: any[]): string[] {
  const suggestions = [];
  
  if (results.every(r => !r.success)) {
    if (results.some(r => r.error?.includes('LOGIN failed'))) {
      suggestions.push('Use senha de aplicativo, não a senha normal');
      suggestions.push('Verifique se 2FA está habilitada e gere nova senha de app');
    }
    
    if (results.some(r => r.error?.includes('timeout'))) {
      suggestions.push('Verifique sua conexão com a internet');
      suggestions.push('Firewall pode estar bloqueando');
    }
    
    if (results.some(r => r.error?.includes('certificate'))) {
      suggestions.push('Problema de certificado SSL/TLS');
      suggestions.push('Tente configurar sem TLS');
    }
  }
  
  return suggestions;
}
