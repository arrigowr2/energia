'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Dashboard from '@/components/Dashboard';
import EmailConfig from '@/components/EmailConfig';
import OAuthLogin from '@/components/OAuthLogin';

export default function Home() {
  const { data: session, status } = useSession();
  const [energyData, setEnergyData] = useState([]);
  const [mode, setMode] = useState<'oauth' | 'imap' | 'demo'>('oauth');

  // Carregar dados do localStorage ao montar
  useEffect(() => {
    if (status === 'authenticated') {
      const savedData = localStorage.getItem('energyData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setEnergyData(parsedData);
        } catch (error) {
          console.error('Erro ao carregar dados salvos:', error);
        }
      }
    }
  }, [status]);

  const handleConfigured = (data: any) => {
    setEnergyData(data);
  };

  // Se estiver autenticado, mostrar dashboard
  if (status === 'authenticated') {
    return <Dashboard initialData={energyData} />;
  }

  // Se não estiver autenticado, mostrar página de login
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sistema de Monitoramento Energético
          </h1>
          <p className="text-gray-600 text-lg">
            Monitore seu consumo e geração de energia solar em tempo real
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setMode('oauth')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  mode === 'oauth'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                OAuth2 (Recomendado)
              </button>
              <button
                onClick={() => setMode('imap')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  mode === 'imap'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                IMAP (Alternativo)
              </button>
              <button
                onClick={() => setMode('demo')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  mode === 'demo'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Modo Demo
              </button>
            </div>
          </div>

          <div className="max-w-md mx-auto">
            {mode === 'oauth' && <OAuthLogin onConfigured={handleConfigured} />}
            {mode === 'imap' && <EmailConfig onConfigured={handleConfigured} />}
            {mode === 'demo' && <EmailConfig onConfigured={handleConfigured} />}
          </div>
        </div>
      </div>
    </div>
  );
}
