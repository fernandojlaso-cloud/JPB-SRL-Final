import React, { useMemo } from 'react';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  ArrowUpRight, 
  ChevronRight, 
  DollarSign, 
  Layers, 
  ShieldCheck, 
  AlertCircle,
  Edit2,
  Trash2
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
import { Project, AccountCategory, BudgetEstimate, Transaction, Currency } from '../types';
import { formatCurrency } from '../utils/formatters';
import { JpbSrlLogo } from './JpbSrlLogo';

interface MacroOverviewProps {
  projects: Project[];
  categories: AccountCategory[];
  budgets: BudgetEstimate[];
  transactions: Transaction[];
  currency: Currency;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onEditProject?: (p: Project) => void;
  onDeleteProject?: (id: string) => void;
}

export const MacroOverview: React.FC<MacroOverviewProps> = ({
  projects,
  categories,
  budgets,
  transactions,
  currency,
  onSelectProject,
  onNewProject,
  onEditProject,
  onDeleteProject,
}) => {
  // Aggregate stats per project
  const projectStats = useMemo(() => {
    return projects.map((p) => {
      const pTx = transactions.filter((t) => t.projectId === p.id);
      
      const incomeARS = pTx.filter((t) => t.type === 'ingreso').reduce((a, b) => a + b.amountARS, 0);
      const incomeUSD = pTx.filter((t) => t.type === 'ingreso').reduce((a, b) => a + b.amountUSD, 0);

      const expenseARS = pTx.filter((t) => t.type === 'egreso').reduce((a, b) => a + b.amountARS, 0);
      const expenseUSD = pTx.filter((t) => t.type === 'egreso').reduce((a, b) => a + b.amountUSD, 0);

      const balanceARS = incomeARS - expenseARS;
      const balanceUSD = incomeUSD - expenseUSD;

      const budgetedARS = p.budgetARS;
      const budgetedUSD = p.budgetUSD;

      const progressARS = budgetedARS > 0 ? (expenseARS / budgetedARS) * 100 : 0;
      const progressUSD = budgetedUSD > 0 ? (expenseUSD / budgetedUSD) * 100 : 0;

      return {
        ...p,
        incomeARS,
        incomeUSD,
        expenseARS,
        expenseUSD,
        balanceARS,
        balanceUSD,
        progressARS,
        progressUSD,
        txCount: pTx.length,
      };
    });
  }, [projects, transactions]);

  // Overall totals
  const macroIncomeARS = projectStats.reduce((acc, p) => acc + p.incomeARS, 0);
  const macroIncomeUSD = projectStats.reduce((acc, p) => acc + p.incomeUSD, 0);
  const macroExpenseARS = projectStats.reduce((acc, p) => acc + p.expenseARS, 0);
  const macroExpenseUSD = projectStats.reduce((acc, p) => acc + p.expenseUSD, 0);
  const macroBudgetARS = projectStats.reduce((acc, p) => acc + p.budgetARS, 0);
  const macroBudgetUSD = projectStats.reduce((acc, p) => acc + p.budgetUSD, 0);

  const macroBalanceARS = macroIncomeARS - macroExpenseARS;
  const macroBalanceUSD = macroIncomeUSD - macroExpenseUSD;

  // Chart data: Project comparison
  const projectComparisonData = projectStats.map((p) => ({
    name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
    fullName: p.name,
    Ingresos: currency === 'ARS' ? p.incomeARS : p.incomeUSD,
    Egresos: currency === 'ARS' ? p.expenseARS : p.expenseUSD,
    Presupuesto: currency === 'ARS' ? p.budgetARS : p.budgetUSD,
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white tracking-tight">Consolidado Macro de Obras</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {projects.length} Obras Activas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visión ejecutiva integral de JPB SRL: balance global de ingresos, gastos totales y estado presupuestario de todos los frentes de obra.
          </p>
        </div>

        <button
          onClick={onNewProject}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition transform active:scale-95"
        >
          <Building2 className="h-4 w-4" />
          <span>+ Agregar Nueva Obra</span>
        </button>
      </div>

      {/* Global Macro KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos Totales Macro */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ingresos Globales</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
            {formatCurrency(macroIncomeUSD, 'USD')}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Equiv. $ {macroIncomeARS > 0 ? (macroIncomeARS / 1000000).toFixed(1) + 'M ARS' : '0 ARS'}
          </div>
        </div>

        {/* Egresos Totales Macro */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Egresos Globales</span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono tracking-tight">
            {formatCurrency(macroExpenseUSD, 'USD')}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Equiv. $ {macroExpenseARS > 0 ? (macroExpenseARS / 1000000).toFixed(1) + 'M ARS' : '0 ARS'}
          </div>
        </div>

        {/* Saldo / Flujo Neto */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Flujo de Caja Neto</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className={`text-2xl font-black font-mono tracking-tight ${macroBalanceUSD >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
            {formatCurrency(macroBalanceUSD, 'USD')}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {macroIncomeUSD > 0 ? `${((macroBalanceUSD / macroIncomeUSD) * 100).toFixed(1)}% margen operativo` : '0%'}
          </div>
        </div>

        {/* Presupuesto Total Consolidado */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Presupuesto Consolidado</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
            {formatCurrency(macroBudgetUSD, 'USD')}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {macroBudgetUSD > 0 ? `${((macroExpenseUSD / macroBudgetUSD) * 100).toFixed(1)}% ejecutado global` : '0%'}
          </div>
        </div>
      </div>

      {/* Comparison Chart: Projects Side-by-Side */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Comparativa Económica por Obra (Ingresos vs. Egresos vs. Presupuesto)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Valores en Dólares Americanos (u$s USD)
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(val: any) => [formatCurrency(Number(val), 'USD')]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar dataKey="Presupuesto" fill="#475569" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Egresos" fill="#F43F5E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of Individual Project Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base text-slate-100">Tablero de Control por Obra</h3>
          <span className="text-xs text-slate-400">Haz clic en cualquier obra para abrir su detalle</span>
        </div>

        {projects.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
            <Building2 className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-200">No hay obras registradas</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
              Aún no se han creado frentes de obra o han sido eliminados. Puedes crear una nueva obra o importar datos desde una planilla Excel.
            </p>
            <button
              onClick={onNewProject}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition"
            >
              <Building2 className="h-4 w-4" />
              <span>+ Crear Primera Obra</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {projectStats.map((p) => {
              const income = currency === 'ARS' ? p.incomeARS : p.incomeUSD;
              const expense = currency === 'ARS' ? p.expenseARS : p.expenseUSD;
              const balance = currency === 'ARS' ? p.balanceARS : p.balanceUSD;
              const budget = currency === 'ARS' ? p.budgetARS : p.budgetUSD;
              const progress = currency === 'ARS' ? p.progressARS : p.progressUSD;

              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg hover:shadow-amber-500/5 transition cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          <JpbSrlLogo variant="badge" size="sm" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                            {p.code}
                          </span>
                          <h4 className="font-bold text-base text-white group-hover:text-amber-300 transition mt-1">
                            {p.name}
                          </h4>
                        </div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>

                    {p.address && <p className="text-xs text-slate-400 mb-4">{p.address}</p>}

                    {/* Financial Mini Grid */}
                    <div className="space-y-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Presupuesto u$s:</span>
                        <span className="font-mono font-bold text-slate-200">{formatCurrency(p.budgetUSD, 'USD')}</span>
                      </div>
                      {p.totalM2 && p.totalM2 > 0 ? (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Metros & u$s/m²:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {p.totalM2} m² (u$s {(p.budgetUSD / p.totalM2).toFixed(0)}/m²)
                          </span>
                        </div>
                      ) : null}
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ingresos Totales:</span>
                        <span className="font-mono font-bold text-emerald-400">{formatCurrency(income, currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Egresos / Costos:</span>
                        <span className="font-mono font-bold text-rose-400">{formatCurrency(expense, currency)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800">
                        <span className="font-semibold text-slate-300">Saldo Disponible:</span>
                        <span className={`font-mono font-bold ${balance >= 0 ? 'text-amber-400' : 'text-rose-500'}`}>
                          {formatCurrency(balance, currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Footer */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Avance Presupuestario:</span>
                      <span className="font-bold text-slate-200">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress > 100 ? 'bg-rose-500' : progress > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                      <span>{p.txCount} movimientos</span>
                      <div className="flex items-center gap-2">
                        {onEditProject && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rawProj = projects.find(pr => pr.id === p.id);
                              if (rawProj) onEditProject(rawProj);
                            }}
                            className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition"
                            title="Editar obra"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onDeleteProject && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`¿Estás seguro de eliminar la obra "${p.name}"?`)) {
                                onDeleteProject(p.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                            title="Eliminar obra"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <span>Presupuesto: {formatCurrency(budget, currency)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
