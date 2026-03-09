'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Sun, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Moon,
  Lightbulb,
  LogIn,
  X
} from 'lucide-react';
import OAuthLogin from './OAuthLogin';

interface EnergyData {
  date: string;
  energiaConsumida: number;
  energiaComprada: number;
  energiaVendida: number;
  energiaGerada: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<EnergyData[]>([]);
  const [filteredData, setFilteredData] = useState<EnergyData[]>([]);
  const [dateRange, setDateRange] = useState<'latest' | 'week' | 'month' | 'year' | 'custom'>('latest');
  const [customDate, setCustomDate] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Adicionar log para status do session
  useEffect(() => {
    console.log('🔍 Status da sessão mudou:', status);
    console.log('👤 Dados da sessão:', session);
  }, [status, session]);

  // Carregar dados do localStorage apenas uma vez
  useEffect(() => {
    if (hasLoadedData) {
      console.log('⏭️ Dados já carregados, pulando...');
      return;
    }
    
    console.log('🔄 Carregando dados do localStorage...');
    const savedData = localStorage.getItem('energyData');
    console.log('📦 Dados encontrados:', savedData);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('📊 Dados parseados:', parsedData);
        setData(parsedData);
        setFilteredData(parsedData);
        setHasLoadedData(true);
      } catch (error) {
        console.error('❌ Erro ao carregar dados salvos:', error);
      }
    } else {
      console.log('📭 Nenhum dado encontrado no localStorage');
    }
  }, [status, hasLoadedData]);

  // Salvar dados no localStorage quando mudar
  useEffect(() => {
    if (data.length > 0) {
      console.log('💾 Salvando dados no localStorage:', data.length, 'itens');
      localStorage.setItem('energyData', JSON.stringify(data));
    }
  }, [data]);

  // Adicionar log para monitorar localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('🔄 localStorage mudou:', localStorage.getItem('energyData'));
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Função para atualizar dados quando login é feito
  const handleDataUpdate = (newData: any[]) => {
    console.log('📊 Dados recebidos no handleDataUpdate:', newData);
    console.log('🔢 Quantidade de dados:', newData.length);
    
    if (newData && newData.length > 0) {
      setData(newData);
      setFilteredData(newData);
      setShowLogin(false); // Fechar modal após login
      console.log('✅ Dados atualizados com sucesso');
    } else {
      console.log('❌ Nenhum dado recebido');
    }
  };

  // Aplicar filtros
  useEffect(() => {
    console.log('🔍 Aplicando filtros...');
    console.log('📊 Dados atuais:', data);
    console.log('📅 Filtro selecionado:', dateRange);
    
    if (data.length === 0) {
      console.log('📭 Sem dados para filtrar');
      return;
    }

    let filtered = [...data];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange) {
      case 'latest':
        // Mostrar apenas o último dado disponível (mais recente)
        if (filtered.length > 0) {
          // Ordenar por data decrescente e pegar o primeiro (mais recente)
          filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          filtered = [filtered[0]];
          console.log('📅 Filtro "Último" aplicado:', filtered.length, 'itens - Data:', filtered[0]?.date);
        }
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= weekAgo;
        });
        console.log('📅 Filtro "Semana" aplicado:', filtered.length, 'itens');
        break;
      case 'month':
        filtered = data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getMonth() === now.getMonth() && 
                 itemDate.getFullYear() === now.getFullYear();
        });
        console.log('📅 Filtro "Mês" aplicado:', filtered.length, 'itens');
        break;
      case 'year':
        filtered = data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getFullYear() === now.getFullYear();
        });
        console.log('📅 Filtro "Ano" aplicado:', filtered.length, 'itens');
        break;
      case 'custom':
        if (customDate) {
          const custom = new Date(customDate);
          filtered = data.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.toDateString() === custom.toDateString();
          });
          console.log('📅 Filtro "Custom" aplicado:', filtered.length, 'itens');
        }
        break;
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setFilteredData(filtered);
    console.log('📊 Dados filtrados finais:', filtered);
  }, [data, dateRange, customDate]);

  // Calcular estatísticas
  const calculateStats = () => {
    if (filteredData.length === 0) return null;

    const latest = filteredData[0];
    const previous = filteredData[1];

    return {
      consumo: {
        current: latest.energiaConsumida,
        previous: previous?.energiaConsumida || 0,
        change: previous ? ((latest.energiaConsumida - previous.energiaConsumida) / previous.energiaConsumida * 100) : 0
      },
      comprado: {
        current: latest.energiaComprada,
        previous: previous?.energiaComprada || 0,
        change: previous ? ((latest.energiaComprada - previous.energiaComprada) / previous.energiaComprada * 100) : 0
      },
      vendido: {
        current: latest.energiaVendida,
        previous: previous?.energiaVendida || 0,
        change: previous ? ((latest.energiaVendida - previous.energiaVendida) / previous.energiaVendida * 100) : 0
      },
      gerado: {
        current: latest.energiaGerada,
        previous: previous?.energiaGerada || 0,
        change: previous ? ((latest.energiaGerada - previous.energiaGerada) / previous.energiaGerada * 100) : 0
      }
    };
  };

  const stats = calculateStats();

  // Componente de card
  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color,
    borderColor 
  }: { 
    title: string; 
    value: number; 
    change: number; 
    icon: any; 
    color: string;
    borderColor: string;
  }) => (
    <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border-2 ${borderColor}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          change >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {change >= 0 ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        {value.toFixed(1)} kWh
      </div>
      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {title}
      </div>
    </div>
  );

  const renderLoginButton = () => {
    console.log('🔐 renderLoginButton chamado, status:', status);
    
    if (status === 'authenticated') {
      console.log('✅ Usuário autenticado - mostrando botão logout');
      return (
        <button
          onClick={() => {
            console.log('🚪 Botão logout clicado');
            signOut();
          }}
          className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-red-400' : 'bg-white text-red-600'} shadow-lg`}
          title="Sair"
        >
          <LogIn className="w-5 h-5" />
        </button>
      );
    }
    
    if (status === 'unauthenticated') {
      console.log('❌ Usuário não autenticado - mostrando botão login');
      return (
        <button
          onClick={() => {
            console.log('🔑 Botão login clicado');
            setShowLogin(!showLogin);
          }}
          className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-blue-400' : 'bg-white text-blue-600'} shadow-lg`}
          title="Fazer login"
        >
          <LogIn className="w-5 h-5" />
        </button>
      );
    }
    
    console.log('⏳ Status loading - nenhum botão');
    return null;
  };

  // Se não estiver autenticado, mostrar dashboard com login suspenso
  if (status === 'unauthenticated') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-8`}>
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Dashboard Energético
              </h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                Monitoramento de energia em tempo real
              </p>
            </div>
            <div className="flex gap-4 items-center">
              {/* Filtros de data */}
              <div className="flex gap-2">
                <button
                  onClick={() => setDateRange('latest')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    dateRange === 'latest' 
                      ? 'bg-blue-600 text-white' 
                      : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                  }`}
                >
                  Último
                </button>
                <button
                  onClick={() => setDateRange('week')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    dateRange === 'week' 
                      ? 'bg-blue-600 text-white' 
                      : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setDateRange('month')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    dateRange === 'month' 
                      ? 'bg-blue-600 text-white' 
                      : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                  }`}
                >
                  Mês
                </button>
                <button
                  onClick={() => setDateRange('year')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    dateRange === 'year' 
                      ? 'bg-blue-600 text-white' 
                      : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                  }`}
                >
                  Ano
                </button>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setDateRange('custom');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                  }`}
                />
              </div>
              
              {/* Botões de ação */}
              <div className="flex gap-2 items-center">
                {renderLoginButton()}
                
                {/* Botão de teste - TEMPORÁRIO - VERSÃO SIMPLES */}
                <button
                  onClick={() => {
                    console.log('🧪 TESTE SIMPLES INICIADO');
                    
                    // Criar datas de hoje, ontem e anteontem
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    const twoDaysAgo = new Date(today);
                    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                    
                    const formatDate = (d: Date) => d.toISOString().split('T')[0];
                    
                    // Dados de teste com datas ATUAIS
                    const testData = [
                      { date: formatDate(today), energiaConsumida: 25.5, energiaComprada: 15.2, energiaVendida: 8.3, energiaGerada: 18.6 },
                      { date: formatDate(yesterday), energiaConsumida: 23.1, energiaComprada: 14.8, energiaVendida: 7.9, energiaGerada: 17.2 },
                      { date: formatDate(twoDaysAgo), energiaConsumida: 26.8, energiaComprada: 16.1, energiaVendida: 9.2, energiaGerada: 19.9 }
                    ];
                    
                    console.log('📅 Datas geradas:', testData.map(d => d.date));
                    
                    // Salvar direto no localStorage
                    localStorage.setItem('energyData', JSON.stringify(testData));
                    console.log('💾 localStorage salvo');
                    
                    // Atualizar estado diretamente
                    setData(testData);
                    setFilteredData(testData);
                    console.log('📊 Estado atualizado - data:', testData.length, 'itens');
                    
                    alert('✅ Dados de teste aplicados com datas de HOJE!\n\nDatas: ' + testData.map(d => d.date).join(', '));
                  }}
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-800 text-green-400' : 'bg-green-100 text-green-600'} shadow-lg font-bold`}
                  title="Testar dados (VERSÃO SIMPLES)"
                >
                  🧪
                </button>
                
                {/* Botão de buscar emails - REQUER LOGIN */}
                <button
                  onClick={async () => {
                    console.log('📧 Botão buscar emails clicado');
                    
                    if ((status as string) !== 'authenticated') {
                      alert('❌ Faça login primeiro! Clique no ícone de cadeado 🔐');
                      return;
                    }
                    
                    const accessToken = (session as any)?.accessToken;
                    
                    if (!accessToken) {
                      alert('❌ Token de acesso não disponível');
                      return;
                    }
                    
                    console.log('📧 Iniciando busca de emails...');
                    console.log('🔑 Token:', accessToken.substring(0, 20) + '...');
                    
                    try {
                      const response = await fetch('/api/gmail', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ accessToken })
                      });
                      
                      console.log('📡 Status da resposta:', response.status);
                      const data = await response.json();
                      console.log('📊 Dados recebidos:', data);
                      
                      if (response.ok && data.data && data.data.length > 0) {
                        console.log('✅', data.data.length, 'emails processados');
                        handleDataUpdate(data.data);
                        alert('✅ ' + data.data.length + ' registros de energia carregados!');
                      } else {
                        console.log('❌ Nenhum dado encontrado:', data.error || data.message);
                        alert('❌ ' + (data.error || 'Nenhum dado encontrado nos emails'));
                      }
                    } catch (err: any) {
                      console.log('❌ Erro:', err);
                      alert('❌ Erro ao buscar: ' + err.message);
                    }
                  }}
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-800 text-blue-400' : 'bg-blue-100 text-blue-600'} shadow-lg font-bold`}
                  title="Buscar emails do Gmail (requer login)"
                >
                  📧
                </button>
                
                {/* Botão dark mode */}
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600'} shadow-lg`}
                >
                  {isDarkMode ? <Moon className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de login */}
        {showLogin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-8`}>
              <div className="flex justify-between items-center mb-8">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Faça Login
                </h2>
                <button
                  onClick={() => {
                    console.log('❌ Botão fechar modal clicado');
                    setShowLogin(false);
                  }}
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className={`text-center mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Sun className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                <p className="mb-4">Faça login com Gmail para visualizar seus dados energéticos</p>
                <p className="text-sm opacity-75">Dados automáticos de kp-net@kp-net.com</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-blue-600 mb-2">🔐 Clique abaixo para fazer login</p>
                <OAuthLogin onConfigured={handleDataUpdate} />
              </div>
            </div>
          </div>
        )}

        {/* Dashboard sem dados - mensagem para fazer login */}
        <div className="max-w-7xl mx-auto">
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Faça login para visualizar seus dados energéticos</p>
            <p className="text-sm opacity-75">Clique no ícone de login no canto superior direito</p>
          </div>
        </div>
      </div>
    );
  }

  // Se estiver carregando
  if (status === 'loading') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        {/* Modal de login - disponível mesmo durante loading */}
        {showLogin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-8`}>
              <div className="flex justify-between items-center mb-8">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Faça Login</h2>
                <button onClick={() => setShowLogin(false)} className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}><X className="w-5 h-5" /></button>
              </div>
              <div className={`text-center mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Sun className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                <p className="mb-4">Faça login com Gmail para visualizar seus dados energéticos</p>
                <p className="text-sm opacity-75">Dados automáticos de kp-net@kp-net.com</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-blue-600 mb-2">🔐 Clique abaixo para fazer login</p>
                <OAuthLogin onConfigured={handleDataUpdate} />
              </div>
            </div>
          </div>
        )}
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>Carregando...</p>
          
          {/* Botões de teste - disponíveis mesmo durante loading */}
          <div className="flex gap-2 justify-center mt-8">
            <button
              onClick={() => {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const twoDaysAgo = new Date(today);
                twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                const formatDate = (d: Date) => d.toISOString().split('T')[0];
                const testData = [
                  { date: formatDate(today), energiaConsumida: 25.5, energiaComprada: 15.2, energiaVendida: 8.3, energiaGerada: 18.6 },
                  { date: formatDate(yesterday), energiaConsumida: 23.1, energiaComprada: 14.8, energiaVendida: 7.9, energiaGerada: 17.2 },
                  { date: formatDate(twoDaysAgo), energiaConsumida: 26.8, energiaComprada: 16.1, energiaVendida: 9.2, energiaGerada: 19.9 }
                ];
                localStorage.setItem('energyData', JSON.stringify(testData));
                setData(testData);
                setFilteredData(testData);
                alert('✅ Dados de teste aplicados! Recarregue a página.');
              }}
              className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-800 text-green-400' : 'bg-green-100 text-green-600'} shadow-lg font-bold`}
              title="Testar dados"
            >
              🧪
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-8`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Dashboard Energético
            </h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Monitoramento de energia em tempo real
            </p>
          </div>
          <div className="flex gap-4 items-center">
            {/* Filtros de data */}
            <div className="flex gap-2">
              <button
                onClick={() => setDateRange('latest')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateRange === 'latest' 
                    ? 'bg-blue-600 text-white' 
                    : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                }`}
              >
                Último
              </button>
              <button
                onClick={() => setDateRange('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateRange === 'week' 
                    ? 'bg-blue-600 text-white' 
                    : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setDateRange('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateRange === 'month' 
                    ? 'bg-blue-600 text-white' 
                    : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => setDateRange('year')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateRange === 'year' 
                    ? 'bg-blue-600 text-white' 
                    : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                }`}
              >
                Ano
              </button>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateRange('custom');
                }}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                }`}
              />
            </div>
            
            {/* Botões de ação */}
            <div className="flex gap-2 items-center">
              {/* Botão de login/logout (sempre visível) */}
              {status === 'authenticated' ? (
                <button
                  onClick={() => signOut()}
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-red-400' : 'bg-white text-red-600'} shadow-lg`}
                  title="Sair"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              ) : status === 'unauthenticated' ? (
                <button
                  onClick={() => setShowLogin(!showLogin)}
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-blue-400' : 'bg-white text-blue-600'} shadow-lg`}
                  title="Fazer login"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              ) : null}
              
              {/* Botão de teste - TEMPORÁRIO */}
              <button
                onClick={() => {
                  console.log('🧪 TESTE SIMPLES INICIADO');
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);
                  const twoDaysAgo = new Date(today);
                  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                  const formatDate = (d: Date) => d.toISOString().split('T')[0];
                  const testData = [
                    { date: formatDate(today), energiaConsumida: 25.5, energiaComprada: 15.2, energiaVendida: 8.3, energiaGerada: 18.6 },
                    { date: formatDate(yesterday), energiaConsumida: 23.1, energiaComprada: 14.8, energiaVendida: 7.9, energiaGerada: 17.2 },
                    { date: formatDate(twoDaysAgo), energiaConsumida: 26.8, energiaComprada: 16.1, energiaVendida: 9.2, energiaGerada: 19.9 }
                  ];
                  localStorage.setItem('energyData', JSON.stringify(testData));
                  setData(testData);
                  setFilteredData(testData);
                  alert('✅ Dados de teste aplicados!');
                }}
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-800 text-green-400' : 'bg-green-100 text-green-600'} shadow-lg font-bold`}
                title="Testar dados"
              >
                🧪
              </button>
              
              {/* Botão de buscar emails */}
              <button
                onClick={async () => {
                  if ((status as string) !== 'authenticated') {
                    alert('❌ Faça login primeiro!');
                    return;
                  }
                  const accessToken = (session as any)?.accessToken;
                  if (!accessToken) {
                    alert('❌ Token não disponível');
                    return;
                  }
                  try {
                    const response = await fetch('/api/gmail', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ accessToken })
                    });
                    const data = await response.json();
                    if (response.ok && data.data?.length > 0) {
                      handleDataUpdate(data.data);
                      alert('✅ ' + data.data.length + ' registros carregados!');
                    } else {
                      alert('❌ ' + (data.error || 'Nenhum dado encontrado'));
                    }
                  } catch (err: any) {
                    alert('❌ Erro: ' + err.message);
                  }
                }}
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-800 text-blue-400' : 'bg-blue-100 text-blue-600'} shadow-lg font-bold`}
                title="Buscar emails"
              >
                📧
              </button>
              
              {/* Botão dark mode */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600'} shadow-lg`}
              >
                {isDarkMode ? <Moon className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto">
        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Ordem: Produzido → Consumido → Vendida → Comprada */}
            <StatCard
              title="Produzido Hoje"
              value={stats.gerado.current}
              change={stats.gerado.change}
              icon={Sun}
              color="bg-green-600"
              borderColor="border-green-500/30"
            />
            <StatCard
              title="Consumido Hoje"
              value={stats.consumo.current}
              change={stats.consumo.change}
              icon={Zap}
              color="bg-blue-600"
              borderColor="border-blue-500/30"
            />
            <StatCard
              title="Energia Vendida"
              value={stats.vendido.current}
              change={stats.vendido.change}
              icon={ArrowUpRight}
              color="bg-yellow-600"
              borderColor="border-yellow-500/30"
            />
            <StatCard
              title="Energia Comprada"
              value={stats.comprado.current}
              change={stats.comprado.change}
              icon={ArrowDownRight}
              color="bg-red-600"
              borderColor="border-red-500/30"
            />
          </div>
        ) : (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhum dado encontrado para o período selecionado</p>
          </div>
        )}

        {/* Tabela de dados */}
        {filteredData.length > 0 && (
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Histórico de Dados
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Data</th>
                    <th className={`text-right py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Consumo</th>
                    <th className={`text-right py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Comprado</th>
                    <th className={`text-right py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Vendido</th>
                    <th className={`text-right py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Gerado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={index} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {new Date(item.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className={`text-right py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {item.energiaConsumida.toFixed(2)}
                      </td>
                      <td className={`text-right py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {item.energiaComprada.toFixed(2)}
                      </td>
                      <td className={`text-right py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {item.energiaVendida.toFixed(2)}
                      </td>
                      <td className={`text-right py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {item.energiaGerada.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de login - disponível em todos os estados */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-8`}>
            <div className="flex justify-between items-center mb-8">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Faça Login</h2>
              <button onClick={() => setShowLogin(false)} className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}><X className="w-5 h-5" /></button>
            </div>
            <div className={`text-center mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <Sun className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <p className="mb-4">Faça login com Gmail para visualizar seus dados energéticos</p>
              <p className="text-sm opacity-75">Dados automáticos de kp-net@kp-net.com</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-600 mb-2">🔐 Clique abaixo para fazer login</p>
              <OAuthLogin onConfigured={handleDataUpdate} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
