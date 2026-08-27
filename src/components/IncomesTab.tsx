import React, { useMemo, useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Plus, 
  PieChart as PieIcon, 
  BarChart3,
  Landmark,
  Coins,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Transaction, Project, AccountCategory, Currency } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { TransactionsTable } from './TransactionsTable';

interface IncomesTabProps {
  transactions: Transaction[];
  projects: Project[];
  categories: AccountCategory[];
  currency: Currency;
  onNewIncome: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  selectedProjectId: string;
}

export const IncomesTab: React.FC<IncomesTabProps> = ({
  transactions,
  projects,
  categories,
  currency,
  onNewIncome,
  onEditTransaction,
  onDeleteTransaction,
  selectedProjectId,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  const incomeTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === 'ingreso');
  }, [transactions]);

  // Aggregate metrics
  const totalARS = incomeTransactions.reduce((acc, t) => acc + t.amountARS, 0);
  const totalUSD = incomeTransactions.reduce((acc, t) => acc + t.amountUSD, 0);

  // Dynamic 4 Income Category Indicators
  const incomeCategoryIndicators = useMemo(() => {
    const incomeCats = categories.filter((c) => c.type === 'ingreso');

    // Standard definition for the 4 core income types if not present in custom categories
    const standardDefs = [
      {
        id: 'cat-in-1',
        code: 'ING-01',
        name: 'Aporte de Propietarios / Socios',
        shortName: 'Aportes Propietarios',
        color: '#3B82F6',
        icon: Landmark,
        matcher: (t: Transaction) => t.categoryId === 'cat-in-1' || t.concept.toLowerCase().includes('aporte'),
        unitLabel: 'aportes',
      },
      {
        id: 'cat-in-2',
        code: 'ING-02',
        name: 'Venta de Divisas (u$s)',
        shortName: 'Venta de Divisas',
        color: '#F59E0B',
        icon: Coins,
        matcher: (t: Transaction) => t.categoryId === 'cat-in-2' || t.concept.toLowerCase().includes('vta. u$s') || t.concept.toLowerCase().includes('dolar') || t.concept.toLowerCase().includes('divisa'),
        unitLabel: 'liquidaciones',
      },
      {
        id: 'cat-in-3',
        code: 'ING-03',
        name: 'Pagos con Tarjeta / Terceros',
        shortName: 'Tarjetas / Terceros',
        color: '#8B5CF6',
        icon: CreditCard,
        matcher: (t: Transaction) => t.categoryId === 'cat-in-3' || t.concept.toLowerCase().includes('tarjeta'),
        unitLabel: 'pagos',
      },
      {
        id: 'cat-in-4',
        code: 'ING-04',
        name: 'Certificados de Obra / Cobranzas',
        shortName: 'Certificados / Cobranzas',
        color: '#10B981',
        icon: TrendingUp,
        matcher: (t: Transaction) => t.categoryId === 'cat-in-4' || t.concept.toLowerCase().includes('certificado') || t.concept.toLowerCase().includes('cobranza'),
        unitLabel: 'certificados',
      },
    ];

    return standardDefs.map((def) => {
      // Find actual matching category from state if exists
      const catObj = incomeCats.find(c => c.id === def.id || (c.code && c.code.toUpperCase() === def.code));
      const targetId = catObj ? catObj.id : def.id;
      const targetName = catObj ? catObj.name : def.name;
      const targetColor = catObj ? catObj.color : def.color;

      const txs = incomeTransactions.filter(t => t.categoryId === targetId || def.matcher(t));
      const ars = txs.reduce((acc, t) => acc + t.amountARS, 0);
      const usd = txs.reduce((acc, t) => acc + t.amountUSD, 0);
      const val = currency === 'ARS' ? ars : usd;
      const totalVal = currency === 'ARS' ? totalARS : totalUSD;
      const percent = totalVal > 0 ? (val / totalVal) * 100 : 0;

      return {
        id: targetId,
        code: def.code,
        name: targetName,
        shortName: def.shortName,
        color: targetColor,
        IconComponent: def.icon,
        amountARS: ars,
        amountUSD: usd,
        value: val,
        percent,
        count: txs.length,
        unitLabel: def.unitLabel,
      };
    });
  }, [categories, incomeTransactions, currency, totalARS, totalUSD]);

  // Chart data: by month
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; ARS: number; USD: number }>();
    incomeTransactions.forEach((tx) => {
      const monthKey = tx.date.substring(0, 7); // YYYY-MM
      if (!map.has(monthKey)) {
        const [y, m] = monthKey.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
        const name = dateObj.toLocaleString('es-AR', { month: 'short', year: '2-digit' });
        map.set(monthKey, { month: name, ARS: 0, USD: 0 });
      }
      const entry = map.get(monthKey)!;
      entry.ARS += tx.amountARS;
      entry.USD += tx.amountUSD;
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, v]) => v);
  }, [incomeTransactions]);

  // Chart data: by category
  const categoryPieData = useMemo(() => {
    const map = new Map<string, { name: string; value: number; color: string }>();
    incomeTransactions.forEach((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      const catName = cat ? cat.name : 'Otros Ingresos';
      const catColor = cat ? cat.color : '#10B981';
      const val = currency === 'ARS' ? tx.amountARS : tx.amountUSD;

      if (!map.has(catName)) {
        map.set(catName, { name: catName, value: 0, color: catColor });
      }
      map.get(catName)!.value += val;
    });

    return Array.from(map.values()).filter((v) => v.value > 0);
  }, [incomeTransactions, categories, currency]);

  // Filtered transactions for the table
  const displayedTransactions = useMemo(() => {
    if (activeCategoryFilter === 'all') return incomeTransactions;
    return incomeTransactions.filter((t) => t.categoryId === activeCategoryFilter);
  }, [incomeTransactions, activeCategoryFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white tracking-tight">Origen de Fondos</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Ingresos & Aportes
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registro cronológico de aportes de capital, venta de divisas u$s, cobranzas y liquidaciones.
          </p>
        </div>

        <button
          id="new-income-btn"
          onClick={onNewIncome}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>+ Nuevo Ingreso / Aporte</span>
        </button>
      </div>

      {/* KPI Cards Grid: 5 Indicators (Total + 4 Income Categories: ING-01, ING-02, ING-03, ING-04) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Indicator 1: Total Ingresos */}
        <div 
          onClick={() => setActiveCategoryFilter('all')}
          className={`bg-slate-900 border p-4 rounded-2xl shadow cursor-pointer transition transform hover:-translate-y-0.5 ${
            activeCategoryFilter === 'all' 
              ? 'border-emerald-500/70 ring-2 ring-emerald-500/20' 
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Total Ingresos</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {formatCurrency(totalUSD, 'USD')}
          </div>
          <div className="text-xs text-emerald-400/80 font-mono mt-1 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">Equiv. $ {formatNumber(totalARS, 0)} ARS</span>
            <span className="text-[11px] text-slate-400 font-sans">{incomeTransactions.length} ingresos</span>
          </div>
        </div>

        {/* Indicators 2 to 5: The 4 Income Categories */}
        {incomeCategoryIndicators.map((item) => {
          const isSelected = activeCategoryFilter === item.id;
          const Icon = item.IconComponent;

          return (
            <div 
              key={item.id}
              onClick={() => setActiveCategoryFilter(isSelected ? 'all' : item.id)}
              className={`bg-slate-900 border p-4 rounded-2xl shadow cursor-pointer transition transform hover:-translate-y-0.5 relative overflow-hidden ${
                isSelected 
                  ? 'ring-2' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
              style={
                isSelected 
                  ? { borderColor: item.color, boxShadow: `0 0 0 2px ${item.color}33` } 
                  : undefined
              }
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {item.code}
                  </span>
                  <span 
                    className="text-xs font-semibold uppercase tracking-wider truncate max-w-[110px]"
                    title={item.name}
                  >
                    {item.shortName}
                  </span>
                </div>
                <div 
                  className="p-2 rounded-xl shrink-0"
                  style={{ backgroundColor: `${item.color}25`, color: item.color }}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div 
                className="text-2xl font-black font-mono tracking-tight truncate"
                style={{ color: item.color }}
              >
                {formatCurrency(item.amountUSD, 'USD')}
              </div>

              <div className="text-xs text-slate-400 font-mono mt-1 flex items-center justify-between">
                <span>{item.percent.toFixed(1)}% del total</span>
                <span className="text-[11px] font-sans">{item.count} {item.unitLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Evolution Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-100">Evolución Mensual de Ingresos</h3>
            </div>
            <span className="text-xs text-slate-400">
              Moneda: Dólares Americanos (u$s USD)
            </span>
          </div>

          <div className="h-64 w-full">
            {monthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Sin datos suficientes para graficar
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [formatCurrency(Number(val), 'USD'), 'Ingreso USD']}
                  />
                  <Bar dataKey="USD" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Categories Distribution Donut */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-amber-400" />
              <h3 className="font-bold text-sm text-slate-100">Composición por Origen</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">u$s USD</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {categoryPieData.length === 0 ? (
              <div className="text-xs text-slate-500">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [formatCurrency(Number(val), 'USD'), 'Monto USD']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Chips for Income */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
          <Filter className="h-3.5 w-3.5" />
          Filtrar Ingreso:
        </span>
        
        <button
          onClick={() => setActiveCategoryFilter('all')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
            activeCategoryFilter === 'all'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Todos ({incomeTransactions.length})
        </button>

        {incomeCategoryIndicators.map((item) => {
          const isSelected = activeCategoryFilter === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveCategoryFilter(item.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                isSelected
                  ? 'text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
              style={
                isSelected
                  ? { backgroundColor: item.color, borderColor: item.color }
                  : undefined
              }
            >
              <span 
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: isSelected ? '#ffffff' : item.color }}
              />
              <span>{item.shortName}</span>
              <span className="text-[10px] opacity-75 font-mono">({item.count})</span>
            </button>
          );
        })}
      </div>

      {/* Full Interactive Table */}
      <TransactionsTable
        title="Libro Diario de Origen de Fondos (Ingresos)"
        transactions={displayedTransactions}
        projects={projects}
        categories={categories}
        currency={currency}
        onEdit={onEditTransaction}
        onDelete={onDeleteTransaction}
        typeFilter="ingreso"
      />
    </div>
  );
};
