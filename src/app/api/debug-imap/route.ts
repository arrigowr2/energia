import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, host } = await request.json();

    // Testes de conectividade básica
    const dnsResult = await testDNS(host);
    const connectivityResult = await testConnectivity(host);
    
    const results = {
      dns: dnsResult,
      connectivity: connectivityResult,
      suggestions: [] as string[]
    };

    // Adicionar sugestões baseadas nos resultados
    if (!results.dns.success) {
      results.suggestions.push('DNS não resolve. Verifique o nome do servidor.');
    }
    
    if (!results.connectivity.success) {
      results.suggestions.push('Servidor não responde. Tente outro servidor ou verifique firewall.');
    }

    // Sugestões específicas para Outlook
    if (host.includes('outlook') || host.includes('office365')) {
      results.suggestions.push('Para Outlook: verifique se IMAP está habilitado nas configurações.');
      results.suggestions.push('Use senha de aplicativo, não a senha normal.');
      results.suggestions.push('Tente porta 143 sem TLS como alternativa.');
    }

    return NextResponse.json(results);

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro no diagnóstico: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

async function testDNS(host: string): Promise<{ success: boolean; time?: string; error?: string }> {
  try {
    const start = Date.now();
    
    // Em Node.js, podemos usar dns.lookup
    const dns = require('dns');
    await new Promise((resolve, reject) => {
      dns.lookup(host, (err: any, address: any, family: any) => {
        if (err) reject(err);
        else resolve({ address, family });
      });
    });
    
    return { success: true, time: `${Date.now() - start}ms` };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function testConnectivity(host: string): Promise<{ success: boolean; time?: string; error?: string }> {
  try {
    const start = Date.now();
    
    // Testar porta 993 (IMAP SSL)
    const net = require('net');
    const socket = new net.Socket();
    
    await new Promise((resolve, reject) => {
      socket.setTimeout(5000);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Timeout'));
      });
      
      socket.on('error', (err: any) => {
        reject(err);
      });
      
      socket.connect(993, host);
    });
    
    return { success: true, time: `${Date.now() - start}ms` };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
