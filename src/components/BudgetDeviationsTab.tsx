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
  DollarSign,
  Ruler,
  Building,
  BarChart3,
  Sparkles
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
  onAutoDistributeBudgets?: (projectId: string) => void;
}

export const BudgetDeviationsTab: React.FC<BudgetDeviationsTabProps> = ({
  projects,
  selectedProjectId,
  categories,
  budgets,
  transactions,
  currency,
  onUpdateBudget,
  onAutoDistributeBudgets,
}) => {
  const [editingBudgetCategory, setEditingBudgetCategory] = useState<string | null>(null);
  const [editBudgetUSD, setEditBudgetUSD] = useState<string>('');

  const isMacro = selectedProjectId === 'macro';
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  // Relevant projects list
  const activeProjects = isMacro ? projects : projects.filter((p) => p.id === selectedProjectId);

  // Total project budget in USD
  const totalProjectBudgetUSD = activeProjects.reduce((acc, p) => acc + p.budgetUSD, 0);
  const totalProjectBudgetARS = activeProjects.reduce((acc, p) => acc + p.budgetARS, 0);

  // Surface in m2
  const totalM2 = useMemo(() => {
    if (isMacro) {
      return activeProjects.reduce((acc, p) => acc + (p.totalM2 || 0), 0);
    }
    return currentProject?.totalM2 || 0;
  }, [isMacro, activeProjects, currentProject]);

  // Filter transactions (only expenses)
  const activeTransactions = transactions.filter((t) => {
    if (t.type !== 'egreso') return false;
    if (!isMacro && t.projectId !== selectedProjectId) return false;
    return true;
  });

  // Calculate Deviations per Category in USD
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

      const percentageUsed = budgetedUSD > 0 ? (actualUSD / budgetedUSD) * 100 : actualUSD > 0 ? 100 : 0;
      const deviationPercentage = budgetedUSD > 0 ? ((actualUSD - budgetedUSD) / budgetedUSD) * 100 : 0;

      // PESO ESPECÍFICO: impacto del desvío sobre el presupuesto total en dólares de la obra
      const specificWeightPercentage =
        totalProjectBudgetUSD > 0
          ? (Math.abs(diffUSD) / totalProjectBudgetUSD) * 100
          : 0;

      // Risk level calculation based on deviation percentage and specific weight
      let riskLevel: 'normal' | 'alerta' | 'critico' = 'normal';
      if (diffUSD > 0) {
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
  }, [categories, budgets, activeTransactions, isMacro, selectedProjectId, totalProjectBudgetUSD]);

  // Overall metrics in USD (Dólares Americanos)
  const sumCategoriesBudgetedUSD = deviationData.reduce((acc, d) => acc + d.budgetedUSD, 0);
  const totalBudgetedUSD = sumCategoriesBudgetedUSD > 0 ? sumCategoriesBudgetedUSD : totalProjectBudgetUSD;
  const totalActualUSD = deviationData.reduce((acc, d) => acc + d.actualUSD, 0);
  const netDiffUSD = totalActualUSD - totalBudgetedUSD;
  const totalPercentUsed = totalBudgetedUSD > 0 ? (totalActualUSD / totalBudgetedUSD) * 100 : 0;

  // Metric: USD / m2 Presupuestado vs Real
  const costPerM2BudgetedUSD = totalM2 > 0 ? totalBudgetedUSD / totalM2 : 0;
  const costPerM2ActualUSD = totalM2 > 0 ? totalActualUSD / totalM2 : 0;
  const costPerM2DiffUSD = costPerM2ActualUSD - costPerM2BudgetedUSD;
  const costPerM2DiffPercent = costPerM2BudgetedUSD > 0 ? (costPerM2DiffUSD / costPerM2BudgetedUSD) * 100 : 0;

  // Critical deviations ranked by Specific Weight
  const rankedCriticalDeviations = useMemo(() => {
    return [...deviationData]
      .filter((d) => d.actualUSD > 0 || d.budgetedUSD > 0)
      .sort((a, b) => b.specificWeightPercentage - a.specificWeightPercentage);
  }, [deviationData]);

  // Chart comparison data in USD
  const chartComparisonData = useMemo(() => {
    return deviationData
      .filter((d) => d.budgetedUSD > 0 || d.actualUSD > 0)
      .map((d) => ({
        name: d.categoryName.length > 18 ? d.categoryName.substring(0, 18) + '...' : d.categoryName,
        fullName: d.categoryName,
        Presupuestado: d.budgetedUSD,
        Ejecutado: d.actualUSD,
        color: d.categoryColor,
      }));
  }, [deviationData]);

  const handleStartEdit = (catId: string, currentUSD: number) => {
    setEditingBudgetCategory(catId);
    setEditBudgetUSD(String(currentUSD));
  };

  const handleSaveBudget = (catId: string) => {
    const targetProjId = isMacro ? projects[0]?.id : selectedProjectId;
    if (!targetProjId) return;

    const usd = parseFloat(editBudgetUSD) || 0;
    const tc = currentProject?.defaultExchangeRate || 180;
    const ars = usd * tc;

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
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                Presupuesto en Dólares (u$s USD)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Monitoreo financiero en moneda dura (u$s) con análisis de costo por m² y desvíos ponderados por peso específico.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
            <Info className="h-4 w-4 text-amber-400 shrink-0" />
            <div className="text-slate-300 leading-tight">
              <span className="font-bold text-amber-300">¿Cómo se evalúa el Presupuesto?</span>
              <span className="block text-[11px] text-slate-400">
                Todos los valores presupuestados y desvíos se gestionan en Dólares Americanos (u$s) para proteger la inversión.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Presupuesto Summary Cards (En Dólares u$s) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Presupuesto Total u$s */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Presupuesto Meta</span>
            <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono tracking-tight">
            {formatCurrency(totalBudgetedUSD, 'USD')}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            u$s Dólares Americanos
          </div>
        </div>

        {/* Real Ejecutado u$s */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Costo Real Ejecutado</span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono tracking-tight">
            {formatCurrency(totalActualUSD, 'USD')}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {totalPercentUsed.toFixed(1)}% del presupuesto consumido
          </div>
        </div>

        {/* Desvío Neto Total u$s */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Desvío Neto Total</span>
            <div className={`p-2 rounded-xl ${netDiffUSD > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {netDiffUSD > 0 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </div>
          </div>
          <div className={`text-2xl font-black font-mono tracking-tight ${netDiffUSD > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {netDiffUSD > 0 ? '+' : ''}{formatCurrency(netDiffUSD, 'USD')}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {netDiffUSD > 0 ? '⚠️ Sobrecosto acumulado en u$s' : '✅ Dentro del presupuesto'}
          </div>
        </div>

        {/* Saldo / Margen Restante u$s */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Presupuesto Remanente</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
            {formatCurrency(totalBudgetedUSD - totalActualUSD, 'USD')}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {(100 - totalPercentUsed).toFixed(1)}% disponible por ejecutar
          </div>
        </div>
      </div>

      {/* NUEVO APARTADO DESTACADO: PRECIO POR METRO CUADRADO (u$s / m²) PRESUPUESTADO VS REAL */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/40 p-5 rounded-2xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Ruler className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  Precio por Metro Cuadrado: Presupuestado vs. Real
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  u$s / m²
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isMacro 
                  ? `Superficie total consolidada de ${activeProjects.length} obras: ${formatNumber(totalM2, 2)} m²`
                  : `Superficie de obra computada: ${formatNumber(totalM2, 2)} m²`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Metros Totales:</span>
            <span className="font-mono font-bold text-amber-300">
              {totalM2 > 0 ? `${formatNumber(totalM2, 2)} m²` : 'Sin asignar m²'}
            </span>
          </div>
        </div>

        {totalM2 > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {/* Presupuestado por m2 */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                1. Precio Presupuestado por m²
              </span>
              <div className="text-xl font-black text-emerald-300 font-mono">
                u$s {formatNumber(costPerM2BudgetedUSD, 2)} <span className="text-xs text-slate-400 font-sans">/ m²</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Meta económica asignada por metro cuadrado
              </span>
            </div>

            {/* Real Ejecutado por m2 */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                2. Costo Real Ejecutado por m²
              </span>
              <div className="text-xl font-black text-blue-400 font-mono">
                u$s {formatNumber(costPerM2ActualUSD, 2)} <span className="text-xs text-slate-400 font-sans">/ m²</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Gasto incurrido real por metro cuadrado
              </span>
            </div>

            {/* Desvío por m2 */}
            <div className={`p-3.5 rounded-xl border ${costPerM2DiffUSD > 0 ? 'bg-rose-950/30 border-rose-800/60' : 'bg-emerald-950/30 border-emerald-800/60'}`}>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                3. Desvío Unitario por m²
              </span>
              <div className={`text-xl font-black font-mono ${costPerM2DiffUSD > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {costPerM2DiffUSD > 0 ? '+' : ''}u$s {formatNumber(costPerM2DiffUSD, 2)} <span className="text-xs font-sans">/ m²</span>
              </div>
              <span className={`text-[10px] font-bold block mt-1 ${costPerM2DiffUSD > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                {costPerM2DiffUSD > 0 ? `⚠️ +${costPerM2DiffPercent.toFixed(1)}% sobre el costo proyectado` : `✅ Dentro del valor proyectado`}
              </span>
            </div>
          </div>
        ) : (
          <div className="pt-4 text-center text-xs text-amber-400 bg-amber-950/20 p-3 rounded-xl border border-amber-800/40">
            ℹ️ Para visualizar el ratio de costo por metro cuadrado, ingrese la cantidad de metros totales al editar o crear la obra.
          </div>
        )}
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
            Impacto calculado sobre el presupuesto en u$s de la obra
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rankedCriticalDeviations.slice(0, 3).map((item, idx) => {
            const isExcess = item.diffUSD > 0;
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
                    <span>Desvío en u$s:</span>
                    <span className={`font-mono font-bold ${isExcess ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isExcess ? '+' : ''}
                      {formatCurrency(item.diffUSD, 'USD')}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Desvío Relativo (%):</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {item.deviationPercentage > 0 ? `+${item.deviationPercentage.toFixed(1)}%` : `${item.deviationPercentage.toFixed(1)}%`}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Peso s/ Presupuesto Total:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {item.specificWeightPercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full ${
                      item.percentageUsed > 100
                        ? 'bg-rose-500'
                        : item.percentageUsed > 85
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(item.percentageUsed, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart: Presupuesto vs Real por Rubro */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-base text-slate-100">
              Comparativa Visual en Dólares: Presupuestado vs. Real Ejecutado
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Valores en Dólares Americanos (u$s USD)
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
                tickFormatter={(v) => `u$s ${(v / 1000).toFixed(0)}k`} 
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(val: any) => [formatCurrency(Number(val), 'USD')]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Presupuestado" fill="#475569" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Ejecutado" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Complete Matrix Table: Presupuesto vs Real por Rubro en Dólares */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h4 className="font-bold text-sm text-slate-100">
              Matriz Detallada de Costos, Presupuesto y Desvíos (u$s USD)
            </h4>
            <span className="text-xs text-slate-400">
              Haz clic en el icono para ajustar las metas presupuestarias en u$s
            </span>
          </div>

          {!isMacro && sumCategoriesBudgetedUSD === 0 && totalProjectBudgetUSD > 0 && onAutoDistributeBudgets && (
            <button
              onClick={() => onAutoDistributeBudgets(selectedProjectId)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Auto-calibrar Rubros (u$s {formatNumber(totalProjectBudgetUSD, 2)})
            </button>
          )}
        </div>

        {/* Informative banner if rubros are not yet allocated */}
        {!isMacro && sumCategoriesBudgetedUSD === 0 && totalProjectBudgetUSD > 0 && (
          <div className="bg-amber-950/30 border-b border-amber-800/50 p-3 px-4 flex items-center gap-2 text-amber-200 text-xs">
            <Info className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              El Presupuesto Meta de esta obra es de <strong>u$s {formatNumber(totalProjectBudgetUSD, 2)}</strong>. Puedes auto-distribuirlo proporcionalmente con un clic o cargar los montos específicos rubro por rubro.
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">RUBRO / CUENTA</th>
                <th className="py-3 px-4 text-right">PRESUPUESTADO (u$s)</th>
                <th className="py-3 px-4 text-right">REAL EJECUTADO (u$s)</th>
                <th className="py-3 px-4 text-right">DESVÍO (u$s)</th>
                <th className="py-3 px-4 text-center">% EJECUTADO</th>
                <th className="py-3 px-4 text-center">PESO ESPECÍFICO</th>
                <th className="py-3 px-4 text-center">ESTADO / RIESGO</th>
                <th className="py-3 px-3 text-right">AJUSTAR</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {deviationData.map((row) => {
                const isEditing = editingBudgetCategory === row.categoryId;
                const budgeted = row.budgetedUSD;
                const actual = row.actualUSD;
                const diff = row.diffUSD;

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

                    {/* Presupuestado u$s */}
                    <td className="py-3 px-4 text-right font-mono text-slate-300 font-medium">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={editBudgetUSD}
                            onChange={(e) => setEditBudgetUSD(e.target.value)}
                            className="w-28 bg-slate-950 border border-emerald-400 rounded px-2 py-1 text-right text-xs text-white"
                          />
                        </div>
                      ) : (
                        formatCurrency(budgeted, 'USD')
                      )}
                    </td>

                    {/* Real Ejecutado u$s */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      {formatCurrency(actual, 'USD')}
                    </td>

                    {/* Desvío u$s */}
                    <td className={`py-3 px-4 text-right font-mono font-bold ${diff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {diff > 0 ? '+' : ''}{formatCurrency(diff, 'USD')}
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
                          onClick={() => handleStartEdit(row.categoryId, row.budgetedUSD)}
                          className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition"
                          title="Ajustar Presupuesto u$s"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Matrix Footer with Total Consolidado AND LINEA DE PRECIO POR METRO CUADRADO */}
            <tfoot className="bg-slate-950 font-bold text-slate-200 border-t-2 border-slate-800">
              {/* Row 1: TOTAL CONSOLIDADO */}
              <tr className="border-b border-slate-800/80">
                <td className="py-3.5 px-4 uppercase text-slate-400">TOTAL CONSOLIDADO:</td>
                <td className="py-3.5 px-4 text-right font-mono text-emerald-300">
                  {formatCurrency(totalBudgetedUSD, 'USD')}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-blue-400">
                  {formatCurrency(totalActualUSD, 'USD')}
                </td>
                <td className={`py-3.5 px-4 text-right font-mono ${netDiffUSD > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {netDiffUSD > 0 ? '+' : ''}{formatCurrency(netDiffUSD, 'USD')}
                </td>
                <td className="py-3.5 px-4 text-center font-mono">
                  {totalPercentUsed.toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-amber-400">100.00%</td>
                <td colSpan={2}></td>
              </tr>

              {/* Row 2: PRECIO POR METRO CUADRADO (u$s / m2) */}
              <tr className="bg-emerald-950/40 text-emerald-200 border-t border-emerald-500/30 font-black">
                <td className="py-3.5 px-4 flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="uppercase tracking-wider text-emerald-300">PRECIO / METRO CUADRADO (u$s / m²):</span>
                    <span className="block text-[10px] text-slate-400 font-normal font-sans">
                      Superficie computada: {totalM2 > 0 ? `${formatNumber(totalM2, 2)} m²` : '0 m²'}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-emerald-300">
                  {totalM2 > 0 ? `u$s ${formatNumber(costPerM2BudgetedUSD, 2)} / m²` : '-'}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-blue-300">
                  {totalM2 > 0 ? `u$s ${formatNumber(costPerM2ActualUSD, 2)} / m²` : '-'}
                </td>
                <td className={`py-3.5 px-4 text-right font-mono ${costPerM2DiffUSD > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {totalM2 > 0 ? `${costPerM2DiffUSD > 0 ? '+' : ''}u$s ${formatNumber(costPerM2DiffUSD, 2)} / m²` : '-'}
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                  {totalM2 > 0 && costPerM2BudgetedUSD > 0 ? `${(costPerM2ActualUSD / costPerM2BudgetedUSD * 100).toFixed(1)}%` : '-'}
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-emerald-400">
                  {totalM2 > 0 ? `1 m²` : '-'}
                </td>
                <td colSpan={2} className="py-3.5 px-4 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${
                    costPerM2DiffUSD > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {costPerM2DiffUSD > 0 ? `+${costPerM2DiffPercent.toFixed(1)}% Desvío` : 'En Rango Meta'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
