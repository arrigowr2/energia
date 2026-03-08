'use client';

import { useState, useEffect } from 'react';
import { Mail, Lock, Server, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface EmailProvider {
  name: string;
  host: string;
  port: number;
  tls: boolean;
  icon: string;
}

interface EmailConfig {
  email: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

interface EnergyData {
  date: string;
  energiaProduzida: number;
  energiaConsumida: number;
  energiaVendida: number;
  energiaComprada: number;
}

export default function EmailConfig({ onConfigured }: { onConfigured: (data: EnergyData[]) => void }) {
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider | null>(null);
  const [config, setConfig] = useState<EmailConfig>({
    email: '',
    password: '',
    host: '',
    port: 993,
    tls: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/email-providers');
      const data = await response.json();
      setProviders(data);
    } catch (err) {
      setError('Erro ao carregar provedores de e-mail');
    }
  };

  const handleProviderSelect = (provider: EmailProvider) => {
    setSelectedProvider(provider);
    setConfig(prev => ({
      ...prev,
      host: provider.host,
      port: provider.port,
      tls: provider.tls
    }));
  };

  const handleTestConnection = async () => {
    if (!config.email || !config.password || !config.host) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Primeiro testa diagnóstico básico
      const debugResponse = await fetch('/api/debug-imap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: config.email, host: config.host }),
      });

      const debugData = await debugResponse.json();

      if (!debugData.dns.success || !debugData.connectivity.success) {
        setError(`Problema de conectividade: ${debugData.suggestions.join(' ')}`);
        setIsLoading(false);
        return;
      }

      // Se conectividade OK, testa conexão IMAP
      const testResponse = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const testData = await testResponse.json();

      if (!testResponse.ok) {
        setError(testData.error || 'Erro ao testar conexão');
        setIsLoading(false);
        return;
      }

      // Se a conexão funcionar, busca os dados
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Conexão estabelecida em ${testData.connectionTime}! ${data.message}`);
        if (data.data && data.data.length > 0) {
          onConfigured(data.data);
          localStorage.setItem('energyData', JSON.stringify(data.data));
          localStorage.setItem('emailConfig', JSON.stringify(config));
        }
      } else {
        setError(data.error || 'Erro ao buscar e-mails');
      }
    } catch (err) {
      setError('Erro de conexão. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-neutral-800 rounded-lg shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Configurar E-mail de Energia</h2>
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
        {/* Seleção de Provedor */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-3">
            Selecione seu provedor de e-mail
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {providers.map((provider) => (
              <button
                key={provider.name}
                onClick={() => handleProviderSelect(provider)}
                className={`p-3 rounded-lg border transition-all ${
                  selectedProvider?.name === provider.name
                    ? 'bg-blue-600 border-blue-400 text-white'
                    : 'bg-neutral-700 border-neutral-600 text-neutral-300 hover:bg-neutral-600'
                }`}
              >
                <div className="text-2xl mb-1">{provider.icon}</div>
                <div className="text-sm font-medium">{provider.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Configurações Personalizadas */}
        {selectedProvider?.name === 'Custom' && (
          <div className="space-y-4 p-4 bg-neutral-700 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Servidor IMAP
              </label>
              <div className="relative">
                <Server className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={config.host}
                  onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 bg-neutral-600 border border-neutral-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="imap.exemplo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Porta
                </label>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-neutral-600 border border-neutral-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="tls"
                  checked={config.tls}
                  onChange={(e) => setConfig(prev => ({ ...prev, tls: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="tls" className="text-sm text-neutral-300">
                  Usar TLS/SSL
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Credenciais */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="email"
                value={config.email}
                onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 bg-neutral-600 border border-neutral-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="password"
                value={config.password}
                onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 bg-neutral-600 border border-neutral-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sua senha"
              />
            </div>
          </div>
        </div>

        {/* Aviso de Segurança */}
        <div className="p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg flex items-start gap-2">
          <Shield className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div className="text-sm text-yellow-300">
            <p className="font-medium mb-1">Aviso de Segurança:</p>
            <p>Suas credenciais são usadas apenas para acessar seus e-mails localmente e não são armazenadas em nossos servidores.</p>
          </div>
        </div>

        {/* Botão de Ação */}
        <button
          onClick={handleTestConnection}
          disabled={isLoading || !config.email || !config.password}
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
              Conectar e Buscar Dados
            </>
          )}
        </button>
      </div>
    </div>
  );
}
