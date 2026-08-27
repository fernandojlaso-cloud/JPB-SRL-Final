import React, { useMemo, useState } from 'react';
import { 
  DollarSign, 
  HardHat, 
  Package, 
  ScrollText, 
  Truck, 
  Building2,
  Wrench,
  Zap,
  Paintbrush,
  ShieldCheck,
  Plus, 
  PieChart as PieIcon, 
  BarChart3, 
  Filter,
  Layers
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

interface ExpensesTabProps {
  transactions: Transaction[];
  projects: Project[];
  categories: AccountCategory[];
  currency: Currency;
  onNewExpense: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  selectedProjectId: string;
}

// Helper to choose appropriate Lucide icon by category code/name
const getCategoryIcon = (code: string, name: string) => {
  const c = (code || '').toUpperCase();
  const n = (name || '').toLowerCase();
  if (c.includes('MO') || n.includes('mano de obra') || n.includes('albañil') || n.includes('demolic') || n.includes('cuadrilla')) {
    return <HardHat className="h-4 w-4" />;
  }
  if (c.includes('MAT') || n.includes('material') || n.includes('acopio') || n.includes('hierro') || n.includes('cemento') || n.includes('árido')) {
    return <Package className="h-4 w-4" />;
  }
  if (c.includes('HON') || n.includes('honorario') || n.includes('direcci') || n.includes('arquitect') || n.includes('técnic')) {
    return <ScrollText className="h-4 w-4" />;
  }
  if (c.includes('LOG') || c.includes('FLET') || n.includes('flete') || n.includes('volquete') || n.includes('transporte')) {
    return <Truck className="h-4 w-4" />;
  }
  if (c.includes('PERM') || n.includes('derecho') || n.includes('tasa') || n.includes('muni') || n.includes('plano')) {
    return <ShieldCheck className="h-4 w-4" />;
  }
  if (c.includes('ESTR') || n.includes('hormigón') || n.includes('estructura')) {
    return <Building2 className="h-4 w-4" />;
  }
  if (c.includes('PINT') || n.includes('pintur') || n.includes('yeso')) {
    return <Paintbrush className="h-4 w-4" />;
  }
  if (c.includes('ELEC') || n.includes('electr') || n.includes('iluminac')) {
    return <Zap className="h-4 w-4" />;
  }
  if (c.includes('SAN') || c.includes('PLO') || n.includes('sanitar') || n.includes('plomer') || n.includes('gas')) {
    return <Wrench className="h-4 w-4" />;
  }
  return <Layers className="h-4 w-4" />;
};

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  transactions,
  projects,
  categories,
  currency,
  onNewExpense,
  onEditTransaction,
  onDeleteTransaction,
  selectedProjectId,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  const expenseTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === 'egreso');
  }, [transactions]);

  // Overall Totals
  const totalARS = expenseTransactions.reduce((acc, t) => acc + t.amountARS, 0);
  const totalUSD = expenseTransactions.reduce((acc, t) => acc + t.amountUSD, 0);

  // Dynamic ranking of expense categories sorted from highest to lowest spending (de mayor a menor)
  const dynamicExpenseCategories = useMemo(() => {
    const expenseCats = categories.filter((c) => c.type === 'egreso');
    
    // Group transactions by categoryId
    const map = new Map<string, { ars: number; usd: number; count: number }>();
    expenseTransactions.forEach((tx) => {
      const prev = map.get(tx.categoryId) || { ars: 0, usd: 0, count: 0 };
      map.set(tx.categoryId, {
        ars: prev.ars + tx.amountARS,
        usd: prev.usd + tx.amountUSD,
        count: prev.count + 1,
      });
    });

    const list = expenseCats.map((cat) => {
      const stats = map.get(cat.id) || { ars: 0, usd: 0, count: 0 };
      const val = currency === 'ARS' ? stats.ars : stats.usd;
      const totalVal = currency === 'ARS' ? totalARS : totalUSD;
      const percent = totalVal > 0 ? (val / totalVal) * 100 : 0;

      return {
        category: cat,
        amountARS: stats.ars,
        amountUSD: stats.usd,
        value: val,
        percent,
        count: stats.count,
      };
    });

    // Sort descending by total spent in active currency (de mayor a menor)
    list.sort((a, b) => b.value - a.value);

    // Return the top 4 categories to maintain the 5 indicators (Total + 4 top rubros)
    return list.slice(0, 4);
  }, [categories, expenseTransactions, currency, totalARS, totalUSD]);

  // Chart data: Rubros Distribution in USD
  const categoryChartData = useMemo(() => {
    const map = new Map<string, { name: string; value: number; color: string; count: number }>();
    
    expenseTransactions.forEach((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      const catName = cat ? cat.name : 'Varios';
      const catColor = cat ? cat.color : '#64748B';
      const val = tx.amountUSD;

      if (!map.has(catName)) {
        map.set(catName, { name: catName, value: 0, color: catColor, count: 0 });
      }
      const entry = map.get(catName)!;
      entry.value += val;
      entry.count += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [expenseTransactions, categories]);

  // Filtered by Rubro Chip if selected
  const displayedTransactions = useMemo(() => {
    if (activeCategoryFilter === 'all') return expenseTransactions;
    return expenseTransactions.filter((t) => t.categoryId === activeCategoryFilter);
  }, [expenseTransactions, activeCategoryFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white tracking-tight">Aplicación de Fondos</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Egresos & Costos de Obra
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Control discriminado de Mano de Obra, Acopio de Materiales, Honorarios, Permisos, Fletes y Servicios.
          </p>
        </div>

        <button
          id="new-expense-btn"
          onClick={onNewExpense}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 transition transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>+ Nuevo Egreso / Costo</span>
        </button>
      </div>

      {/* KPI Cards: Dynamic 5 Indicators (Total + 4 Top Expense Categories Sorted Descending) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Indicator 1: Total Egresos */}
        <div 
          onClick={() => setActiveCategoryFilter('all')}
          className={`bg-slate-900 border p-4 rounded-2xl shadow cursor-pointer transition transform hover:-translate-y-0.5 ${
            activeCategoryFilter === 'all' 
              ? 'border-rose-500/70 ring-2 ring-rose-500/20' 
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">Total Egresos</span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {formatCurrency(totalUSD, 'USD')}
          </div>
          <div className="text-xs text-rose-400/80 font-mono mt-1 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">Equiv. $ {formatNumber(totalARS, 0)} ARS</span>
            <span className="text-[11px] text-slate-400 font-sans">{expenseTransactions.length} comprobantes</span>
          </div>
        </div>

        {/* Indicators 2 to 5: Top 4 Rubros (De Mayor a Menor) */}
        {dynamicExpenseCategories.map((item, idx) => {
          const isSelected = activeCategoryFilter === item.category.id;
          const catColor = item.category.color || '#3B82F6';

          return (
            <div 
              key={item.category.id}
              onClick={() => setActiveCategoryFilter(isSelected ? 'all' : item.category.id)}
              className={`bg-slate-900 border p-4 rounded-2xl shadow cursor-pointer transition transform hover:-translate-y-0.5 relative overflow-hidden ${
                isSelected 
                  ? 'ring-2' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
              style={
                isSelected 
                  ? { borderColor: catColor, boxShadow: `0 0 0 2px ${catColor}33` } 
                  : undefined
              }
            >
              {/* Ranking Badge */}
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    #{idx + 1}
                  </span>
                  <span 
                    className="text-xs font-semibold uppercase tracking-wider truncate max-w-[110px]"
                    title={item.category.name}
                  >
                    {item.category.name}
                  </span>
                </div>
                <div 
                  className="p-2 rounded-xl shrink-0"
                  style={{ backgroundColor: `${catColor}25`, color: catColor }}
                >
                  {getCategoryIcon(item.category.code, item.category.name)}
                </div>
              </div>

              <div 
                className="text-2xl font-black font-mono tracking-tight truncate"
                style={{ color: catColor }}
              >
                {formatCurrency(item.amountUSD, 'USD')}
              </div>

              <div className="text-xs text-slate-400 font-mono mt-1 flex items-center justify-between">
                <span>{item.percent.toFixed(1)}% del costo</span>
                <span className="text-[11px] font-sans">{item.count} {item.count === 1 ? 'pago' : 'pagos'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-rose-400" />
              <h3 className="font-bold text-sm text-slate-100">Distribución de Costos por Rubro</h3>
            </div>
            <span className="text-xs text-slate-400">
              Moneda: Dólares Americanos (u$s USD)
            </span>
          </div>

          <div className="h-64 w-full">
            {categoryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Sin datos de egresos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <XAxis 
                    type="number" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#cbd5e1" 
                    fontSize={11} 
                    width={110} 
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [formatCurrency(Number(val), 'USD'), 'Gasto USD']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-amber-400" />
              <h3 className="font-bold text-sm text-slate-100">Participación % del Costo</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">u$s USD</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {categoryChartData.length === 0 ? (
              <div className="text-xs text-slate-500">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [formatCurrency(Number(val), 'USD'), 'Total USD']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Rubro Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
          <Filter className="h-3.5 w-3.5" />
          Filtrar Rubro:
        </span>
        
        <button
          onClick={() => setActiveCategoryFilter('all')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
            activeCategoryFilter === 'all'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Todos ({expenseTransactions.length})
        </button>

        {categories
          .filter((c) => c.type === 'egreso')
          .map((cat) => {
            const count = expenseTransactions.filter((t) => t.categoryId === cat.id).length;
            const isSelected = activeCategoryFilter === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
                style={
                  isSelected
                    ? { backgroundColor: cat.color, borderColor: cat.color }
                    : undefined
                }
              >
                <span 
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: isSelected ? '#ffffff' : cat.color }}
                />
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
      </div>

      {/* Full Interactive Table */}
      <TransactionsTable
        title="Libro Diario de Aplicación de Fondos (Egresos & Costos)"
        transactions={displayedTransactions}
        projects={projects}
        categories={categories}
        currency={currency}
        onEdit={onEditTransaction}
        onDelete={onDeleteTransaction}
        typeFilter="egreso"
      />
    </div>
  );
};
