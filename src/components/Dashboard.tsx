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
  TestTube,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
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
  const [dateRange, setDateRange] = useState<'latest' | 'week' | 'month' | 'year' | 'custom' | 'selected-month'>('latest');
  const [customDate, setCustomDate] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [apiInfo, setApiInfo] = useState<any>(null); // Informações da API
  
  // Estados para novos recursos
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<{value: string, label: string}[]>([]);
  
  // Estados para otimização de gráficos
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analysis'>('dashboard');
  const [chartView, setChartView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isMobile, setIsMobile] = useState(false);

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
  
  // Detectar tamanho de tela para responsividade
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Função para buscar emails após login
  const fetchEmailsAfterLogin = async () => {
    const accessToken = (session as any)?.accessToken;
    if (!accessToken) {
      console.log('❌ Token não disponível');
      return;
    }
    
    // Mostrar modal de loading
    setShowLoadingModal(true);
    setLoadingProgress(0);
    
    try {
      console.log('📧 Buscando emails automaticamente...');
      
      // Simular progresso durante a busca
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      const response = await fetch('/api/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
      });
      
      clearInterval(progressInterval);
      setLoadingProgress(95);
      
      const data = await response.json();
      console.log('📊 Dados recebidos:', data);
      
      if (response.ok && data.data?.length > 0) {
        console.log('✅', data.data.length, 'registros carregados automaticamente');
        handleDataUpdate(data.data, data.debug); // Passar informações da API
      } else {
        console.log('⚠️ Nenhum dado encontrado nos emails');
        setShowLoadingModal(false);
        setLoadingProgress(0);
      }
    } catch (err: any) {
      console.error('❌ Erro ao buscar emails:', err);
      setShowLoadingModal(false);
      setLoadingProgress(0);
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
  const handleDataUpdate = (newData: any[], apiResponseInfo?: any) => {
    console.log('📊 Dados recebidos no handleDataUpdate:', newData);
    console.log('🔢 Quantidade de dados:', newData.length);
    console.log('📧 Info da API:', apiResponseInfo);
    
    if (newData && newData.length > 0) {
      setData(newData);
      setFilteredData(newData);
      setApiInfo(apiResponseInfo); // Salvar informações da API
      setShowLogin(false); // Fechar modal após login
      setShowLoadingModal(false); // Fechar modal de loading
      setLoadingProgress(100); // Completar progresso
      
      // Extrair anos e meses disponíveis para os dropdowns
      extractAvailableDates(newData);
      
      console.log('✅ Dados atualizados com sucesso');
    } else {
      console.log('❌ Nenhum dado recebido');
      setShowLoadingModal(false);
      setLoadingProgress(0);
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
        // Mostrar exatamente 7 dias a partir do último dado disponível
        console.log('🔍 [WEEK] Iniciando filtro 7 dias...');
        console.log('🔍 [WEEK] Total de dados disponíveis:', data.length);
        
        if (data.length > 0) {
          // Encontrar a data mais recente de TODOS os dados
          const sortedData = [...data].sort((a, b) => b.date.localeCompare(a.date));
          const latestDateStr = sortedData[0].date;
          console.log('🔍 [WEEK] Data mais recente global:', latestDateStr);
          
          // Validar formato da data
          if (!latestDateStr || !latestDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            console.log('🔍 [WEEK] ERRO: Data inválida:', latestDateStr);
            break;
          }
          
          // Calcular data de 6 dias antes
          const latestDate = new Date(latestDateStr + 'T12:00:00');
          console.log('🔍 [WEEK] Date criado:', latestDate, latestDate.toString());
          
          if (isNaN(latestDate.getTime())) {
            console.log('🔍 [WEEK] ERRO: Date inválido!');
            break;
          }
          
          const weekBeforeLatest = new Date(latestDate);
          weekBeforeLatest.setDate(weekBeforeLatest.getDate() - 6);
          
          // Converter de volta para string YYYY-MM-DD
          const year = weekBeforeLatest.getFullYear();
          const month = String(weekBeforeLatest.getMonth() + 1).padStart(2, '0');
          const day = String(weekBeforeLatest.getDate()).padStart(2, '0');
          const weekBeforeStr = `${year}-${month}-${day}`;
          
          console.log('🔍 [WEEK] Período calculado:', weekBeforeStr, 'até', latestDateStr);
          
          // Filtrar dados de TODOS os dados
          filtered = data.filter(item => {
            const include = item.date >= weekBeforeStr && item.date <= latestDateStr;
            console.log(`🔍 [WEEK] ${item.date}: ${include ? 'INCLUÍDO' : 'excluído'}`);
            return include;
          });
          
          console.log('🔍 [WEEK] Total filtrado:', filtered.length);
          
          // Ordenar por data crescente
          filtered.sort((a, b) => a.date.localeCompare(b.date));
          
          console.log('📅 Filtro "Semana" aplicado:', filtered.length, 'itens');
          console.log('📅 Período:', weekBeforeStr, 'até', latestDateStr);
          console.log('📅 Dados:', filtered.map(d => d.date));
        } else {
          console.log('🔍 [WEEK] Sem dados para filtrar!');
        }
        break;
      case 'month':
        filtered = data.filter(item => {
          const itemDate = new Date(item.date + 'T00:00:00Z');
          return itemDate.getMonth() === now.getMonth() && 
                 itemDate.getFullYear() === now.getFullYear();
        });
        console.log('📅 Filtro "Mês" aplicado:', filtered.length, 'itens');
        break;
      case 'selected-month':
        // Filtrar por mês selecionado no dropdown
        if (selectedMonth) {
          const targetMonth = parseInt(selectedMonth) - 1; // JavaScript months são 0-11
          const targetYear = parseInt(selectedYear) || now.getFullYear();
          
          filtered = data.filter(item => {
            const itemDate = new Date(item.date + 'T00:00:00Z');
            return itemDate.getMonth() === targetMonth && 
                   itemDate.getFullYear() === targetYear;
          });
          console.log('📅 Filtro "Mês Selecionado" aplicado:', filtered.length, 'itens para', targetMonth + 1, '/', targetYear);
        }
        break;
      case 'year':
        // Agrupar dados por mês para o gráfico anual
        const monthlyData: { [key: string]: any } = {};
        const targetYear = parseInt(selectedYear) || now.getFullYear(); // Usar ano selecionado ou atual
        
        filtered = data.filter(item => {
          const itemDate = new Date(item.date + 'T00:00:00Z');
          const year = itemDate.getFullYear();
          if (year !== targetYear) return false;
          
          // Agrupar por mês
          const monthKey = itemDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              energiaGerada: 0,
              energiaConsumida: 0,
              energiaComprada: 0,
              energiaVendida: 0,
              date: monthKey,
              count: 0
            };
          }
          
          monthlyData[monthKey].energiaGerada += item.energiaGerada || 0;
          monthlyData[monthKey].energiaConsumida += item.energiaConsumida || 0;
          monthlyData[monthKey].energiaComprada += item.energiaComprada || 0;
          monthlyData[monthKey].energiaVendida += item.energiaVendida || 0;
          monthlyData[monthKey].count += 1;
          
          return true;
        });
        
        // Converter para array ordenado por mês
        filtered = Object.values(monthlyData).sort((a, b) => {
          const monthOrder = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                           'jul', 'ago', 'set', 'out', 'nov', 'dez'];
          const monthA = a.date.split('/')[0].toLowerCase();
          const monthB = b.date.split('/')[0].toLowerCase();
          return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
        });
        
        console.log('📅 Filtro "Ano" aplicado:', filtered.length, 'meses agrupados para', targetYear);
        break;
      case 'custom':
        if (customDate) {
          filtered = data.filter(item => {
            return item.date === customDate; // Comparar strings diretamente
          });
          console.log('📅 Filtro "Custom" aplicado:', filtered.length, 'itens para', customDate);
        }
        break;
    }

    // Ordenar por data (mais recente primeiro para a tabela)
    // Usar comparação de strings ao invés de Date para evitar timezone
    filtered.sort((a, b) => b.date.localeCompare(a.date));
    setFilteredData(filtered);
    console.log('📊 Dados filtrados finais:', filtered);
  }, [data, dateRange, customDate, selectedMonth, selectedYear]);

  // Função de otimização de dados para gráficos
  const optimizeChartData = (data: EnergyData[]) => {
    if (!data.length) return data;
    
    // Para gráficos: ordenar em ordem crescente (dia 1 → dia 30)
    // Usar comparação de strings ao invés de Date para evitar timezone
    const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
    
    // Determinar limite de barras baseado no tamanho da tela
    let maxBars = 30; // Desktop
    if (isMobile) {
      maxBars = 7; // Mobile
    } else if (window.innerWidth < 1024) {
      maxBars = 15; // Tablet
    }
    
    return sortedData.slice(0, maxBars);
  };
  
  // Função para agrupar dados por semana
  const groupByWeek = (data: EnergyData[]) => {
    const weeks: { [key: string]: EnergyData } = {};
    
    data.forEach(item => {
      const date = new Date(item.date + 'T00:00:00Z'); // UTC para evitar timezone
      const weekNum = Math.ceil(date.getDate() / 7);
      const weekKey = `Semana ${weekNum}`;
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          date: weekKey,
          energiaGerada: 0,
          energiaConsumida: 0,
          energiaComprada: 0,
          energiaVendida: 0
        };
      }
      
      weeks[weekKey].energiaGerada += item.energiaGerada;
      weeks[weekKey].energiaConsumida += item.energiaConsumida;
      weeks[weekKey].energiaComprada += item.energiaComprada;
      weeks[weekKey].energiaVendida += item.energiaVendida;
    });
    
    return Object.values(weeks).slice(-4); // Últimas 4 semanas
  };
  
  // Função para agrupar dados por mês
  const groupByMonth = (data: EnergyData[]) => {
    const months: { [key: string]: EnergyData } = {};
    
    data.forEach(item => {
      const date = new Date(item.date + 'T00:00:00'); // Evitar timezone
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = {
          date: monthKey,
          energiaGerada: 0,
          energiaConsumida: 0,
          energiaComprada: 0,
          energiaVendida: 0
        };
      }
      
      months[monthKey].energiaGerada += item.energiaGerada;
      months[monthKey].energiaConsumida += item.energiaConsumida;
      months[monthKey].energiaComprada += item.energiaComprada;
      months[monthKey].energiaVendida += item.energiaVendida;
    });
    
    // Ordenar por data cronológica
    const sortedMonths = Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, monthData]) => monthData);
    
    return sortedMonths.slice(-12); // Últimos 12 meses
  };

  // Extrair anos e meses disponíveis dos dados
  const extractAvailableDates = (data: EnergyData[]) => {
    const years = new Set<string>();
    const monthsSet = new Set<string>();
    
    data.forEach(item => {
      const date = new Date(item.date);
      const year = date.getFullYear().toString();
      const month = date.toLocaleDateString('pt-BR', { month: 'long' });
      
      years.add(year);
      monthsSet.add(month);
    });
    
    const months = [
      { value: '01', label: 'Janeiro' },
      { value: '02', label: 'Fevereiro' },
      { value: '03', label: 'Março' },
      { value: '04', label: 'Abril' },
      { value: '05', label: 'Maio' },
      { value: '06', label: 'Junho' },
      { value: '07', label: 'Julho' },
      { value: '08', label: 'Agosto' },
      { value: '09', label: 'Setembro' },
      { value: '10', label: 'Outubro' },
      { value: '11', label: 'Novembro' },
      { value: '12', label: 'Dezembro' }
    ];
    
    setAvailableYears(Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)));
    setAvailableMonths([
      { value: '01', label: 'Janeiro' },
      { value: '02', label: 'Fevereiro' },
      { value: '03', label: 'Março' },
      { value: '04', label: 'Abril' },
      { value: '05', label: 'Maio' },
      { value: '06', label: 'Junho' },
      { value: '07', label: 'Julho' },
      { value: '08', label: 'Agosto' },
      { value: '09', label: 'Setembro' },
      { value: '10', label: 'Outubro' },
      { value: '11', label: 'Novembro' },
      { value: '12', label: 'Dezembro' }
    ]);
  };

  // Função para carregar dados de teste
  const loadTestData = async () => {
    console.log('🧪 Carregando dados de teste...');
    
    // Mostrar modal de loading
    setShowLoadingModal(true);
    setLoadingProgress(0);
    
    // Simular delay para mostrar loading
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const testData: EnergyData[] = [];
    const totalMonths = 48; // 4 anos de dados (2023-2026)
    const currentProgress = { value: 0 };
    
    // Simular progresso durante geração
    const progressInterval = setInterval(() => {
      currentProgress.value += 1.5;
      setLoadingProgress(Math.min(currentProgress.value, 95));
    }, 30);
    
    // Gerar dados para 2023, 2024, 2025, 2026 (todos os meses)
    const years = [2023, 2024, 2025, 2026];
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    
    for (const year of years) {
      for (const month of months) {
        const monthNum = new Date(Date.parse(`${month} 1, ${year}`)).getMonth() + 1;
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        
        // Mais dados por mês para atingir ~1500 total
        let dataCount;
        if (year === 2023) {
          dataCount = Math.floor(Math.random() * 20) + 25; // 25-45 dados (2023 tem menos)
        } else {
          dataCount = Math.floor(Math.random() * 25) + 35; // 35-60 dados (2024-2026 tem mais)
        }
        
        // Gerar dias únicos para evitar duplicatas
        const usedDays = new Set<number>();
        let attempts = 0;
        const maxAttempts = dataCount * 2; // Tentativas máximas
        
        while (usedDays.size < dataCount && attempts < maxAttempts) {
          const day = Math.floor(Math.random() * daysInMonth) + 1;
          
          // Só adicionar se o dia ainda não foi usado
          if (!usedDays.has(day)) {
            usedDays.add(day);
            const date = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Valores mais realistas e variados por ano
            let energiaGerada, energiaConsumida, energiaComprada, energiaVendida;
            
            if (year === 2023) {
              // 2023: Valores mais baixos (sistema mais antigo)
              energiaGerada = Math.floor(Math.random() * 40) + 10;  // 10-50 kWh
              energiaConsumida = Math.floor(Math.random() * 30) + 8;  // 8-38 kWh
              energiaComprada = Math.floor(Math.random() * 25) + 5;  // 5-30 kWh
              energiaVendida = Math.floor(Math.random() * 20) + 2;  // 2-22 kWh
            } else if (year === 2024) {
              // 2024: Valores médios (sistema em crescimento)
              energiaGerada = Math.floor(Math.random() * 50) + 15;  // 15-65 kWh
              energiaConsumida = Math.floor(Math.random() * 40) + 12; // 12-52 kWh
              energiaComprada = Math.floor(Math.random() * 30) + 8;  // 8-38 kWh
              energiaVendida = Math.floor(Math.random() * 25) + 5;  // 5-30 kWh
            } else if (year === 2025) {
              // 2025: Valores otimizados (sistema maduro)
              energiaGerada = Math.floor(Math.random() * 60) + 20;  // 20-80 kWh
              energiaConsumida = Math.floor(Math.random() * 45) + 15; // 15-60 kWh
              energiaComprada = Math.floor(Math.random() * 35) + 10; // 10-45 kWh
              energiaVendida = Math.floor(Math.random() * 30) + 8;  // 8-38 kWh
            } else {
              // 2026: Valores mais altos (sistema no pico)
              energiaGerada = Math.floor(Math.random() * 70) + 25;  // 25-95 kWh
              energiaConsumida = Math.floor(Math.random() * 50) + 18; // 18-68 kWh
              energiaComprada = Math.floor(Math.random() * 40) + 12; // 12-52 kWh
              energiaVendida = Math.floor(Math.random() * 35) + 10; // 10-45 kWh
            }
            
            testData.push({
              date,
              energiaGerada,
              energiaConsumida,
              energiaComprada,
              energiaVendida
            });
          }
          
          attempts++;
        }
      }
    }
    
    // Parar progresso
    clearInterval(progressInterval);
    setLoadingProgress(95);
    
    // Ordenar por data (mais recente primeiro)
    testData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`🧪 ${testData.length} dados de teste gerados`);
    console.log('📅 Distribuição:', {
      '2023': testData.filter(d => d.date.startsWith('2023')).length,
      '2024': testData.filter(d => d.date.startsWith('2024')).length,
      '2025': testData.filter(d => d.date.startsWith('2025')).length,
      '2026': testData.filter(d => d.date.startsWith('2026')).length
    });
    
    // Simular delay final
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Atualizar estados
    setData(testData);
    setFilteredData(testData);
    setApiInfo({
      emailsFound: testData.length,
      emailsProcessed: testData.length,
      processedCount: testData.length,
      successCount: testData.length,
      searchType: 'test-data-massive'
    });
    
    // Extrair anos e meses disponíveis para os dropdowns
    extractAvailableDates(testData);
    
    // Limpar filtros e seleções
    setDateRange('latest');
    setCustomDate('');
    setSelectedMonth('');
    setSelectedYear('');
    
    // Fechar modal de loading
    setLoadingProgress(100);
    await new Promise(resolve => setTimeout(resolve, 200));
    setShowLoadingModal(false);
    
    console.log('✅ Dados de teste carregados com sucesso!');
    console.log('📅 Anos disponíveis:', [...new Set(testData.map(d => d.date.split('-')[0]))]);
    console.log('📅 Meses disponíveis:', [...new Set(testData.map(d => d.date.split('-')[1]))]);
  };

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

  // Modal de Loading
  const LoadingModal = () => {
    if (!showLoadingModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={`max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-8 text-center`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Carregando Dados
          </h3>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Buscando e processando e-mails de energia...
          </p>
          
          {/* Barra de Progresso */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {loadingProgress}% concluído
          </p>
        </div>
      </div>
    );
  };

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

          {/* Guias Dashboard e Análise */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-600'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'analysis'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-600'
              }`}
            >
              Análise
            </button>
          </div>

          {/* Filtros de data e ações */}
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
            {/* Filtros de data - apenas no Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={() => setDateRange('latest')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === 'latest' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Hoje
                </button>
                <button
                  onClick={() => setDateRange('week')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === 'week' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  7 Dias
                </button>
                <button
                  onClick={() => setDateRange('month')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === 'month' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  30 Dias
                </button>
                
                {/* Dropdown Mês */}
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setDateRange('selected-month');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600 border-none outline-none`}
                >
                  <option value="">Mês</option>
                  {availableMonths.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
                
                {/* Dropdown Ano */}
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setDateRange('year');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600 border-none outline-none`}
                >
                  <option value="">Ano</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}

            
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
              {/* Botão de teste de dados */}
              <button
                onClick={loadTestData}
                className="px-3 py-1.5 rounded-lg flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-500 text-sm"
                title="Carregar dados de teste"
              >
                <TestTube className="w-4 h-4" />
                <span className="hidden sm:inline">Teste</span>
              </button>

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
        {activeTab === 'dashboard' && stats ? (
          <>
            <div className="mb-4">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Último Dado ({filteredData[0]?.date ? new Date(filteredData[0].date).toLocaleDateString('pt-BR') : ''})
              </h2>
              {data.length > 0 && (
                <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p>📧 {apiInfo?.emailsFound || data.length} e-mails encontrados no total</p>
                  {apiInfo && apiInfo.emailsFound !== data.length && (
                    <p className="mt-1">📥 {data.length} e-mails carregados com dados válidos</p>
                  )}
                </div>
              )}
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
        {activeTab === 'dashboard' && filteredData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico 1: Produzido vs Consumido */}
            <div className={`p-4 sm:p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border border-gray-200 dark:border-gray-700`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Produzido vs Consumido
              </h3>
              
              {/* Scroll horizontal apenas se necessário */}
              <div className={optimizeChartData(filteredData).length > 8 ? "overflow-x-auto pb-4" : ""}>
                <div style={{ minWidth: optimizeChartData(filteredData).length > 8 ? `${optimizeChartData(filteredData).length * 80}px` : "100%" }}>
                  <BarChart
                    width={optimizeChartData(filteredData).length > 8 ? Math.max(600, optimizeChartData(filteredData).length * 80) : "100%"}
                    height={300}
                    data={optimizeChartData(filteredData).map(item => {
                      // Formatar data manualmente com prefixo para evitar interpretação como data
                      const [year, month, day] = item.date.split('-');
                      const formattedDate = `Dia ${day}/${month}/${year}`;
                      return {
                        name: formattedDate,
                        energiaGerada: item.energiaGerada,
                        energiaConsumida: item.energiaConsumida
                      };
                    })}
                    margin={{ top: 20, right: 30, left: 60, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? 'end' : 'middle'}
                      height={isMobile ? 80 : 40}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fill: isDarkMode ? '#9CA3AF' : '#6B7280' } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                        border: '1px solid ' + (isDarkMode ? '#374151' : '#e5e7eb'),
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="energiaGerada" fill="#10b981" name="Produzido" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="energiaConsumida" fill="#3b82f6" name="Consumido" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
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
              
              {/* Scroll horizontal para gráficos longos */}
              <div className={optimizeChartData(filteredData).length > 8 ? "overflow-x-auto pb-4" : ""}>
                <div style={{ minWidth: optimizeChartData(filteredData).length > 8 ? `${optimizeChartData(filteredData).length * 80}px` : "100%" }}>
                  <BarChart
                    width={optimizeChartData(filteredData).length > 8 ? Math.max(600, optimizeChartData(filteredData).length * 80) : "100%"}
                    height={320}
                    data={optimizeChartData(filteredData).map((item) => {
                      // Formatar data manualmente com prefixo para evitar interpretação como data
                      const [year, month, day] = item.date.split('-');
                      const formattedDate = `Dia ${day}/${month}/${year}`;
                      return {
                        name: formattedDate,
                        energiaComprada: item.energiaComprada,
                        energiaVendida: item.energiaVendida
                      };
                    })}
                    margin={{ top: 20, right: 30, left: 60, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4B5563' : '#E5E7EB'} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? 'end' : 'middle'}
                      height={isMobile ? 80 : 40}
                    />
                    <YAxis 
                      tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
                      axisLine={{ stroke: isDarkMode ? '#4B5563' : '#E5E7EB' }}
                      label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fill: isDarkMode ? '#9CA3AF' : '#6B7280' } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${isDarkMode ? '#4B5563' : '#E5E7EB'}`,
                        borderRadius: '8px',
                        color: isDarkMode ? '#F3F4F6' : '#111827'
                      }}
                      formatter={(value: any) => [`${value.toFixed(1)} kWh`, '']}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="rect"
                    />
                    <Bar 
                      dataKey="energiaComprada" 
                      fill="#EF4444" 
                      name="Comprada"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar 
                      dataKey="energiaVendida" 
                      fill="#EAB308" 
                      name="Vendida"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Tabela de dados - Collapsible - apenas no Dashboard */}
        {activeTab === 'dashboard' && filteredData.length > 0 && (
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
                    {filteredData
                      .filter((item, index) => {
                        // Remover itens com datas inválidas
                        if (!item.date || typeof item.date !== 'string' || item.date.includes('NaN')) {
                          return false;
                        }
                        // Se for filtro 'week', mostrar apenas 7 itens mais recentes
                        if (dateRange === 'week') {
                          return index < 7;
                        }
                        return true; // Para outros filtros, mostrar todos
                      })
                      .map((item, index) => (
                      <tr key={index} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {/* Formatar data manualmente com validação para evitar NaN */}
                          {(() => {
                            if (!item.date || typeof item.date !== 'string') {
                              return 'Data inválida';
                            }
                            const parts = item.date.split('-');
                            if (parts.length !== 3 || parts.some(part => !part || part === 'NaN')) {
                              return 'Data inválida';
                            }
                            const [year, month, day] = parts;
                            return `${day}/${month}/${year}`;
                          })()}
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
        
        {/* Conteúdo da aba Análise */}
        {activeTab === 'analysis' && (
          <div className="text-center py-12">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Análise de Dados
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              🚧 Em desenvolvimento...
            </p>
            <p className={`text-sm mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Em breve: Tendências, Eficiência, Economia, Padrões e Previsões
            </p>
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
              <p className="mb-4">Faça login com Gmail para visualizar seus dados</p>
            </div>
            <div className="text-center">
              <OAuthLogin onConfigured={handleDataUpdate} />
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Loading */}
      <LoadingModal />
    </div>
  );
}
