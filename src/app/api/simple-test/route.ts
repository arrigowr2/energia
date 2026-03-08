import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, host, port = 993 } = await request.json();

    console.log(`Testando conexão básica: ${host}:${port} para ${email}`);

    // Teste simples de conectividade
    const net = require('net');
    
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const startTime = Date.now();
      
      socket.setTimeout(10000); // 10 segundos timeout
      
      socket.on('connect', () => {
        const connectionTime = Date.now() - startTime;
        socket.destroy();
        
        resolve(NextResponse.json({
          success: true,
          message: `Conexão bem-sucedida com ${host}:${port}`,
          time: `${connectionTime}ms`,
          nextStep: 'Testando autenticação IMAP...'
        }));
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(NextResponse.json({
          success: false,
          error: `Timeout ao conectar em ${host}:${port}`,
          suggestions: [
            'Verifique sua conexão com a internet',
            'Firewall pode estar bloqueando a porta',
            'Servidor pode estar offline'
          ]
        }, { status: 500 }));
      });
      
      socket.on('error', (err: any) => {
        socket.destroy();
        resolve(NextResponse.json({
          success: false,
          error: `Erro de conexão: ${err.message}`,
          suggestions: [
            'Verifique o nome do servidor',
            'Tente outra porta',
            'Verifique configurações de rede'
          ]
        }, { status: 500 }));
      });
      
      socket.connect(port, host);
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro no teste: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
