import React, { useMemo, useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  PieChart as PieIcon, 
  Layers, 
  ShieldAlert, 
  SlidersHorizontal,
  Info,
  DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import { 
  Project, 
  AccountCategory, 
  BudgetEstimate, 
  Transaction, 
  Currency,
  DeviationAnalysis 
} from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface BudgetDeviationsTabProps {
  projects: Project[];
  selectedProjectId: string;
  categories: AccountCategory[];
  budgets: BudgetEstimate[];
  transactions: Transaction[];
  currency: Currency;
  onUpdateBudget: (projectId: string, categoryId: string, budgetedARS: number, budgetedUSD: number) => void;
}

export const BudgetDeviationsTab: React.FC<BudgetDeviationsTabProps> = ({
  projects,
  selectedProjectId,
  categories,
  budgets,
  transactions,
  currency,
  onUpdateBudget,
}) => {
  const [editingBudgetCategory, setEditingBudgetCategory] = useState<string | null>(null);
  const [editBudgetARS, setEditBudgetARS] = useState<string>('');
  const [editBudgetUSD, setEditBudgetUSD] = useState<string>('');

  const isMacro = selectedProjectId === 'macro';
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  // Relevant projects list
  const activeProjects = isMacro ? projects : projects.filter((p) => p.id === selectedProjectId);

  // Total project budget
  const totalProjectBudgetARS = activeProjects.reduce((acc, p) => acc + p.budgetARS, 0);
  const totalProjectBudgetUSD = activeProjects.reduce((acc, p) => acc + p.budgetUSD, 0);

  // Filter transactions
  const activeTransactions = transactions.filter((t) => {
    if (t.type !== 'egreso') return false;
    if (!isMacro && t.projectId !== selectedProjectId) return false;
    return true;
  });

  // Calculate Deviations per Category
  const deviationData: DeviationAnalysis[] = useMemo(() => {
    const expenseCategories = categories.filter((c) => c.type === 'egreso');

    return expenseCategories.map((cat) => {
      // Aggregate budgets for this category
      let budgetedARS = 0;
      let budgetedUSD = 0;

      if (isMacro) {
        budgets
          .filter((b) => b.categoryId === cat.id)
          .forEach((b) => {
            budgetedARS += b.budgetedARS;
            budgetedUSD += b.budgetedUSD;
          });
      } else {
        const b = budgets.find(
          (item) => item.projectId === selectedProjectId && item.categoryId === cat.id
        );
        if (b) {
          budgetedARS = b.budgetedARS;
          budgetedUSD = b.budgetedUSD;
        }
      }

      // Aggregate actual expenses for this category
      const catTransactions = activeTransactions.filter((t) => t.categoryId === cat.id);
      const actualARS = catTransactions.reduce((acc, t) => acc + t.amountARS, 0);
      const actualUSD = catTransactions.reduce((acc, t) => acc + t.amountUSD, 0);

      const diffARS = actualARS - budgetedARS;
      const diffUSD = actualUSD - budgetedUSD;

      const percentageUsed = budgetedARS > 0 ? (actualARS / budgetedARS) * 100 : actualARS > 0 ? 100 : 0;
      const deviationPercentage = budgetedARS > 0 ? ((actualARS - budgetedARS) / budgetedARS) * 100 : 0;

      // PESO ESPECÍFICO: impacto del desvío sobre el presupuesto total de la obra
      const specificWeightPercentage =
        totalProjectBudgetARS > 0
          ? (Math.abs(diffARS) / totalProjectBudgetARS) * 100
          : 0;

      // Risk level calculation based on deviation percentage and specific weight
      let riskLevel: 'normal' | 'alerta' | 'critico' = 'normal';
      if (diffARS > 0) {
        if (specificWeightPercentage >= 3.0 || deviationPercentage >= 20.0) {
          riskLevel = 'critico';
        } else if (specificWeightPercentage >= 1.0 || deviationPercentage >= 5.0 || percentageUsed >= 90.0) {
          riskLevel = 'alerta';
        }
      } else if (percentageUsed >= 90.0) {
        riskLevel = 'alerta';
      }

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryColor: cat.color,
        budgetedARS,
        budgetedUSD,
        actualARS,
        actualUSD,
        diffARS,
        diffUSD,
        percentageUsed,
        deviationPercentage,
        specificWeightPercentage,
        riskLevel,
      };
    });
  }, [categories, budgets, activeTransactions, isMacro, selectedProjectId, totalProjectBudgetARS]);

  // Overall metrics
  const totalBudgetedARS = deviationData.reduce((acc, d) => acc + d.budgetedARS, 0);
  const totalBudgetedUSD = deviationData.reduce((acc, d) => acc + d.budgetedUSD, 0);
  const totalActualARS = deviationData.reduce((acc, d) => acc + d.actualARS, 0);
  const totalActualUSD = deviationData.reduce((acc, d) => acc + d.actualUSD, 0);

  const netDiffARS = totalActualARS - totalBudgetedARS;
  const netDiffUSD = totalActualUSD - totalBudgetedUSD;
  const totalPercentUsed = totalBudgetedARS > 0 ? (totalActualARS / totalBudgetedARS) * 100 : 0;

  // Critical deviations ranked by Specific Weight
  const rankedCriticalDeviations = useMemo(() => {
    return [...deviationData]
      .filter((d) => d.actualARS > 0 || d.budgetedARS > 0)
      .sort((a, b) => b.specificWeightPercentage - a.specificWeightPercentage);
  }, [deviationData]);

  // Chart comparison data
  const chartComparisonData = useMemo(() => {
    return deviationData
      .filter((d) => d.budgetedARS > 0 || d.actualARS > 0)
      .map((d) => ({
        name: d.categoryName.length > 18 ? d.categoryName.substring(0, 18) + '...' : d.categoryName,
        fullName: d.categoryName,
        Presupuestado: currency === 'ARS' ? d.budgetedARS : d.budgetedUSD,
        Ejecutado: currency === 'ARS' ? d.actualARS : d.actualUSD,
        color: d.categoryColor,
      }));
  }, [deviationData, currency]);

  const handleStartEdit = (catId: string, currentARS: number, currentUSD: number) => {
    setEditingBudgetCategory(catId);
    setEditBudgetARS(String(currentARS));
    setEditBudgetUSD(String(currentUSD));
  };

  const handleSaveBudget = (catId: string) => {
    const targetProjId = isMacro ? projects[0]?.id : selectedProjectId;
    if (!targetProjId) return;

    const ars = parseFloat(editBudgetARS) || 0;
    const usd = parseFloat(editBudgetUSD) || 0;

    onUpdateBudget(targetProjId, catId, ars, usd);
    setEditingBudgetCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Concept Explanation */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">Presupuesto vs. Real & Desvíos</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Scale className="h-3.5 w-3.5" />
                Análisis por Peso Específico
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Monitorea los desvíos ponderando el impacto económico real de cada rubro sobre el presupuesto global de la obra.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
            <Info className="h-4 w-4 text-amber-400 shrink-0" />
            <div className="text-slate-300 leading-tight">
              <span className="font-bold text-amber-300">¿Qué es el Peso Específico?</span>
              <span className="block text-[11px] text-slate-400">
                Pondera cuánto incide el desvío de un rubro sobre el 100% de la obra (evita falsas alarmas en gastos menores).
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Presupuesto Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Presupuesto Total */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Presupuesto Estimado</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
            {formatCurrency(currency === 'ARS' ? totalBudgetedARS : totalBudgetedUSD, currency)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {currency === 'ARS' ? formatCurrency(totalBudgetedUSD, 'USD') : formatCurrency(totalBudgetedARS, 'ARS')}
          </div>
        </div>

        {/* Real Ejecutado */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Costo Real Ejecutado</span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono tracking-tight">
            {formatCurrency(currency === 'ARS' ? totalActualARS : totalActualUSD, currency)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {totalPercentUsed.toFixed(1)}% del presupuesto consumido
          </div>
        </div>

        {/* Desvío Neto Total */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Desvío Neto Total</span>
            <div className={`p-2 rounded-xl ${netDiffARS > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {netDiffARS > 0 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </div>
          </div>
          <div className={`text-2xl font-black font-mono tracking-tight ${netDiffARS > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {netDiffARS > 0 ? '+' : ''}{formatCurrency(currency === 'ARS' ? netDiffARS : netDiffUSD, currency)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {netDiffARS > 0 ? '⚠️ Sobrecosto acumulado' : '✅ Dentro del límite'}
          </div>
        </div>

        {/* Saldo / Margen Restante */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Presupuesto Remanente</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
            {formatCurrency(
              currency === 'ARS' ? totalBudgetedARS - totalActualARS : totalBudgetedUSD - totalActualUSD,
              currency
            )}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {(100 - totalPercentUsed).toFixed(1)}% por ejecutar
          </div>
        </div>
      </div>

      {/* Tablero Destacado: Top Desvíos Críticos por Peso Específico */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            <h3 className="font-bold text-base text-slate-100">
              Tablero de Desvíos Críticos por Peso Específico
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Ordenado de mayor a menor impacto sobre la obra
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rankedCriticalDeviations.slice(0, 3).map((item, idx) => {
            const isExcess = item.diffARS > 0;
            return (
              <div
                key={item.categoryId}
                className={`p-4 rounded-xl border transition relative overflow-hidden ${
                  item.riskLevel === 'critico'
                    ? 'bg-rose-950/20 border-rose-800/60'
                    : item.riskLevel === 'alerta'
                    ? 'bg-amber-950/20 border-amber-800/60'
                    : 'bg-slate-800/40 border-slate-800'
                }`}
              >
                {/* Ranking Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    #{idx + 1} Impacto
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.riskLevel === 'critico'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : item.riskLevel === 'alerta'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {item.riskLevel === 'critico' ? '🔴 Desvío Crítico' : item.riskLevel === 'alerta' ? '🟡 En Alerta' : '🟢 Normal'}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-100 truncate mb-1">
                  {item.categoryName}
                </h4>

                <div className="space-y-1.5 text-xs mt-3">
                  <div className="flex justify-between text-slate-400">
                    <span>Desvío en Monto:</span>
                    <span className={`font-mono font-bold ${isExcess ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isExcess ? '+' : ''}
                      {formatCurrency(currency === 'ARS' ? item.diffARS : item.diffUSD, currency)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Desvío Relativo (%):</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {item.deviationPercentage > 0 ? `+${item.deviationPercentage.toFixed(1)}%` : `${item.deviationPercentage.toFixed(1)}%`}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                    <span className="font-bold text-amber-300">Peso Específico s/Obra:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {item.specificWeightPercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.percentageUsed > 100
                          ? 'bg-rose-500'
                          : item.percentageUsed > 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(item.percentageUsed, 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                    <span>{item.percentageUsed.toFixed(1)}% consumido</span>
                    <span>Presupuesto: {formatCurrency(currency === 'ARS' ? item.budgetedARS : item.budgetedUSD, currency)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Chart: Presupuestado vs Real por Rubro */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Comparativa Visual: Presupuestado vs. Real Ejecutado
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Valores en {currency === 'ARS' ? 'Pesos ($)' : 'Dólares (u$s)'}
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartComparisonData}
              margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
            >
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-15} textAnchor="end" tickLine={false} />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(val: any) => [formatCurrency(Number(val), currency)]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Presupuestado" fill="#475569" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Ejecutado" fill="#38BDF8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Complete Matrix Table: Presupuesto vs Real por Rubro */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-100">
            Matriz Detallada de Costos, Presupuesto y Desvíos
          </h4>
          <span className="text-xs text-slate-400">
            Haz clic en "Ajustar Presupuesto" para calibrar metas de obra
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">RUBRO / CUENTA</th>
                <th className="py-3 px-4 text-right">PRESUPUESTADO</th>
                <th className="py-3 px-4 text-right">REAL EJECUTADO</th>
                <th className="py-3 px-4 text-right">DESVÍO ($ / u$s)</th>
                <th className="py-3 px-4 text-center">% EJECUTADO</th>
                <th className="py-3 px-4 text-center">PESO ESPECÍFICO</th>
                <th className="py-3 px-4 text-center">ESTADO / RIESGO</th>
                <th className="py-3 px-3 text-right">AJUSTAR</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {deviationData.map((row) => {
                const isEditing = editingBudgetCategory === row.categoryId;
                const budgeted = currency === 'ARS' ? row.budgetedARS : row.budgetedUSD;
                const actual = currency === 'ARS' ? row.actualARS : row.actualUSD;
                const diff = currency === 'ARS' ? row.diffARS : row.diffUSD;

                return (
                  <tr key={row.categoryId} className="hover:bg-slate-800/40 transition">
                    {/* Rubro */}
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      <div className="flex items-center gap-2">
                        <span 
                          className="h-2.5 w-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: row.categoryColor }}
                        />
                        <span>{row.categoryName}</span>
                      </div>
                    </td>

                    {/* Presupuestado */}
                    <td className="py-3 px-4 text-right font-mono text-slate-300 font-medium">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={currency === 'ARS' ? editBudgetARS : editBudgetUSD}
                            onChange={(e) => {
                              if (currency === 'ARS') {
                                setEditBudgetARS(e.target.value);
                                const tc = currentProject?.defaultExchangeRate || 180;
                                setEditBudgetUSD((parseFloat(e.target.value) / tc).toFixed(2));
                              } else {
                                setEditBudgetUSD(e.target.value);
                                const tc = currentProject?.defaultExchangeRate || 180;
                                setEditBudgetARS((parseFloat(e.target.value) * tc).toFixed(2));
                              }
                            }}
                            className="w-28 bg-slate-950 border border-amber-400 rounded px-2 py-1 text-right text-xs text-white"
                          />
                        </div>
                      ) : (
                        formatCurrency(budgeted, currency)
                      )}
                    </td>

                    {/* Real Ejecutado */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      {formatCurrency(actual, currency)}
                    </td>

                    {/* Desvío */}
                    <td className={`py-3 px-4 text-right font-mono font-bold ${diff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {diff > 0 ? '+' : ''}{formatCurrency(diff, currency)}
                    </td>

                    {/* % Ejecutado Progress */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex flex-col items-center min-w-[80px]">
                        <span className="font-mono font-semibold text-xs">
                          {row.percentageUsed.toFixed(1)}%
                        </span>
                        <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${
                              row.percentageUsed > 100
                                ? 'bg-rose-500'
                                : row.percentageUsed > 85
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(row.percentageUsed, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Peso Específico */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                      {row.specificWeightPercentage.toFixed(2)}%
                    </td>

                    {/* Riesgo */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.riskLevel === 'critico'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : row.riskLevel === 'alerta'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {row.riskLevel === 'critico' ? '🔴 Crítico' : row.riskLevel === 'alerta' ? '🟡 Alerta' : '🟢 Normal'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleSaveBudget(row.categoryId)}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px]"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingBudgetCategory(null)}
                            className="px-1.5 py-0.5 bg-slate-800 text-slate-400 hover:text-white rounded text-[10px]"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(row.categoryId, row.budgetedARS, row.budgetedUSD)}
                          className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition"
                          title="Ajustar Presupuesto"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Matrix Footer */}
            <tfoot className="bg-slate-950 font-bold text-slate-200 border-t-2 border-slate-800">
              <tr>
                <td className="py-3 px-4 uppercase text-slate-400">TOTAL CONSOLIDADO:</td>
                <td className="py-3 px-4 text-right font-mono text-slate-300">
                  {formatCurrency(currency === 'ARS' ? totalBudgetedARS : totalBudgetedUSD, currency)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-blue-400">
                  {formatCurrency(currency === 'ARS' ? totalActualARS : totalActualUSD, currency)}
                </td>
                <td className={`py-3 px-4 text-right font-mono ${netDiffARS > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {netDiffARS > 0 ? '+' : ''}{formatCurrency(currency === 'ARS' ? netDiffARS : netDiffUSD, currency)}
                </td>
                <td className="py-3 px-4 text-center font-mono">
                  {totalPercentUsed.toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-center font-mono text-amber-400">100.00%</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
