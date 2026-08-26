import React, { useMemo, useState } from 'react';
import { 
  DollarSign, 
  HardHat, 
  Package, 
  ScrollText, 
  Truck, 
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
import { formatCurrency } from '../utils/formatters';
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

  // Totals
  const totalARS = expenseTransactions.reduce((acc, t) => acc + t.amountARS, 0);
  const totalUSD = expenseTransactions.reduce((acc, t) => acc + t.amountUSD, 0);

  // Mano de Obra
  const moTx = expenseTransactions.filter((t) => t.categoryId === 'cat-mo');
  const moARS = moTx.reduce((acc, t) => acc + t.amountARS, 0);
  const moUSD = moTx.reduce((acc, t) => acc + t.amountUSD, 0);

  // Materiales
  const matTx = expenseTransactions.filter((t) => t.categoryId === 'cat-mat');
  const matARS = matTx.reduce((acc, t) => acc + t.amountARS, 0);
  const matUSD = matTx.reduce((acc, t) => acc + t.amountUSD, 0);

  // Honorarios y Permisos
  const honTx = expenseTransactions.filter((t) => t.categoryId === 'cat-hon' || t.categoryId === 'cat-perm');
  const honARS = honTx.reduce((acc, t) => acc + t.amountARS, 0);
  const honUSD = honTx.reduce((acc, t) => acc + t.amountUSD, 0);

  // Logística / Volquetes
  const logTx = expenseTransactions.filter((t) => t.categoryId === 'cat-log');
  const logARS = logTx.reduce((acc, t) => acc + t.amountARS, 0);
  const logUSD = logTx.reduce((acc, t) => acc + t.amountUSD, 0);

  // Chart data: Rubros Distribution
  const categoryChartData = useMemo(() => {
    const map = new Map<string, { name: string; value: number; color: string; count: number }>();
    
    expenseTransactions.forEach((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      const catName = cat ? cat.name : 'Varios';
      const catColor = cat ? cat.color : '#64748B';
      const val = currency === 'ARS' ? tx.amountARS : tx.amountUSD;

      if (!map.has(catName)) {
        map.set(catName, { name: catName, value: 0, color: catColor, count: 0 });
      }
      const entry = map.get(catName)!;
      entry.value += val;
      entry.count += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [expenseTransactions, categories, currency]);

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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Egresos */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Egresos</span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {formatCurrency(currency === 'ARS' ? totalARS : totalUSD, currency)}
          </div>
          <div className="text-xs text-rose-400/80 font-mono mt-1">
            {currency === 'ARS' ? formatCurrency(totalUSD, 'USD') : formatCurrency(totalARS, 'ARS')}
          </div>
        </div>

        {/* Mano de Obra */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mano de Obra</span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <HardHat className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono tracking-tight">
            {formatCurrency(currency === 'ARS' ? moARS : moUSD, currency)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {totalARS > 0 ? ((moARS / totalARS) * 100).toFixed(1) : 0}% del costo total
          </div>
        </div>

        {/* Materiales y Acopios */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Materiales & Acopios</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
            {formatCurrency(currency === 'ARS' ? matARS : matUSD, currency)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {totalARS > 0 ? ((matARS / totalARS) * 100).toFixed(1) : 0}% del costo total
          </div>
        </div>

        {/* Honorarios & Tasas */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Honorarios & Tasas</span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <ScrollText className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono tracking-tight">
            {formatCurrency(currency === 'ARS' ? honARS : honUSD, currency)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {honTx.length} pagos liquidados
          </div>
        </div>

        {/* Logística y Volquetes */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Volquetes & Fletes</span>
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-400 font-mono tracking-tight">
            {formatCurrency(currency === 'ARS' ? logARS : logUSD, currency)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {logTx.length} viajes registrados
          </div>
        </div>
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
              Moneda: {currency === 'ARS' ? 'Pesos ($)' : 'Dólares (u$s)'}
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
                    formatter={(val: any) => [formatCurrency(Number(val), currency), 'Gasto']}
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
                    formatter={(val: any) => [formatCurrency(Number(val), currency), 'Total']}
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
