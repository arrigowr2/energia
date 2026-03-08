'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Zap, TrendingUp, TrendingDown, RefreshCw, Calendar,
  Battery, ArrowUpRight, ArrowDownRight, Sun
} from 'lucide-react';

interface EnergyData {
  date: string;
  energiaProduzida: number;
  energiaConsumida: number;
  energiaVendida: number;
  energiaComprada: number;
}

interface EnergyCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  color: string;
}

function EnergyCard({ title, value, unit, icon, trend, trendValue, color }: EnergyCardProps) {
  return (
    <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {trendValue}%
          </div>
        )}
      </div>
      <div>
        <p className="text-neutral-400 text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold text-white">
          {value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-sm text-neutral-400 ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export default function EnergyDashboard({ data: initialData }: { data: EnergyData[] }) {
  const [data, setData] = useState<EnergyData[]>(initialData);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    // Carregar dados do localStorage se disponível
    const savedData = localStorage.getItem('energyData');
    if (savedData && !initialData.length) {
      setData(JSON.parse(savedData));
    }
  }, [initialData]);

  const filteredData = data.slice(-(selectedPeriod === 'all' ? data.length : selectedPeriod === '7d' ? 7 : 30));

  // Calcular totais
  const totals = {
    produzida: filteredData.reduce((sum, item) => sum + item.energiaProduzida, 0),
    consumida: filteredData.reduce((sum, item) => sum + item.energiaConsumida, 0),
    vendida: filteredData.reduce((sum, item) => sum + item.energiaVendida, 0),
    comprada: filteredData.reduce((sum, item) => sum + item.energiaComprada, 0)
  };

  // Calcular tendências
  const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'neutral' => {
    if (previous === 0) return 'neutral';
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  const recentData = filteredData.slice(-7);
  const previousData = filteredData.slice(-14, -7);
  
  const recentTotals = {
    produzida: recentData.reduce((sum, item) => sum + item.energiaProduzida, 0),
    consumida: recentData.reduce((sum, item) => sum + item.energiaConsumida, 0),
    vendida: recentData.reduce((sum, item) => sum + item.energiaVendida, 0),
    comprada: recentData.reduce((sum, item) => sum + item.energiaComprada, 0)
  };

  const previousTotals = {
    produzida: previousData.reduce((sum, item) => sum + item.energiaProduzida, 0),
    consumida: previousData.reduce((sum, item) => sum + item.energiaConsumida, 0),
    vendida: previousData.reduce((sum, item) => sum + item.energiaVendida, 0),
    comprada: previousData.reduce((sum, item) => sum + item.energiaComprada, 0)
  };

  // Dados para gráfico de pizza (balanço energético)
  const balanceData = [
    { name: 'Produzida', value: totals.produzida, color: '#10b981' },
    { name: 'Consumida', value: totals.consumida, color: '#ef4444' },
    { name: 'Vendida', value: totals.vendida, color: '#3b82f6' },
    { name: 'Comprada', value: totals.comprada, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  const handleRefresh = () => {
    const savedData = localStorage.getItem('energyData');
    if (savedData) {
      setData(JSON.parse(savedData));
    }
  };

  if (!data.length) {
    return (
      <div className="text-center py-12">
        <Battery className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
        <p className="text-neutral-400">Nenhum dado de energia disponível</p>
        <p className="text-neutral-500 text-sm mt-2">Configure seu e-mail para começar a monitorar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard de Energia</h2>
          <p className="text-neutral-400">Monitoramento do consumo e produção de energia</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | 'all')}
            className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="all">Todo o período</option>
          </select>
          <button
            onClick={handleRefresh}
            className="p-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnergyCard
          title="Energia Produzida"
          value={totals.produzida}
          unit="kWh"
          icon={<Sun className="w-5 h-5 text-white" />}
          trend={calculateTrend(recentTotals.produzida, previousTotals.produzida)}
          trendValue={previousTotals.produzida ? Math.abs(((recentTotals.produzida - previousTotals.produzida) / previousTotals.produzida) * 100) : 0}
          color="bg-green-600"
        />
        <EnergyCard
          title="Energia Consumida"
          value={totals.consumida}
          unit="kWh"
          icon={<Zap className="w-5 h-5 text-white" />}
          trend={calculateTrend(recentTotals.consumida, previousTotals.consumida)}
          trendValue={previousTotals.consumida ? Math.abs(((recentTotals.consumida - previousTotals.consumida) / previousTotals.consumida) * 100) : 0}
          color="bg-red-600"
        />
        <EnergyCard
          title="Energia Vendida"
          value={totals.vendida}
          unit="kWh"
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          trend={calculateTrend(recentTotals.vendida, previousTotals.vendida)}
          trendValue={previousTotals.vendida ? Math.abs(((recentTotals.vendida - previousTotals.vendida) / previousTotals.vendida) * 100) : 0}
          color="bg-blue-600"
        />
        <EnergyCard
          title="Energia Comprada"
          value={totals.comprada}
          unit="kWh"
          icon={<TrendingDown className="w-5 h-5 text-white" />}
          trend={calculateTrend(recentTotals.comprada, previousTotals.comprada)}
          trendValue={previousTotals.comprada ? Math.abs(((recentTotals.comprada - previousTotals.comprada) / previousTotals.comprada) * 100) : 0}
          color="bg-yellow-600"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linhas - Evolução Temporal */}
        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
          <h3 className="text-lg font-semibold text-white mb-4">Evolução Temporal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="energiaProduzida" 
                stroke="#10b981" 
                name="Produzida"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="energiaConsumida" 
                stroke="#ef4444" 
                name="Consumida"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="energiaVendida" 
                stroke="#3b82f6" 
                name="Vendida"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="energiaComprada" 
                stroke="#f59e0b" 
                name="Comprada"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Barras - Comparação Diária */}
        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
          <h3 className="text-lg font-semibold text-white mb-4">Comparação Diária</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Bar dataKey="energiaProduzida" fill="#10b981" name="Produzida" />
              <Bar dataKey="energiaConsumida" fill="#ef4444" name="Consumida" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Pizza - Balanço Energético */}
      {balanceData.length > 0 && (
        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
          <h3 className="text-lg font-semibold text-white mb-4">Balanço Energético Total</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={balanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value.toFixed(2)} kWh (${((percent || 0) * 100).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {balanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabela de Dados Detalhados */}
      <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-4">Dados Detalhados</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-3 px-4 text-neutral-300">Data</th>
                <th className="text-right py-3 px-4 text-neutral-300">Produzida (kWh)</th>
                <th className="text-right py-3 px-4 text-neutral-300">Consumida (kWh)</th>
                <th className="text-right py-3 px-4 text-neutral-300">Vendida (kWh)</th>
                <th className="text-right py-3 px-4 text-neutral-300">Comprada (kWh)</th>
                <th className="text-right py-3 px-4 text-neutral-300">Saldo (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => {
                const saldo = item.energiaProduzida - item.energiaConsumida + item.energiaVendida - item.energiaComprada;
                return (
                  <tr key={index} className="border-b border-neutral-700">
                    <td className="py-3 px-4 text-neutral-300">{item.date}</td>
                    <td className="text-right py-3 px-4 text-green-400">{item.energiaProduzida.toFixed(2)}</td>
                    <td className="text-right py-3 px-4 text-red-400">{item.energiaConsumida.toFixed(2)}</td>
                    <td className="text-right py-3 px-4 text-blue-400">{item.energiaVendida.toFixed(2)}</td>
                    <td className="text-right py-3 px-4 text-yellow-400">{item.energiaComprada.toFixed(2)}</td>
                    <td className={`text-right py-3 px-4 font-medium ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {saldo.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
