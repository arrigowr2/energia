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
  X,
  HelpCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ReferenceLine
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
  
  // Estado para forçar re-renderização dos gráficos quando o tema mudar
  const [chartRenderKey, setChartRenderKey] = useState(0);
  
  // Estado para forçar renderização inicial após carregamento dos dados
  const [initialRenderKey, setInitialRenderKey] = useState(0);
  
  // Forçar re-renderização dos gráficos quando o tema mudar
  useEffect(() => {
    setChartRenderKey(prev => prev + 1);
  }, [isDarkMode]);
  
  // Forçar renderização inicial quando os dados mudarem
  useEffect(() => {
    if (filteredData.length > 0) {
      const timer = setTimeout(() => {
        setInitialRenderKey(prev => prev + 1);
      }, 100); // Pequeno delay para garantir que os dados estejam prontos
      return () => clearTimeout(timer);
    }
  }, [filteredData.length, dateRange, selectedMonth]);
  
  // Labels para os filtros de data
  const dateRangeLabels: { [key: string]: string } = {
    'latest': 'Último Registro',
    'week': 'Últimos 7 Dias',
    'month': 'Últimos 30 Dias',
    'year': 'Ano Inteiro',
    'selected-month': 'Mês Específico'
  };
  
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
    
    // Limpar dados removendo datas inválidas
    const cleanSourceData = cleanData(data);
    console.log('🧹 Dados limpos:', cleanSourceData.length, 'itens (removidos:', data.length - cleanSourceData.length, 'inválidos)');
    
    let filtered = [...cleanSourceData];

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
        console.log('🔍 [WEEK] Total de dados disponíveis:', cleanSourceData.length);
        console.log('🔍 [WEEK] Primeiros 5 dados:', cleanSourceData.slice(0, 5).map(d => d.date));
        
        if (cleanSourceData.length > 0) {
          // Encontrar a data mais recente de TODOS os dados limpos
          const sortedData = [...cleanSourceData].sort((a, b) => b.date.localeCompare(a.date));
          const latestDateStr = sortedData[0].date;
          console.log('🔍 [WEEK] Data mais recente global:', latestDateStr);
          
          // Validar formato da data
          if (!latestDateStr || !latestDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            console.log('🔍 [WEEK] ERRO: Data inválida:', latestDateStr);
            console.log('🔍 [WEEK] Tipo da data:', typeof latestDateStr);
            break;
          }
          
          // Calcular data de 6 dias antes usando strings
          const [year, month, day] = latestDateStr.split('-').map(Number);
          const latestDate = new Date(year, month - 1, day); // month-1 porque JS months são 0-11
          
          const weekBeforeLatest = new Date(latestDate);
          weekBeforeLatest.setDate(weekBeforeLatest.getDate() - 6);
          
          // Converter de volta para string YYYY-MM-DD
          const startYear = weekBeforeLatest.getFullYear();
          const startMonth = String(weekBeforeLatest.getMonth() + 1).padStart(2, '0');
          const startDay = String(weekBeforeLatest.getDate()).padStart(2, '0');
          const weekBeforeStr = `${startYear}-${startMonth}-${startDay}`;
          
          console.log('🔍 [WEEK] Período calculado:', weekBeforeStr, 'até', latestDateStr);
          
          // Filtrar dados de TODOS os dados limpos usando strings
          filtered = cleanSourceData.filter(item => {
            const include = item.date >= weekBeforeStr && item.date <= latestDateStr;
            console.log(`🔍 [WEEK] ${item.date}: ${include ? 'INCLUÍDO' : 'excluído'}`);
            return include;
          });
          
          console.log('🔍 [WEEK] Total filtrado:', filtered.length);
          console.log('🔍 [WEEK] Dados filtrados:', filtered.map(d => d.date));
          
          // Ordenar por data crescente
          filtered.sort((a, b) => a.date.localeCompare(b.date));
          
          console.log('📅 Filtro "Semana" aplicado:', filtered.length, 'itens');
          console.log('📅 Período:', weekBeforeStr, 'até', latestDateStr);
          console.log('📅 Dados finais:', filtered.map(d => d.date));
        } else {
          console.log('🔍 [WEEK] Sem dados para filtrar!');
        }
        break;
      case 'month':
        filtered = data.filter(item => {
          // Usar comparação de strings para evitar timezone
          const itemDate = item.date; // formato: '2023-01-01'
          const currentYear = now.getFullYear().toString();
          const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
          
          return itemDate.startsWith(`${currentYear}-${currentMonth}`);
        });
        console.log('📅 Filtro "Mês" aplicado:', filtered.length, 'itens');
        break;
      case 'selected-month':
        // Filtrar por mês selecionado no dropdown (formato: YYYY-MM)
        if (selectedMonth) {
          filtered = data.filter(item => {
            // Usar comparação de strings para evitar timezone
            const itemMonth = item.date.substring(0, 7); // YYYY-MM
            return itemMonth === selectedMonth;
          });
          console.log('📅 Filtro "Mês Selecionado" aplicado:', filtered.length, 'itens para', selectedMonth);
        }
        break;
      case 'year':
        // Adicionar logs detalhados para debug
        console.log(`🔍 [FILTRO ANO] Iniciando filtro para ano: ${selectedYear}`);
        console.log(`🔍 [FILTRO ANO] Total de itens antes do filtro: ${data.length}`);
        
        const yearFiltered = data.filter(item => {
          // Extrair ano diretamente da string para evitar problemas de fuso horário
          const itemYear = item.date.substring(0, 4); // Pega os 4 primeiros caracteres: '2023' de '2023-01-01'
          const isTargetYear = itemYear === selectedYear;
          
          console.log(`🔍 [FILTRO ANO] item.date: ${item.date} -> itemYear: ${itemYear} (targetYear: ${selectedYear})`);
          if (!isTargetYear) {
            console.log(`❌ [FILTRO ANO] Rejeitado: itemYear ${itemYear} !== targetYear ${selectedYear}`);
          }
          
          return isTargetYear;
        });
        
        // Agrupar por mês
        const monthlyData: { [key: string]: any } = {};
        yearFiltered.forEach(item => {
          const monthKey = item.date.substring(0, 7); // YYYY-MM
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
          // Ordenar por data YYYY-MM diretamente
          return a.date.localeCompare(b.date);
        });
        
        console.log('📅 Filtro "Ano" aplicado:', filtered.length, 'meses agrupados para', selectedYear);
        console.log('📅 Meses encontrados:', Object.keys(monthlyData));
        console.log('📅 Valores dos meses:', Object.values(monthlyData).map(m => ({ date: m.date, count: m.count })));
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

  // Função para limpar dados - remover datas inválidas
  const cleanData = (data: EnergyData[]) => {
    return data.filter(item => {
      if (!item.date || typeof item.date !== 'string') {
        return false;
      }
      // Remover datas com NaN
      if (item.date.includes('NaN')) {
        return false;
      }
      // Validar formato YYYY-MM-DD
      const parts = item.date.split('-');
      if (parts.length !== 3) {
        return false;
      }
      const [year, month, day] = parts;
      return year.length === 4 && month.length === 2 && day.length === 2;
    });
  };

  // Função de otimização de dados para gráficos
  const optimizeChartData = (data: EnergyData[]) => {
    if (!data.length) return data;
    
    // Para gráficos: ordenar em ordem crescente (dia 1 → dia 30)
    // Usar comparação de strings ao invés de Date para evitar timezone
    const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
    
    // Determinar limite de barras baseado no tamanho da tela
    let maxBars = 30; // Desktop
    if (isMobile) {
      maxBars = 7; // Mobile - mas com scroll horizontal para ver mais
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
    
    data.forEach(item => {
      // Usar split de string para evitar problemas de timezone
      if (item.date && typeof item.date === 'string' && item.date.includes('NaN')) {
        return; // Pular datas inválidas
      }
      
      const parts = item.date.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        years.add(year);
      }
    });
    
    // Gerar lista de meses que realmente têm dados
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const monthsWithData = new Set<string>();
    data.forEach(item => {
      const monthKey = item.date.substring(0, 7); // YYYY-MM
      const monthNum = monthKey.substring(5, 7); // MM
      const monthName = monthNames[parseInt(monthNum) - 1];
      if (monthName) {
        monthsWithData.add(`${monthNum}/${monthKey.substring(0, 4)}`);
      }
    });
    
    // Converter para o formato esperado pelo select
    const months = Array.from(monthsWithData)
      .sort((a, b) => {
        const [monthA, yearA] = a.split('/');
        const [monthB, yearB] = b.split('/');
        if (yearA !== yearB) return yearB.localeCompare(yearA);
        return monthB.localeCompare(monthA);
      })
      .map(monthYear => {
        const [monthNum, year] = monthYear.split('/');
        const monthName = monthNames[parseInt(monthNum) - 1];
        return {
          value: `${year}-${monthNum}`,
          label: `${monthName}/${year}`
        };
      });
    
    setAvailableYears(Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)));
    setAvailableMonths(months);
    console.log('📅 Anos disponíveis:', Array.from(years));
    console.log('📅 Meses com dados:', months.length);
    console.log('📅 Meses disponíveis:', months.map(m => ({ value: m.value, label: m.label })));
    console.log('📅 Exemplo de dados:', data.slice(0, 3).map(d => ({ date: d.date, geracao: d.energiaGerada })));
  };

  // Função helper para formatar datas no formato mes/ano (SEM FUSO HORÁRIO)
  const formatMonthYear = (dateString: string): string => {
    // Se já está no formato mes/ano, retorna direto
    if (dateString.includes('/')) {
      return dateString;
    }
    
    try {
      // Extrair mês e ano diretamente da string para evitar problemas de fuso horário
      // Formato esperado: YYYY-MM
      if (dateString.length >= 7 && dateString.includes('-')) {
        const year = dateString.substring(0, 4);
        const month = dateString.substring(5, 7);
        const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const monthName = monthNames[parseInt(month) - 1] || '???';
        const yearShort = year.slice(-2); // Últimos 2 dígitos
        return `${monthName}/${yearShort}`;
      }
      
      // Fallback para formato completo (YYYY-MM-DD)
      if (dateString.length >= 10 && dateString.includes('-')) {
        const year = dateString.substring(0, 4);
        const month = dateString.substring(5, 7);
        const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const monthName = monthNames[parseInt(month) - 1] || '???';
        const yearShort = year.slice(-2); // Últimos 2 dígitos
        return `${monthName}/${yearShort}`;
      }
      
      return dateString; // Retorna original se não conseguir processar
    } catch (error) {
      return dateString; // Retorna original se houver erro
    }
  }; // Função otimizada para evitar undefined nas legendas e problemas de fuso horário

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
    
    // Mapeamento de meses para números (correção do Date.parse)
    const monthMap: { [key: string]: number } = {
      'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
    };
    
    // Garantir que 2026 tenha dados completos para testes
    for (const year of years) {
      for (const month of months) {
        const monthNum = monthMap[month] + 1; // Usar mapeamento direto
        
        // Validar monthNum para evitar NaN
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
          console.log(`❌ Mês inválido ignorado: ${month} ${year} -> ${monthNum}`);
          continue;
        }
        
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        
        // Validar daysInMonth para evitar NaN
        if (isNaN(daysInMonth) || daysInMonth < 1 || daysInMonth > 31) {
          console.log(`❌ Dias inválidos no mês: ${month} ${year} -> ${daysInMonth}`);
          continue;
        }
        
        // Gerar dados para TODOS os dias de cada mês para ter mais dados
        let dataCount = daysInMonth; // Gerar dados para todos os dias do mês
        
        // Para 2026, garantir dados completos para testes
        if (year === 2026) {
          dataCount = daysInMonth; // Todos os dias do mês
        }
        
        // Gerar dados para cada dia do mês (de 1 a daysInMonth)
        for (let day = 1; day <= dataCount; day++) {
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
            // 2026: Valores mais altos (sistema no pico) - dados completos para testes
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
          
          // Debug para 2026 (primeiro mês)
          if (year === 2026 && monthNum === 1 && day <= 3) {
            console.log(`🔍 Debug 2026-${monthNum}-${day}:`, { energiaGerada, energiaConsumida, energiaComprada, energiaVendida });
          }
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
    
    // Verificar meses específicos
    console.log('📅 Meses em 2026:', [
      ...new Set(testData.filter(d => d.date.startsWith('2026')).map(d => d.date.substring(0, 7)))
    ].sort());
    
    // Verificar primeiro e último dados
    console.log('📅 Primeiro dado:', testData[testData.length - 1]);
    console.log('📅 Último dado:', testData[0]);
    
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
                Último Registro ({filteredData[0]?.date ? (() => {
                  const parts = filteredData[0].date.split('-');
                  if (parts.length === 2) {
                    // Formato YYYY-MM (filtro Ano)
                    const [year, month] = parts;
                    return `${month}/${year}`;
                  } else {
                    // Formato YYYY-MM-DD (outros filtros)
                    const [year, month, day] = parts;
                    return `${day}/${month}/${year}`;
                  }
                })() : ''})
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              
              {/* Scroll horizontal para mobile quando tiver muitas barras */}
              {(() => {
                const chartData1 = optimizeChartData(filteredData);
                const needsScroll1 = (isMobile && chartData1.length > 12) || chartData1.length > 15;
                const scrollWidth1 = chartData1.length * (isMobile ? 60 : 80);
                const formattedData1 = chartData1.map(item => {
                  const parts = item.date.split('-');
                  if (parts.length === 2) {
                    // Formato YYYY-MM (filtro Ano)
                    const [year, month] = parts;
                    return { name: `${month}/${year}`, energiaGerada: item.energiaGerada, energiaConsumida: item.energiaConsumida };
                  } else {
                    // Formato YYYY-MM-DD (outros filtros)
                    const [year, month, day] = parts;
                    return { name: `${day}/${month}`, energiaGerada: item.energiaGerada, energiaConsumida: item.energiaConsumida };
                  }
                });
                const tickFmt = (value: string) => { 
                  if (!value) return '';
                  // Se já está no formato MM/YYYY ou DD/MM, retorna direto
                  if (value.includes('/')) {
                    return value;
                  }
                  // Se tem formato "Dia DD/MM/YYYY", extrai DD/MM
                  if (value.includes('Dia ')) { 
                    const parts = value.split(' ')[1].split('/');
                    if (parts && parts.length >= 2) {
                      return `${parts[0]}/${parts[1]}`;
                    }
                  }
                  return value;
                };
                const chartContent = (
                  <BarChart data={formattedData1} margin={{ top: 20, right: 30, left: 60, bottom: 40 }}
                    {...(needsScroll1 ? { width: Math.max(isMobile ? 400 : 600, scrollWidth1), height: 300 } : {})}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} interval={0} tickFormatter={tickFmt} />
                    <YAxis tick={{ fontSize: 12 }} label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fill: isDarkMode ? '#9CA3AF' : '#6B7280' } }} />
                    <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', border: `1px solid ${isDarkMode ? '#4B5563' : '#E5E7EB'}`, borderRadius: '8px', color: isDarkMode ? '#F3F4F6' : '#111827' }} />
                    <Legend />
                    <Bar dataKey="energiaGerada" fill="#10b981" name="Produzido" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="energiaConsumida" fill="#3b82f6" name="Consumido" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                );
                return (
                  <div className={needsScroll1 ? "overflow-x-auto pb-4" : ""}>
                    <div style={{ minWidth: needsScroll1 ? `${scrollWidth1}px` : "100%" }}>
                      {needsScroll1 ? chartContent : (
                        <ResponsiveContainer width="100%" height={300} minWidth={300}>
                          {chartContent}
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Gráfico 2: Comprado vs Vendido */}
            <div className={`p-4 sm:p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border border-gray-200 dark:border-gray-700`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {dateRange === 'week' && 'Comparativo Semanal (7 dias)'}
                {dateRange === 'month' && 'Comparativo Mensal (30 dias)'}
                {dateRange === 'year' && 'Comparativo Anual (12 meses)'}
                {dateRange === 'latest' && 'Energia Comprada vs Vendida'}
                {dateRange === 'custom' && 'Energia Comprada vs Vendida'}
                {dateRange === 'selected-month' && selectedMonth && `Comparativo Mensal (${new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })})`}
              </h3>
              
              {/* Scroll horizontal para mobile quando tiver muitas barras */}
              {(() => {
                const chartData2 = optimizeChartData(filteredData);
                const needsScroll2 = (isMobile && chartData2.length > 12) || chartData2.length > 15;
                const scrollWidth2 = chartData2.length * (isMobile ? 60 : 80);
                const formattedData2 = chartData2.map(item => {
                  const parts = item.date.split('-');
                  if (parts.length === 2) {
                    // Formato YYYY-MM (filtro Ano)
                    const [year, month] = parts;
                    return { name: `${month}/${year}`, energiaComprada: item.energiaComprada, energiaVendida: item.energiaVendida };
                  } else {
                    // Formato YYYY-MM-DD (outros filtros)
                    const [year, month, day] = parts;
                    return { name: `${day}/${month}`, energiaComprada: item.energiaComprada, energiaVendida: item.energiaVendida };
                  }
                });
                const tickFmt2 = (value: string) => { 
                  if (!value) return '';
                  // Se já está no formato MM/YYYY ou DD/MM, retorna direto
                  if (value.includes('/')) {
                    return value;
                  }
                  // Se tem formato "Dia DD/MM/YYYY", extrai DD/MM
                  if (value.includes('Dia ')) { 
                    const parts = value.split(' ')[1].split('/');
                    if (parts && parts.length >= 2) {
                      return `${parts[0]}/${parts[1]}`;
                    }
                  }
                  return value;
                };
                const chartContent2 = (
                  <BarChart data={formattedData2} margin={{ top: 20, right: 30, left: 60, bottom: 40 }}
                    {...(needsScroll2 ? { width: Math.max(isMobile ? 400 : 600, scrollWidth2), height: 320 } : {})}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4B5563' : '#E5E7EB'} />
                    <XAxis dataKey="name" tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 12 }} angle={-45} textAnchor="end" height={80} interval={0} tickFormatter={tickFmt2} />
                    <YAxis tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 12 }} axisLine={{ stroke: isDarkMode ? '#4B5563' : '#E5E7EB' }} label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fill: isDarkMode ? '#9CA3AF' : '#6B7280' } }} />
                    <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', border: `1px solid ${isDarkMode ? '#4B5563' : '#E5E7EB'}`, borderRadius: '8px', color: isDarkMode ? '#F3F4F6' : '#111827' }} formatter={(value: any, name: any) => {
  if (name === 'Comprada') {
    return [`Comprada: ${value.toFixed(1)} kWh`, ''];
  } else if (name === 'Vendida') {
    return [`Vendida: ${value.toFixed(1)} kWh`, ''];
  }
  return [`${value.toFixed(1)} kWh`, name];
}} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="rect" />
                    <Bar dataKey="energiaComprada" fill="#EF4444" name="Comprada" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="energiaVendida" fill="#EAB308" name="Vendida" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                );
                return (
                  <div className={needsScroll2 ? "overflow-x-auto pb-4" : ""}>
                    <div style={{ minWidth: needsScroll2 ? `${scrollWidth2}px` : "100%" }}>
                      {needsScroll2 ? chartContent2 : (
                        <ResponsiveContainer width="100%" height={320} minWidth={300}>
                          {chartContent2}
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                );
              })()}
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
                            if (parts.length < 2 || parts.some(part => !part || part === 'NaN')) {
                              return 'Data inválida';
                            }
                            
                            // Verificar se é formato YYYY-MM (filtro Ano) ou YYYY-MM-DD (outros)
                            if (parts.length === 2) {
                              // Formato YYYY-MM (ex: 2026-12)
                              const [year, month] = parts;
                              return `${month}/${year}`;
                            } else {
                              // Formato YYYY-MM-DD (ex: 2026-12-15)
                              const [year, month, day] = parts;
                              return `${day}/${month}/${year}`;
                            }
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
          <div className="space-y-6">
            {filteredData.length > 0 ? (
              <>
            {/* Cabeçalho da Análise */}
            <div className="text-center mb-8">
              <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                📊 Análise de Dados
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Insights inteligentes sobre seu sistema de energia
              </p>
            </div>

            {/* Controles de Filtro para Análise */}
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                📧 1461 e-mails encontrados no total
              </div>
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDateRange('latest')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      dateRange === 'latest' 
                        ? 'bg-blue-600 text-white' 
                        : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Último Registro
                  </button>
                  <button
                    onClick={() => setDateRange('week')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      dateRange === 'week' 
                        ? 'bg-blue-600 text-white' 
                        : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    7 Dias
                  </button>
                  <button
                    onClick={() => setDateRange('month')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      dateRange === 'month' 
                        ? 'bg-blue-600 text-white' 
                        : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    30 Dias
                  </button>
                </div>
                
                {/* Selects de Mês e Ano sempre visíveis */}
                <div className="flex gap-2 items-center">
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      // Forçar re-renderização dos gráficos
                      setDateRange('selected-month');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    {availableMonths.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      // Forçar re-renderização dos gráficos
                      setDateRange('year');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Cards Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📈</span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tendência</span>
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {(() => {
                    if (filteredData.length < 2) return '--';
                    const recent = filteredData.slice(-7);
                    const older = filteredData.slice(-14, -7);
                    
                    // Verificar se há dados suficientes para comparação
                    if (recent.length === 0 || older.length === 0) return '--';
                    
                    const recentAvg = recent.reduce((sum, d) => sum + d.energiaGerada, 0) / recent.length;
                    const olderAvg = older.reduce((sum, d) => sum + d.energiaGerada, 0) / older.length;
                    
                    // Evitar divisão por zero
                    if (olderAvg === 0) return '--';
                    
                    const trend = parseFloat(((recentAvg - olderAvg) / olderAvg * 100).toFixed(1));
                    return `${trend > 0 ? '+' : ''}${trend}%`;
                  })()}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  vs. período anterior
                </div>
              </div>

              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🏆</span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Melhor Dia</span>
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {(() => {
                    if (filteredData.length === 0) return '--';
                    const bestDay = filteredData.reduce((best, current) => 
                      current.energiaGerada > best.energiaGerada ? current : best
                    );
                    return `${bestDay.energiaGerada.toFixed(1)} kWh`;
                  })()}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {(() => {
                    if (filteredData.length === 0) return '--';
                    const bestDay = filteredData.reduce((best, current) => 
                      current.energiaGerada > best.energiaGerada ? current : best
                    );
                    return `em ${new Date(bestDay.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
                  })()}
                </div>
              </div>

              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">⚡</span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Autossuficiência</span>
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {(() => {
                    if (filteredData.length === 0) return '--';
                    const totalGenerated = filteredData.reduce((sum, d) => sum + d.energiaGerada, 0);
                    const totalConsumed = filteredData.reduce((sum, d) => sum + d.energiaConsumida, 0);
                    const selfSufficiency = totalConsumed > 0 ? Math.min((totalGenerated / totalConsumed) * 100, 200) : 0;
                    return `${selfSufficiency.toFixed(0)}%`;
                  })()}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  do consumo atendido
                </div>
              </div>

              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🎯</span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Previsão</span>
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {(() => {
                    if (data.length < 7) return '--';
                    const recent = data.slice(-7);
                    const avgGeneration = recent.reduce((sum, d) => sum + d.energiaGerada, 0) / recent.length;
                    return `${avgGeneration.toFixed(1)}`;
                  })()}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  kWh/dia previsto
                </div>
              </div>
            </div>

            {/* Seção 1: Tendências */}
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                📈 Análise de Tendências
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Tendência de Geração */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Evolução da Geração
                    </h4>
                    <div className="relative group">
                      <HelpCircle className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} cursor-help`} />
                      <div className={`absolute right-0 top-6 w-64 p-3 rounded-lg shadow-lg border z-10 hidden group-hover:block ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong>📈 O que mostra:</strong><br/>
                          • Linha <span className="text-green-500">verde</span>: Energia gerada mês a mês<br/>
                          • Linha <span className="text-blue-500">azul</span>: Energia consumida mês a mês<br/>
                          • Eixo X: Meses do ano<br/>
                          • Eixo Y: Total em kWh<br/><br/>
                          <strong>💡 Como interpretar:</strong><br/>
                          • Linhas subindo = Melhora no sistema<br/>
                          • Linhas descendo = Redução de eficiência<br/>
                          • Distância entre linhas = Autossuficiência
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="h-64">
                    {(() => {
                      if (dateRange === 'selected-month') {
                        // Mostrar dados diários do mês selecionado
                        const chartData = filteredData
                          .sort((a, b) => a.date.localeCompare(b.date)) // Ordenar por data crescente
                          .map(item => ({
                            month: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                            monthKey: item.date,
                            geracao: item.energiaGerada,
                            consumo: item.energiaConsumida
                          }));
                        
                        if (chartData.length === 0) {
                          return (
                            <div className={`h-full flex items-center justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              <p className="text-center">
                                📊<br />
                                Sem dados para o mês selecionado
                              </p>
                            </div>
                          );
                        }
                        
                        return (
                          <div style={{ width: '100%', height: '256px' }}>
                            <ResponsiveContainer width="100%" height={256} key={`evolution-container-${isDarkMode ? 'dark' : 'light'}`}>
                              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} key={`evolution-chart-${isDarkMode ? 'dark' : 'light'}`}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4B5563' : '#E5E7EB'} />
                                <XAxis 
                                  dataKey="month" 
                                  tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                                  angle={-45}
                                  textAnchor="end"
                                  height={60}
                                />
                                <YAxis tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                                    border: `1px solid ${isDarkMode ? '#4B5563' : '#E5E7EB'}`,
                                    borderRadius: '8px',
                                    color: isDarkMode ? '#F3F4F6' : '#111827'
                                  }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="geracao" stroke="#10B981" strokeWidth={2} name="Geração" />
                                <Line type="monotone" dataKey="consumo" stroke="#3B82F6" strokeWidth={2} name="Consumo" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      }
                      

                      // Para outros filtros, mostrar dados mensais agregados
                      const monthlyData: { [key: string]: any } = {};
                      filteredData.forEach(item => {
                        const monthKey = item.date.substring(0, 7); // YYYY-MM
                        if (!monthlyData[monthKey]) {
                          monthlyData[monthKey] = { month: monthKey, geracao: 0, consumo: 0 };
                        }
                        monthlyData[monthKey].geracao += item.energiaGerada;
                        monthlyData[monthKey].consumo += item.energiaConsumida;
                      });
                      
                      const chartData = Object.values(monthlyData).map(item => ({
                        month: formatMonthYear(item.month),
                        monthKey: item.month, // Adicionar chave única para evitar duplicatas
                        geracao: item.geracao,
                        consumo: item.consumo
                      }));
                      
                      // Sempre mostrar o gráfico se houver dados mensais, mesmo que seja apenas 1 mês
                      // O problema pode ser que chartData.length === 0 mesmo com dados
                      if (chartData.length === 0) {
                        return (
                          <div className={`h-full flex items-center justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <p className="text-center">
                              📊<br />
                              Sem dados suficientes para o gráfico
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                        <div style={{ width: '100%', height: '256px' }}>
                          <ResponsiveContainer width="100%" height={256} key={`trends-container-${isDarkMode ? 'dark' : 'light'}-${dateRange}-${selectedYear}`}>
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} key={`trends-chart-${isDarkMode ? 'dark' : 'light'}-${dateRange}-${selectedYear}`}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4B5563' : '#E5E7EB'} />
                              <XAxis 
                                dataKey="month" 
                                tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                interval={0} // Mostrar todas as legendas sem duplicar
                              />
                              <YAxis tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                                  border: `1px solid ${isDarkMode ? '#4B5563' : '#E5E7EB'}`,
                                  borderRadius: '8px',
                                  color: isDarkMode ? '#F3F4F6' : '#111827'
                                }}
                              />
                              <Legend />
                              <Line type="monotone" dataKey="geracao" stroke="#10B981" strokeWidth={2} name="Geração" />
                              <Line type="monotone" dataKey="consumo" stroke="#3B82F6" strokeWidth={2} name="Consumo" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Insights de Tendência */}
                <div>
                  <h4 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Insights Automáticos
                  </h4>
                  <div className="space-y-3">
                    {(() => {
                    // Para filtro "year", dados são agrupados por mês, então 2+ meses é suficiente
                    const minDataPoints = dateRange === 'year' ? 2 : 14;
                    if (filteredData.length < minDataPoints) return (
                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            📊 Precisa de mais dados para análise de tendências (mínimo {minDataPoints} {dateRange === 'year' ? 'meses' : 'dias'}) - atual: {filteredData.length} {dateRange === 'year' ? 'meses' : 'dias'}
                          </p>
                        </div>
                      );

                      // Para filtro "year", comparar metades dos dados; para outros, últimos 7 vs anteriores
                      const halfLen = Math.max(1, Math.floor(filteredData.length / 2));
                      const recentSlice = dateRange === 'year' ? filteredData.slice(-halfLen) : filteredData.slice(-7);
                      const olderSlice = dateRange === 'year' ? filteredData.slice(0, halfLen) : filteredData.slice(-14, -7);
                      const recentGen = recentSlice.reduce((sum, d) => sum + d.energiaGerada, 0);
                      const olderGen = olderSlice.reduce((sum, d) => sum + d.energiaGerada, 0);
                      const trend = olderGen > 0 ? ((recentGen - olderGen) / olderGen * 100) : 0;

                      return (
                        <>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {trend > 5 ? '📈 Tendência de Alta' : trend < -5 ? '📉 Tendência de Baixa' : '➡️ Tendência Estável'}
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Geração {trend > 0 ? 'aumentou' : 'diminuiu'} {Math.abs(trend).toFixed(1)}% vs período anterior
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              🎯 Pico de Produção
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {(() => {
                                const maxDay = filteredData.reduce((max, d) => d.energiaGerada > max.energiaGerada ? d : max);
                                return `${maxDay.energiaGerada.toFixed(1)} kWh em ${new Date(maxDay.date).toLocaleDateString('pt-BR')}`;
                              })()}
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              📊 Média Diária
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {(() => {
                                const avgGen = filteredData.reduce((sum, d) => sum + d.energiaGerada, 0) / filteredData.length;
                                const avgCons = filteredData.reduce((sum, d) => sum + d.energiaConsumida, 0) / filteredData.length;
                                return `${avgGen.toFixed(1)} kWh gerados, ${avgCons.toFixed(1)} kWh consumidos por dia`;
                              })()}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Eficiência */}
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                ⚡ Análise de Eficiência
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Eficiência */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Taxa de Aproveitamento
                    </h4>
                    <div className="relative group">
                      <HelpCircle className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} cursor-help`} />
                      <div className={`absolute right-0 top-6 w-64 p-3 rounded-lg shadow-lg border z-10 hidden group-hover:block ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong>⚡ O que mostra:</strong><br/>
                          • Fatia <span className="text-green-500">verde</span>: Energia gerada pelo sistema<br/>
                          • Fatia <span className="text-red-500">vermelha</span>: Energia comprada da rede<br/><br/>
                          <strong>💡 Como interpretar:</strong><br/>
                          • Mais verde = Maior autossuficiência<br/>
                          • Mais vermelho = Maior dependência da rede<br/>
                          • Ideal: Máximo verde, mínimo vermelho
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height={256}>
                      <PieChart>
                        <Pie
                          data={(() => {
                            const totalGenerated = filteredData.reduce((sum, d) => sum + d.energiaGerada, 0);
                            const totalConsumed = filteredData.reduce((sum, d) => sum + d.energiaConsumida, 0);
                            const fromGrid = Math.max(0, totalConsumed - totalGenerated);
                            
                            return [
                              { name: 'Gerado', value: totalGenerated, color: '#10B981' },
                              { name: 'Da Rede', value: fromGrid, color: '#EF4444' }
                            ];
                          })()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(() => {
                            const data = [
                              { name: 'Gerado', value: filteredData.reduce((sum, d) => sum + d.energiaGerada, 0), color: '#10B981' },
                              { name: 'Da Rede', value: Math.max(0, filteredData.reduce((sum, d) => sum + d.energiaConsumida, 0) - filteredData.reduce((sum, d) => sum + d.energiaGerada, 0)), color: '#EF4444' }
                            ];
                            return data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ));
                          })()}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                            border: `1px solid ${isDarkMode ? '#4B5563' : '#E5E7EB'}`,
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Métricas de Eficiência */}
                <div>
                  <h4 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Métricas de Desempenho
                  </h4>
                  <div className="space-y-3">
                    {(() => {
                      const totalGenerated = filteredData.reduce((sum, d) => sum + d.energiaGerada, 0);
                      const totalConsumed = filteredData.reduce((sum, d) => sum + d.energiaConsumida, 0);
                      const totalSold = filteredData.reduce((sum, d) => sum + d.energiaVendida, 0);
                      const totalBought = filteredData.reduce((sum, d) => sum + d.energiaComprada, 0);
                      
                      const selfSufficiency = totalConsumed > 0 ? (Math.min(totalGenerated, totalConsumed) / totalConsumed * 100) : 0;
                      const exportRate = totalGenerated > 0 ? (totalSold / totalGenerated * 100) : 0;
                      const importRate = totalConsumed > 0 ? (totalBought / totalConsumed * 100) : 0;

                      return (
                        <>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              🏡 Autossuficiência
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {selfSufficiency.toFixed(1)}% do consumo atendido pela geração
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              📤 Taxa de Exportação
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {exportRate.toFixed(1)}% da energia gerada foi vendida
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              📥 Taxa de Importação
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {importRate.toFixed(1)}% do consumo veio da rede
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 3: Eficiência Energética */}
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                ⚡ Eficiência Energética
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Eficiência */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Autossuficiência Energética
                    </h4>
                    <div className="relative group">
                      <HelpCircle className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} cursor-help`} />
                      <div className={`absolute right-0 top-6 w-64 p-3 rounded-lg shadow-lg border z-10 hidden group-hover:block ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong>⚡ O que mostra:</strong><br/>
                          • <span className="text-green-500">Verde</span>: Dias 100% autossuficientes<br/>
                          • <span className="text-blue-500">Azul</span>: Dias parcialmente autossuficientes<br/>
                          • <span className="text-red-500">Vermelho</span>: Dias que precisou comprar energia<br/>
                          • Eixo X: Período analisado<br/>
                          • Eixo Y: Percentual de autossuficiência<br/><br/>
                          <strong>💡 Como interpretar:</strong><br/>
                          • <strong>100%</strong>: Gerou tudo o que consumiu<br/>
                          • <strong>50%</strong>: Metade veio dos painéis<br/>
                          • <strong>0%</strong>: Tudo veio da rede elétrica<br/>
                          • <strong>&gt;100%</strong>: Gerou mais do que consumiu
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="h-64">
                    {(() => {
                      // Calcular eficiência para cada período
                      const calculateEfficiency = (data: any[]) => {
                        return data.map(item => {
                          const gerada = Number(item.energiaGerada) || 0;
                          const consumida = Number(item.energiaConsumida) || 0;
                          
                          // Garantir que não tenhamos valores NaN ou undefined
                          let efficiency = 0;
                          if (consumida > 0 && !isNaN(gerada) && !isNaN(consumida)) {
                            efficiency = Math.min((gerada / consumida) * 100, 200);
                          } else if (consumida === 0 && gerada > 0) {
                            // Se não consumiu nada mas gerou energia, é 200% (excedente máximo)
                            efficiency = 200;
                          }
                          
                          // Garantir que efficiency seja um número válido
                          efficiency = Number(efficiency.toFixed(1));
                          if (isNaN(efficiency) || !isFinite(efficiency)) {
                            efficiency = 0;
                          }
                          
                          return {
                            period: dateRange === 'selected-month' || dateRange === 'month' || dateRange === 'week' || dateRange === 'latest'
                              ? `${item.date.substring(8, 10)}/${item.date.substring(5, 7).replace('01', 'jan').replace('02', 'fev').replace('03', 'mar').replace('04', 'abr').replace('05', 'mai').replace('06', 'jun').replace('07', 'jul').replace('08', 'ago').replace('09', 'set').replace('10', 'out').replace('11', 'nov').replace('12', 'dez')}`
                              : formatMonthYear(item.date.substring(0, 7)), // Apenas para filtro 'year'
                            periodKey: item.date,
                            eficiencia: efficiency,
                            gerada,
                            consumida
                          };
                        });
                      };
                      
                      const chartData = calculateEfficiency(filteredData).sort((a, b) => a.period.localeCompare(b.period));
                      
                      if (chartData.length === 0) {
                        return (
                          <div className={`h-full flex items-center justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <p className="text-center">
                              ⚡<br />
                              Sem dados para calcular eficiência
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                        <div style={{ width: '100%', height: '256px' }}>
                          <ResponsiveContainer width="100%" height={256} key={`efficiency-container-${isDarkMode ? 'dark' : 'light'}-${chartRenderKey}-${initialRenderKey}-${dateRange}-${selectedYear}`}>
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} key={`efficiency-chart-${isDarkMode ? 'dark' : 'light'}-${chartRenderKey}-${initialRenderKey}-${dateRange}-${selectedYear}`}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4B5563' : '#E5E7EB'} />
                              <XAxis 
                                dataKey="period" 
                                tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                              />
                              <YAxis 
                                tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                                domain={[0, 200]}
                                ticks={[0, 25, 50, 75, 100, 125, 150, 175, 200]}
                                tickFormatter={(value) => `${value}%`}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                                  border: `1px solid ${isDarkMode ? '#4B5563' : '#E5E7EB'}`,
                                  borderRadius: '8px',
                                  color: isDarkMode ? '#F3F4F6' : '#111827'
                                }}
                                formatter={(value: any) => [`${value}%`, 'Eficiência']}
                                labelFormatter={(label) => `<span style="color: ${isDarkMode ? '#ffffff' : '#000000'}">Período: ${label}</span>`}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="eficiencia" 
                                stroke="#10B981" 
                                strokeWidth={2}
                                name="Eficiência Energética"
                                dot={{ fill: '#10B981', r: 3 }}
                                connectNulls={true}
                              />
                              {/* Linha de referência em 100% */}
                              <ReferenceLine 
                                y={100} 
                                stroke="#10B981" 
                                strokeDasharray="5 5" 
                                strokeWidth={1}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Análise de Eficiência */}
                <div>
                  <h4 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Resumo de Eficiência
                  </h4>
                  <div className="space-y-3">
                    {(() => {
                      const totalGerado = filteredData.reduce((sum, d) => sum + (d.energiaGerada || 0), 0);
                      const totalConsumido = filteredData.reduce((sum, d) => sum + (d.energiaConsumida || 0), 0);
                      const eficienciaMedia = totalConsumido > 0 ? Math.min((totalGerado / totalConsumido) * 100, 200) : 0;
                      
                      // Classificar períodos por eficiência
                      const periodosEficientes = filteredData.filter(d => {
                        const gerada = d.energiaGerada || 0;
                        const consumida = d.energiaConsumida || 0;
                        return consumida > 0 && (gerada / consumida) >= 1;
                      }).length;
                      
                      const periodosParciais = filteredData.filter(d => {
                        const gerada = d.energiaGerada || 0;
                        const consumida = d.energiaConsumida || 0;
                        return consumida > 0 && (gerada / consumida) >= 0.5 && (gerada / consumida) < 1;
                      }).length;
                      
                      const periodosBaixos = filteredData.filter(d => {
                        const gerada = d.energiaGerada || 0;
                        const consumida = d.energiaConsumida || 0;
                        return consumida > 0 && (gerada / consumida) < 0.5;
                      }).length;
                      
                      const totalPeriodos = filteredData.length;

                      return (
                        <>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              ⚡ Eficiência Média
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {eficienciaMedia.toFixed(1)}% de autossuficiência
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              📊 Períodos 100% Autossuficientes
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {periodosEficientes} de {totalPeriodos} dias ({totalPeriodos > 0 ? ((periodosEficientes / totalPeriodos) * 100).toFixed(1) : 0}%)
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              🔄 Períodos Parciais (50-99%)
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {periodosParciais} de {totalPeriodos} dias ({totalPeriodos > 0 ? ((periodosParciais / totalPeriodos) * 100).toFixed(1) : 0}%)
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              🔌 Períodos Baixa Eficiência (&lt;50%)
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {periodosBaixos} de {totalPeriodos} dias ({totalPeriodos > 0 ? ((periodosBaixos / totalPeriodos) * 100).toFixed(1) : 0}%)
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${eficienciaMedia >= 75 ? 'bg-green-900/20 border border-green-700' : eficienciaMedia >= 50 ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-red-900/20 border border-red-700'}`}>
                            <p className={`text-sm font-medium ${eficienciaMedia >= 75 ? 'text-green-400' : eficienciaMedia >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {eficienciaMedia >= 75 ? '🌟 Excelente!' : eficienciaMedia >= 50 ? '👍 Bom' : '⚠️ Precisa Melhorar'}
                            </p>
                            <p className={`text-sm mt-1 ${eficienciaMedia >= 75 ? 'text-green-300' : eficienciaMedia >= 50 ? 'text-yellow-300' : 'text-red-300'}`}>
                              Seu sistema tem {eficienciaMedia.toFixed(1)}% de eficiência média
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 4: Padrões */}
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                🔄 Análise de Padrões
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Padrões Semanais */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Padrão Semanal
                    </h4>
                    <div className="relative group">
                      <HelpCircle className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} cursor-help`} />
                      <div className={`absolute right-0 top-6 w-64 p-3 rounded-lg shadow-lg border z-10 hidden group-hover:block ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong>🔄 O que mostra:</strong><br/>
                          • Barras <span className="text-green-500">verdes</span>: Média de geração por dia da semana<br/>
                          • Barras <span className="text-blue-500">azuis</span>: Média de consumo por dia da semana<br/>
                          • Eixo X: Dias da semana (Dom-Sáb)<br/>
                          • Eixo Y: Média em kWh<br/><br/>
                          <strong>💡 Como interpretar:</strong><br/>
                          • Padrões de comportamento semanal<br/>
                          • Dias de maior/menor consumo<br/>
                          • Melhores dias para gerar energia solar<br/>
                          • Otimização de horários de uso
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="h-64">
                    {(() => {
                      const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                      const weekData = weekDays.map((day, index) => {
                        const dayData = filteredData.filter(d => {
                          const date = new Date(d.date);
                          return date.getDay() === index;
                        });
                        return {
                          day,
                          geracao: dayData.reduce((sum, d) => sum + d.energiaGerada, 0) / Math.max(1, dayData.length),
                          consumo: dayData.reduce((sum, d) => sum + d.energiaConsumida, 0) / Math.max(1, dayData.length)
                        };
                      });
                      
                      if (filteredData.length === 0) {
                        return (
                          <div className={`h-full flex items-center justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <p className="text-center">
                              📊<br />
                              Sem dados suficientes para o gráfico
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                        <ResponsiveContainer width="100%" height={256}>
                          <BarChart data={weekData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4B5563' : '#E5E7EB'} />
                            <XAxis dataKey="day" tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280' }} angle={-45} textAnchor="end" height={60} />
                            <YAxis tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                                border: `1px solid ${isDarkMode ? '#4B5563' : '#E5E7EB'}`,
                                borderRadius: '8px',
                                color: isDarkMode ? '#F3F4F6' : '#111827'
                              }}
                            />
                            <Legend />
                            <Bar dataKey="geracao" fill="#10B981" name="Geração Média" />
                            <Bar dataKey="consumo" fill="#3B82F6" name="Consumo Médio" />
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </div>
                </div>

                {/* Insights de Padrões */}
                <div>
                  <h4 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Padrões Identificados
                  </h4>
                  <div className="space-y-3">
                    {(() => {
                      const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                      const weekData = weekDays.map((day, index) => {
                        const dayData = filteredData.filter(d => {
                          const date = new Date(d.date);
                          return date.getDay() === index;
                        });
                        return {
                          day,
                          avgGen: dayData.reduce((sum, d) => sum + d.energiaGerada, 0) / Math.max(1, dayData.length),
                          avgCons: dayData.reduce((sum, d) => sum + d.energiaConsumida, 0) / Math.max(1, dayData.length)
                        };
                      });

                      const maxGenDay = weekData.reduce((max, d) => d.avgGen > max.avgGen ? d : max);
                      const maxConsDay = weekData.reduce((max, d) => d.avgCons > max.avgCons ? d : max);
                      const minGenDay = weekData.reduce((min, d) => d.avgGen < min.avgGen ? d : min);

                      return (
                        <>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              ☀️ Maior Geração
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {maxGenDay.day}: {maxGenDay.avgGen.toFixed(1)} kWh médios
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              🏠 Maior Consumo
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {maxConsDay.day}: {maxConsDay.avgCons.toFixed(1)} kWh médios
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              🌙 Menor Geração
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {minGenDay.day}: {minGenDay.avgGen.toFixed(1)} kWh médios
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 5: Previsões */}
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                🔮 Previsões e Projeções
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Previsão */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Projeção para Próximos 7 Dias
                    </h4>
                    <div className="relative group">
                      <HelpCircle className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} cursor-help`} />
                      <div className={`absolute right-0 top-6 w-64 p-3 rounded-lg shadow-lg border z-10 hidden group-hover:block ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong>🔮 O que mostra:</strong><br/>
                          • Linhas <span className="text-green-500">verdes tracejadas</span>: Previsão de geração<br/>
                          • Linhas <span className="text-blue-500">azuis tracejadas</span>: Previsão de consumo<br/>
                          • Eixo X: Próximos 7 dias<br/>
                          • Eixo Y: Previsão em kWh<br/><br/>
                          <strong>💡 Como interpretar:</strong><br/>
                          • Baseado na média dos últimos 7 dias<br/>
                          • Variação de ±20% simulada<br/>
                          • Ajuda no planejamento energético<br/>
                          • Previsão de excedentes/déficits
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="h-64">
                    {(() => {
                      // Previsões sempre baseadas nos dados mais recentes, independentemente do filtro
                      if (data.length < 7) {
                        return (
                          <div className={`h-full flex items-center justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <p className="text-center">
                              📊<br />
                              Precisa de mais dados para previsões (mínimo 7 dias) - atual: {data.length} dias
                            </p>
                          </div>
                        );
                      }
                      
                      // Calcular média móvel e projeção simples - sempre usar dados mais recentes
                      const recent = data.slice(-7); // Usar data original, não filteredData
                      const avgGen = recent.reduce((sum, d) => sum + d.energiaGerada, 0) / recent.length;
                      const avgCons = recent.reduce((sum, d) => sum + d.energiaConsumida, 0) / recent.length;
                      
                      // Criar projeção para próximos 7 dias
                      const projection = [];
                      const today = new Date();
                      
                      // Usar semente fixa para variação (baseada na data atual)
                      const seed = today.getDate() + today.getMonth() + today.getFullYear();
                      const random = (index: number) => {
                        // Função pseudo-aleatória determinística
                        const x = Math.sin(seed + index) * 10000;
                        return x - Math.floor(x);
                      };
                      
                      for (let i = 1; i <= 7; i++) {
                        const futureDate = new Date(today);
                        futureDate.setDate(today.getDate() + i);
                        
                        // Adicionar variação determinística (+/- 20%)
                        const genVariation = 0.8 + random(i * 2) * 0.4; // 0.8 a 1.2
                        const consVariation = 0.8 + random(i * 2 + 1) * 0.4; // 0.8 a 1.2
                        
                        projection.push({
                          day: `${futureDate.getDate()}/${futureDate.toLocaleDateString('pt-BR', { weekday: 'short' })}`,
                          dayKey: `day-${i}`, // Chave única
                          geracaoPrev: avgGen * genVariation,
                          consumoPrev: avgCons * consVariation
                        });
                      }
                      
                      return (
                        <ResponsiveContainer width="100%" height={256}>
                          <LineChart data={projection} key={`forecast-chart-${isDarkMode ? 'dark' : 'light'}`}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4B5563' : '#E5E7EB'} />
                            <XAxis 
                              dataKey="day" 
                              tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                              interval={0} // Evitar duplicatas
                            />
                            <YAxis tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                                border: `1px solid ${isDarkMode ? '#4B5563' : '#E5E7EB'}`,
                                borderRadius: '8px',
                                color: isDarkMode ? '#F3F4F6' : '#111827'
                              }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="geracaoPrev" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" name="Geração Prevista" />
                            <Line type="monotone" dataKey="consumoPrev" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 5" name="Consumo Previsto" />
                          </LineChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </div>
                </div>

                {/* Métricas de Previsão */}
                <div>
                  <h4 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Análise de Previsão
                  </h4>
                  <div className="space-y-3">
                    {(() => {
                      if (data.length < 7) return (
                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            📊 Precisa de mais dados para previsões (mínimo 7 dias) - atual: {data.length} dias
                          </p>
                        </div>
                      );

                      const recent = data.slice(-7);
                      const avgGen = recent.reduce((sum, d) => sum + d.energiaGerada, 0) / recent.length;
                      const avgCons = recent.reduce((sum, d) => sum + d.energiaConsumida, 0) / recent.length;
                      
                      // Calcular variabilidade
                      const genVariance = recent.reduce((sum, d) => Math.pow(d.energiaGerada - avgGen, 2), 0) / recent.length;
                      const genStdDev = Math.sqrt(genVariance);
                      const genVariability = (genStdDev / avgGen * 100);

                      return (
                        <>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              📈 Previsão de Geração
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {avgGen.toFixed(1)} kWh/dia (±{genStdDev.toFixed(1)} kWh)
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              📊 Previsão de Consumo
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {avgCons.toFixed(1)} kWh/dia
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              🎯 Confiança da Previsão
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {genVariability < 20 ? 'Alta' : genVariability < 40 ? 'Média' : 'Baixa'} 
                              ({genVariability.toFixed(1)}% de variabilidade)
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              💡 Recomendação
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {avgGen > avgCons 
                                ? 'Sistema excedente - considere armazenamento ou mais vendas'
                                : avgGen * 1.2 > avgCons
                                ? 'Bom equilíbrio - mantenha configuração atual'
                                : 'Déficit previsto - otimize consumo ou aumente geração'
                              }
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo Final */}
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900' : 'bg-gradient-to-r from-blue-50 to-purple-50'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                🎯 Resumo Executivo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  const totalGenerated = filteredData.reduce((sum, d) => sum + d.energiaGerada, 0);
                  const totalConsumed = filteredData.reduce((sum, d) => sum + d.energiaConsumida, 0);
                  const totalSold = filteredData.reduce((sum, d) => sum + d.energiaVendida, 0);
                  const totalBought = filteredData.reduce((sum, d) => sum + d.energiaComprada, 0);
                  
                  const efficiency = totalGenerated > 0 ? (totalGenerated / (totalGenerated + totalConsumed) * 100) : 0;
                  const selfSufficiency = totalConsumed > 0 ? (Math.min(totalGenerated, totalConsumed) / totalConsumed * 100) : 0;
                  const netBalance = totalSold - totalBought;

                  return (
                    <>
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-white/50'}`}>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                          ⚡ Performance Geral
                        </p>
                        <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {efficiency.toFixed(1)}%
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                          eficiência do sistema
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-white/50'}`}>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-purple-200' : 'text-purple-700'}`}>
                          🏡 Autossuficiência
                        </p>
                        <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selfSufficiency.toFixed(1)}%
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-purple-200' : 'text-purple-600'}`}>
                          do consumo atendido
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-white/50'}`}>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>
                          ⚖️ Balanço Líquido
                        </p>
                        <p className={`text-2xl font-bold mt-2 ${netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(0)}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-green-200' : 'text-green-600'}`}>
                          kWh período
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
              </>
            ) : (
              <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum dado encontrado para análise</p>
                <p className="text-sm mt-2">Total de dados disponíveis: {data.length} dias</p>
                <button
                  onClick={() => setDateRange('latest')}
                  className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Voltar para Último Registro
                </button>
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
