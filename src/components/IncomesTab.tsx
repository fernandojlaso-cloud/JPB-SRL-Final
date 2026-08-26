import React, { useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Plus, 
  ArrowUpRight, 
  PieChart as PieIcon, 
  BarChart3,
  Landmark,
  Coins
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Transaction, Project, AccountCategory, Currency } from '../types';
import { formatCurrency } from '../utils/formatters';
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
  const incomeTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === 'ingreso');
  }, [transactions]);

  // Aggregate metrics
  const totalARS = incomeTransactions.reduce((acc, t) => acc + t.amountARS, 0);
  const totalUSD = incomeTransactions.reduce((acc, t) => acc + t.amountUSD, 0);

  // Divisas (u$s sales)
  const divisasTx = incomeTransactions.filter(
    (t) => t.categoryId === 'cat-in-2' || t.concept.toLowerCase().includes('vta. u$s') || t.concept.toLowerCase().includes('dolar')
  );
  const divisasARS = divisasTx.reduce((acc, t) => acc + t.amountARS, 0);
  const divisasUSD = divisasTx.reduce((acc, t) => acc + t.amountUSD, 0);

  // Direct partners or client payments
  const partnersTx = incomeTransactions.filter(
    (t) => t.categoryId === 'cat-in-1' || t.categoryId === 'cat-in-4'
  );
  const partnersARS = partnersTx.reduce((acc, t) => acc + t.amountARS, 0);
  const partnersUSD = partnersTx.reduce((acc, t) => acc + t.amountUSD, 0);

  // Cards / Other
  const cardsTx = incomeTransactions.filter(
    (t) => t.categoryId === 'cat-in-3' || t.concept.toLowerCase().includes('tarjeta')
  );
  const cardsARS = cardsTx.reduce((acc, t) => acc + t.amountARS, 0);
  const cardsUSD = cardsTx.reduce((acc, t) => acc + t.amountUSD, 0);

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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ingresos */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Ingresos</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {formatCurrency(currency === 'ARS' ? totalARS : totalUSD, currency)}
          </div>
          <div className="text-xs text-emerald-400/80 font-mono mt-1">
            {currency === 'ARS' ? formatCurrency(totalUSD, 'USD') : formatCurrency(totalARS, 'ARS')}
          </div>
        </div>

        {/* Venta de Divisas (u$s) */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Venta de Divisas</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
            {formatCurrency(currency === 'ARS' ? divisasARS : divisasUSD, currency)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {divisasTx.length} operaciones liquidadas
          </div>
        </div>

        {/* Aportes Directos / Socios */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Aportes Propietarios</span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono tracking-tight">
            {formatCurrency(currency === 'ARS' ? partnersARS : partnersUSD, currency)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Transferencias y depósitos
          </div>
        </div>

        {/* Pagos con Tarjeta / Otros */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tarjetas / Terceros</span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono tracking-tight">
            {formatCurrency(currency === 'ARS' ? cardsARS : cardsUSD, currency)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {cardsTx.length} pagos directos
          </div>
        </div>
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
              Moneda: {currency === 'ARS' ? 'Pesos ($)' : 'Dólares (u$s)'}
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
                    formatter={(val: any) => [formatCurrency(Number(val), currency), 'Ingreso']}
                  />
                  <Bar dataKey={currency} fill="#10B981" radius={[4, 4, 0, 0]} />
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
                    formatter={(val: any) => [formatCurrency(Number(val), currency), 'Monto']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Full Interactive Table */}
      <TransactionsTable
        title="Libro Diario de Origen de Fondos (Ingresos)"
        transactions={incomeTransactions}
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
