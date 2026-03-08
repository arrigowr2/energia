import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, password } = await request.json();

    // Para Outlook, vamos tentar usar a API Graph se for conta corporativa
    // Ou fornecer instruções específicas
    
    const suggestions = [
      'Para Outlook/Hotmail:',
      '1. Use senha de aplicativo (não senha normal)',
      '2. Habilite IMAP em: Configurações > Email > Encaminhamento e IMAP',
      '3. Para contas corporativas, pode ser necessário usar OAuth2',
      '4. Tente usar cliente Outlook para testar as mesmas credenciais',
      '5. Verifique se não há bloqueio de segurança na conta Microsoft'
    ];

    // Testes manuais que o usuário pode fazer
    const manualTests = [
      'Teste 1: Configure no Thunderbird com mesmas credenciais',
      'Teste 2: Use webmail para verificar se e-mails chegam',
      'Teste 3: Verifique se há alertas de segurança na conta Microsoft'
    ];

    return NextResponse.json({
      provider: 'Outlook/Hotmail',
      issue: 'IMAP authentication failed',
      suggestions: suggestions,
      manualTests: manualTests,
      alternative: 'Considere usar Gmail ou outro provedor para testar o sistema'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro na análise: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
