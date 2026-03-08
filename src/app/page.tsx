'use client';

import { useState, useEffect } from 'react';
import EmailConfig from '@/components/EmailConfig';
import EnergyDashboard from '@/components/EnergyDashboard';
import { Battery, Settings, BarChart3 } from 'lucide-react';

interface EnergyData {
  date: string;
  energiaProduzida: number;
  energiaConsumida: number;
  energiaVendida: number;
  energiaComprada: number;
}

export default function Home() {
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);

  // Verificar se já existe configuração salva
  useEffect(() => {
    const savedConfig = localStorage.getItem('emailConfig');
    const savedData = localStorage.getItem('energyData');
    if (savedConfig && savedData) {
      setEnergyData(JSON.parse(savedData));
      setIsConfigured(true);
    }
  }, []);

  const handleConfigured = (data: EnergyData[]) => {
    setEnergyData(data);
    setIsConfigured(true);
  };

  const handleReconfigure = () => {
    setIsConfigured(false);
    localStorage.removeItem('emailConfig');
  };

  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Battery className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Monitor de Energia</h1>
                <p className="text-neutral-400">Sistema inteligente para acompanhamento de dados energéticos</p>
              </div>
            </div>
            {isConfigured && (
              <button
                onClick={handleReconfigure}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Reconfigurar
              </button>
            )}
          </div>
        </header>

        {/* Conteúdo Principal */}
        <div className="space-y-8">
          {!isConfigured ? (
            <div className="space-y-6">
              {/* Hero Section */}
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Monitor de Energia</h2>
                <p className="text-neutral-400 max-w-2xl mx-auto">
                  Configure seu e-mail para começar a monitorar automaticamente os dados de energia 
                  enviados pela sua companhia elétrica. O sistema irá processar os e-mails diários 
                  e apresentar as informações em um dashboard interativo.
                </p>
              </div>

              {/* Formulário de Configuração */}
              <EmailConfig onConfigured={handleConfigured} />
            </div>
          ) : (
            <div>
              {energyData.length > 0 ? (
                <EnergyDashboard data={energyData} />
              ) : (
                <div className="text-center py-12">
                  <Battery className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-neutral-300 mb-2">
                    Configuração Concluída
                  </h3>
                  <p className="text-neutral-400 mb-6">
                    Seu e-mail foi configurado com sucesso, mas nenhum dado de energia foi encontrado 
                    nos e-mails recentes. Verifique se os e-mails da companhia elétrica estão chegando 
                    corretamente.
                  </p>
                  <button
                    onClick={handleReconfigure}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Verificar Configuração
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-neutral-800">
          <div className="text-center text-neutral-400 text-sm">
            <p>Monitor de Energia - Sistema automatizado de acompanhamento energético</p>
            <p className="mt-2">Dados processados localmente com segurança</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
