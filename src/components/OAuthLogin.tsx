'use client';

import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface EnergyData {
  date: string;
  energiaProduzida: number;
  energiaConsumida: number;
  energiaVendida: number;
  energiaComprada: number;
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
    if (session?.accessToken) {
      // Já está logado, buscar e-mails automaticamente
      fetchEmails();
    }
  }, [session]);

  const fetchEmails = async () => {
    if (!session?.accessToken) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/gmail', {
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
        setSuccess(`✅ ${data.message}`);
        if (data.data && data.data.length > 0) {
          onConfigured(data.data);
          localStorage.setItem('energyData', JSON.stringify(data.data));
          localStorage.setItem('oauthMode', 'true');
        }
      } else {
        setError(data.error || 'Erro ao buscar e-mails');
      }
    } catch (err) {
      setError('Erro de conexão com Gmail');
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
                onClick={handleLogout}
                disabled={isLoading}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                Sair
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
