'use client';

import { useState, useEffect } from 'react';
import EmailConfig from '@/components/EmailConfig';
import OAuthLogin from '@/components/OAuthLogin';
import EnergyDashboard from '@/components/EnergyDashboard';
import { BarChart3, Mail, Shield } from 'lucide-react';

interface EnergyData {
  date: string;
  energiaProduzida: number;
  energiaConsumida: number;
  energiaVendida: number;
  energiaComprada: number;
}

export default function Home() {
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [configMode, setConfigMode] = useState<'oauth' | 'imap' | 'demo'>('oauth');

  useEffect(() => {
    // Verificar se já existe dados salvos
    const savedData = localStorage.getItem('energyData');
    const oauthMode = localStorage.getItem('oauthMode');
    
    if (savedData) {
      setEnergyData(JSON.parse(savedData));
      if (oauthMode) {
        setConfigMode('oauth');
      }
    }
  }, []);

  const handleConfigured = (data: EnergyData[]) => {
    setEnergyData(data);
  };

  if (energyData.length > 0) {
    return <EnergyDashboard data={energyData} />;
  }

  return (
    <div className="min-h-screen bg-neutral-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Dashboard de Energia
          </h1>
          <p className="text-neutral-300 text-lg">
            Sistema automático para monitoramento de dados energéticos
          </p>
        </div>

        {/* Selector de Modo */}
        <div className="flex justify-center mb-8">
          <div className="bg-neutral-800 rounded-lg p-1 flex gap-1">
            <button
              onClick={() => setConfigMode('oauth')}
              className={`px-6 py-2 rounded-md transition-all ${
                configMode === 'oauth'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              OAuth2
            </button>
            <button
              onClick={() => setConfigMode('imap')}
              className={`px-6 py-2 rounded-md transition-all ${
                configMode === 'imap'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              IMAP
            </button>
            <button
              onClick={() => setConfigMode('demo')}
              className={`px-6 py-2 rounded-md transition-all ${
                configMode === 'demo'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Demo
            </button>
          </div>
        </div>

        {/* Componente baseado no modo selecionado */}
        {configMode === 'oauth' && (
          <div className="mb-6 text-center">
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6">
              <h3 className="text-blue-300 font-semibold mb-2">
                🔐 Login Automático com OAuth2
              </h3>
              <p className="text-blue-400 text-sm">
                • Login seguro via Google<br/>
                • Busca automática de kp-net@kp-net.com<br/>
                • Sem necessidade de configurações manuais
              </p>
            </div>
            <OAuthLogin onConfigured={handleConfigured} />
          </div>
        )}

        {configMode === 'imap' && (
          <div className="mb-6 text-center">
            <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-4 mb-6">
              <h3 className="text-orange-300 font-semibold mb-2">
                📧 Configuração IMAP Manual
              </h3>
              <p className="text-orange-400 text-sm">
                • Requer senha de aplicativo<br/>
                • Configuração manual necessária<br/>
                • Pode ter restrições de segurança
              </p>
            </div>
            <EmailConfig onConfigured={handleConfigured} />
          </div>
        )}

        {configMode === 'demo' && (
          <div className="mb-6 text-center">
            <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 mb-6">
              <h3 className="text-green-300 font-semibold mb-2">
                📊 Modo Demonstração
              </h3>
              <p className="text-green-400 text-sm">
                • Dados de exemplo realísticos<br/>
                • Teste todas as funcionalidades<br/>
                • Sem necessidade de configuração
              </p>
            </div>
            <EmailConfig onConfigured={handleConfigured} />
          </div>
        )}
      </div>
    </div>
  );
}
