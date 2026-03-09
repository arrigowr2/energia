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
  const [showHistory, setShowHistory] = useState(false);

  // Adicionar log para status do session
  useEffect(() => {
    console.log('🔍 Status da sessão mudou:', status);
    console.log('👤 Dados da sessão:', session);
    
    // Carregar dados automaticamente após login
    if (status === 'authenticated' && session?.accessToken && !hasLoadedData) {
      console.log('🔄 Login detectado! Buscando dados automaticamente...');
      fetchEmailsAfterLogin();
    }
  }, [status, session, hasLoadedData]);
  
  // Função para buscar emails após login
  const fetchEmailsAfterLogin = async () => {
    const accessToken = (session as any)?.accessToken;
    if (!accessToken) {
      console.log('❌ Token não disponível');
      return;
    }
    
    try {
      console.log('📧 Buscando emails automaticamente...');
      const response = await fetch('/api/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
      });
      
      const data = await response.json();
      console.log('📊 Dados recebidos:', data);
      
      if (response.ok && data.data?.length > 0) {
        console.log('✅', data.data.length, 'registros carregados automaticamente');
        handleDataUpdate(data.data);
      } else {
        console.log('⚠️ Nenhum dado encontrado nos emails');
      }
    } catch (err: any) {
      console.error('❌ Erro ao buscar emails:', err);
    }
  };

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
    // Não retorna mais uma view separada - vai direto para o dashboard principal
    // O usuário pode fazer login pelo botão no header
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
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header estilo Painel Solar */}
      <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-slate-800'} text-white py-4 px-4 sm:px-6 lg:px-8 shadow-lg`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo e título */}
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Painel Solar</h1>
              <p className="text-xs text-gray-400">Monitoramento de Energia</p>
            </div>
          </div>

          {/* Filtros de data e ações */}
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
            {/* Filtros de data */}
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={() => setDateRange('latest')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === 'latest' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Último
              </button>
              <button
                onClick={() => setDateRange('week')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === 'week' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setDateRange('month')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === 'month' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => setDateRange('year')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === 'year' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Ano
              </button>
            </div>

            {/* Date picker */}
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setDateRange('custom');
              }}
              className="px-3 py-1.5 rounded-lg text-sm bg-gray-700 text-white border-none outline-none"
            />

            {/* Botões de ação */}
            <div className="flex gap-2 items-center border-l border-gray-600 pl-2">
              {/* Botão de login/logout */}
              {status === 'authenticated' ? (
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1.5 rounded-lg flex items-center gap-2 bg-gray-700 text-red-400 hover:bg-gray-600 text-sm"
                  title="Sair"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              ) : status === 'unauthenticated' ? (
                <button
                  onClick={() => setShowLogin(!showLogin)}
                  className="px-3 py-1.5 rounded-lg flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-500 text-sm"
                  title="Fazer login"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Entrar</span>
                </button>
              ) : null}

              {/* Botão dark mode */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 rounded-lg bg-gray-700 text-yellow-400 hover:bg-gray-600"
              >
                {isDarkMode ? <Moon className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4 sm:p-6 lg:p-8">

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto">
        {stats ? (
          <>
            <div className="mb-4">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Último Dado ({filteredData[0]?.date ? new Date(filteredData[0].date).toLocaleDateString('pt-BR') : ''})
              </h2>
            </div>
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
        </>
        ) : (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhum dado encontrado para o período selecionado</p>
          </div>
        )}

        {/* Gráficos de Barras */}
        {filteredData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico 1: Produzido vs Consumido */}
            <div className={`p-4 sm:p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border border-gray-200 dark:border-gray-700`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {dateRange === 'week' && 'Evolução Semanal (7 dias)'}
                {dateRange === 'month' && 'Evolução Mensal (30 dias)'}
                {dateRange === 'year' && 'Evolução Anual (12 meses)'}
                {dateRange === 'latest' && 'Evolução da Energia'}
                {dateRange === 'custom' && 'Evolução da Energia'}
              </h3>
              <div className="relative" style={{ width: '100%', height: 280 }}>
                {/* Escala Y */}
                <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500">
                  {(() => {
                    const maxVal = Math.max(...filteredData.map(d => Math.max(d.energiaGerada, d.energiaConsumida)), 1);
                    const steps = [1, 0.75, 0.5, 0.25, 0];
                    return steps.map(step => (
                      <span key={step}>{(maxVal * step).toFixed(0)} kWh</span>
                    ));
                  })()}
                </div>
                {/* Área do gráfico */}
                <div className="absolute left-14 right-4 top-0 bottom-8">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} ${i === 4 ? 'border-b' : ''}`}></div>
                    ))}
                  </div>
                  {/* Barras */}
                  <div className="absolute inset-0 flex items-end justify-around px-2">
                    {filteredData.slice(0, dateRange === 'year' ? 12 : dateRange === 'month' ? 30 : 7).map((item, index) => {
                      const maxVal = Math.max(...filteredData.map(d => Math.max(d.energiaGerada, d.energiaConsumida)), 1);
                      const h1 = (item.energiaGerada / maxVal) * 100;
                      const h2 = (item.energiaConsumida / maxVal) * 100;
                      const label = dateRange === 'year'
                        ? new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
                        : new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                      return (
                        <div key={index} className="flex flex-col items-center flex-1 px-0.5">
                          <div className="flex items-end gap-0.5 sm:gap-1 h-[200px]">
                            <div className="bg-green-500 w-3 sm:w-4 md:w-6 rounded-t-sm transition-all" style={{ height: `${h1}%` }} title={`Produzido: ${item.energiaGerada.toFixed(1)} kWh`}></div>
                            <div className="bg-blue-500 w-3 sm:w-4 md:w-6 rounded-t-sm transition-all" style={{ height: `${h2}%` }} title={`Consumido: ${item.energiaConsumida.toFixed(1)} kWh`}></div>
                          </div>
                          <p className={`text-[10px] sm:text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center`}>{label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-4 sm:gap-6 mt-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded"></div>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Produzida</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded"></div>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Consumida</span>
                </div>
              </div>
            </div>

            {/* Gráfico 2: Comprado vs Vendido */}
            <div className={`p-4 sm:p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border border-gray-200 dark:border-gray-700`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {dateRange === 'week' && 'Comparativo Semanal (7 dias)'}
                {dateRange === 'month' && 'Comparativo Mensal (30 dias)'}
                {dateRange === 'year' && 'Comparativo Anual (12 meses)'}
                {dateRange === 'latest' && 'Energia Comprada vs Vendida'}
                {dateRange === 'custom' && 'Energia Comprada vs Vendida'}
              </h3>
              <div className="relative" style={{ width: '100%', height: 280 }}>
                {/* Escala Y */}
                <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500">
                  {(() => {
                    const maxVal = Math.max(...filteredData.map(d => Math.max(d.energiaComprada, d.energiaVendida)), 1);
                    const steps = [1, 0.75, 0.5, 0.25, 0];
                    return steps.map(step => (
                      <span key={step}>{(maxVal * step).toFixed(0)} kWh</span>
                    ));
                  })()}
                </div>
                {/* Área do gráfico */}
                <div className="absolute left-14 right-4 top-0 bottom-8">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} ${i === 4 ? 'border-b' : ''}`}></div>
                    ))}
                  </div>
                  {/* Barras */}
                  <div className="absolute inset-0 flex items-end justify-around px-2">
                    {filteredData.slice(0, dateRange === 'year' ? 12 : dateRange === 'month' ? 30 : 7).map((item, index) => {
                      const maxVal = Math.max(...filteredData.map(d => Math.max(d.energiaComprada, d.energiaVendida)), 1);
                      const h1 = (item.energiaComprada / maxVal) * 100;
                      const h2 = (item.energiaVendida / maxVal) * 100;
                      const label = dateRange === 'year'
                        ? new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
                        : new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                      return (
                        <div key={index} className="flex flex-col items-center flex-1 px-0.5">
                          <div className="flex items-end gap-0.5 sm:gap-1 h-[200px]">
                            <div className="bg-red-500 w-3 sm:w-4 md:w-6 rounded-t-sm transition-all" style={{ height: `${h1}%` }} title={`Comprado: ${item.energiaComprada.toFixed(1)} kWh`}></div>
                            <div className="bg-yellow-500 w-3 sm:w-4 md:w-6 rounded-t-sm transition-all" style={{ height: `${h2}%` }} title={`Vendido: ${item.energiaVendida.toFixed(1)} kWh`}></div>
                          </div>
                          <p className={`text-[10px] sm:text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center`}>{label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-4 sm:gap-6 mt-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded"></div>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Comprada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded"></div>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Vendida</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de dados - Collapsible */}
        {filteredData.length > 0 && (
          <div className={`p-4 sm:p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Histórico de Dados
              </h2>
              <div className={`transform transition-transform ${showHistory ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {showHistory && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[600px]">
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
            )}
          </div>
        )}
      </div>
      </main>
      
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
