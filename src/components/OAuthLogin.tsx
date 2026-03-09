'use client';

import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Mail, CheckCircle, AlertCircle, Loader2, Settings } from 'lucide-react';

interface EnergyData {
  date: string;
  energiaConsumida: number;
  energiaComprada: number;
  energiaVendida: number;
  energiaGerada: number;
}

interface OAuthLoginProps {
  onConfigured: (data: EnergyData[]) => void;
}

export default function OAuthLogin({ onConfigured }: OAuthLoginProps) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    console.log('🔐 OAuthLogin useEffect executado');
    console.log('👤 Session:', session);
    console.log('🔑 AccessToken:', session?.accessToken);
    
    // Adicionar delay pequeno para evitar redirecionamento rápido
    const timer = setTimeout(() => {
      if (session?.accessToken) {
        console.log('✅ Tem accessToken - buscando e-mails');
        // Já está logado, buscar e-mails automaticamente
        fetchEmails();
      } else {
        console.log('❌ Sem accessToken - mostrando botão de login');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [session]);

  const fetchEmails = async () => {
    console.log('📧 fetchEmails chamado - INÍCIO');
    console.log('🔑 AccessToken disponível:', !!session?.accessToken);
    
    if (!session?.accessToken) {
      console.log('❌ Sem accessToken - abortando');
      return;
    }

    console.log('🚀 Iniciando busca de e-mails...');
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('� Iniciando fetch para /api/gmail');
      alert('🚀 Buscando e-mails... Verifique o console F12');
      const response = await fetch('/api/gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: session.accessToken
        }),
      });

      console.log('📡 Resposta recebida:', response.status, response.statusText);
      console.log('📋 Headers da resposta:', response.headers);

      const data = await response.json();

      if (response.ok) {
        setSuccess(`✅ ${data.message}`);
        console.log('📧 Resposta da API completa:', data);
        console.log('📊 Dados.data:', data.data);
        console.log('🔢 Tamanho de data.data:', data.data?.length);
        
        if (data.data && data.data.length > 0) {
          console.log('📊 Dados da API:', data.data);
          console.log('💾 Salvando no localStorage...');
          
          // Usar dados diretamente da API (já com campos corretos)
          onConfigured(data.data);
          localStorage.setItem('energyData', JSON.stringify(data.data));
          localStorage.setItem('oauthMode', 'true');
          
          console.log('✅ Dados salvos no localStorage');
          console.log('📊 onConfigured chamado com:', data.data);
        } else {
          console.log('❌ Nenhum dado recebido da API');
          console.log('📄 data.data:', data.data);
          console.log('📄 data:', data);
        }
      } else {
        console.log('❌ Erro na resposta da API:', data);
        setError(data.error || 'Erro ao buscar e-mails');
      }
    } catch (err: any) {
      console.log('❌ Erro no fetch:', err);
      console.log('❌ Detalhes do erro:', err?.message || err);
      setError('Erro de conexão com Gmail');
    } finally {
      console.log('🏁 Finally do fetchEmails');
      setIsLoading(false);
    }
  };

  const handleDebugEmails = async () => {
    if (!session?.accessToken) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/debug-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: session.accessToken
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const debugMessage = `
🔍 DEBUG - Análise completa de e-mails:

📊 Resultados das buscas:
- Todos os e-mails: ${data.searchResults.allEmails}
- Busca "from:takayama.sp@gmail.com": ${data.searchResults.takayamaEmails}
- Busca "from:kp-net@kp-net.com": ${data.searchResults.kpnetEmails}
- Busca "takayama" (conteúdo): ${data.searchResults.takayamaContent}

� Resumo dos e-mails recentes:
- Total: ${data.summary.total} e-mails
- Com "takayama": ${data.summary.fromTakayama}
- Da KP-Net: ${data.summary.fromKpNet}

� E-mails encontrados:
${data.emails.map((email: any, i: number) => 
  `${i+1}. ${email.isTakayama ? '🎯' : email.isKpNet ? '⚡' : '📧'} ${email.from}
   Assunto: ${email.subject}
   Data: ${email.date}`
).join('\n')}

💡 Dicas se não encontrar takayama.sp@gmail.com:
${data.recommendations.ifZeroTakayama.map((tip: string) => `   • ${tip}`).join('\n')}
        `.trim();

        setSuccess(debugMessage);
      } else {
        setError(data.error || 'Erro no debug');
      }
    } catch (err) {
      setError('Erro ao fazer debug dos e-mails');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailContent = async () => {
    if (!session?.accessToken) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Primeiro buscar conteúdo do e-mail
      const contentResponse = await fetch('/api/email-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: session.accessToken
        }),
      });

      const contentData = await contentResponse.json();

      if (contentResponse.ok) {
        const contentMessage = `
📧 CONTEÚDO COMPLETO DO E-MAIL:

De: ${contentData.email.from}
Assunto: ${contentData.email.subject}

📄 CONTEÚDO:
${contentData.email.content}

📏 Tamanho: ${contentData.email.contentLength} caracteres
        `.trim();

        setSuccess(contentMessage);
      } else {
        setError(contentData.error || 'Erro ao buscar conteúdo');
      }
    } catch (err) {
      setError('Erro ao buscar conteúdo do e-mail');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { 
        callbackUrl: '/',
        redirect: false 
      });
    } catch (error) {
      setError('Erro ao fazer login com Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
      localStorage.removeItem('oauthMode');
      setSuccess('Desconectado com sucesso');
    } catch (error) {
      setError('Erro ao fazer logout');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-neutral-800 rounded-lg shadow-xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-neutral-800 rounded-lg shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Login Automático - Gmail</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-300">{success}</span>
        </div>
      )}

      <div className="space-y-6">
        {session ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/30 border border-green-600 rounded-lg">
              <p className="text-green-300">
                ✅ Conectado como: <strong>{session.user?.email}</strong>
              </p>
              <p className="text-green-400 text-sm mt-2">
                Buscando automaticamente e-mails de kp-net@kp-net.com...
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={fetchEmails}
                disabled={isLoading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Buscar E-mails da KP-Net
                  </>
                )}
              </button>

              <button
                onClick={handleEmailContent}
                disabled={isLoading}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                title="Ver conteúdo completo do e-mail"
              >
                <Settings className="w-5 h-5" />
                Ver E-mail
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
              <p className="text-blue-300">
                🔐 Faça login com Gmail para acessar automaticamente os e-mails da KP-Net
              </p>
              <p className="text-blue-400 text-sm mt-2">
                • Busca automática de e-mails de kp-net@kp-net.com<br/>
                • Sem necessidade de senhas de app<br/>
                • Seguro com OAuth2
              </p>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Entrar com Google
                </>
              )}
            </button>
          </div>
        )}

        <div className="p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
          <p className="text-yellow-300 text-sm">
            <strong>Filtra automaticamente:</strong> kp-net@kp-net.com
          </p>
        </div>
      </div>
    </div>
  );
}
