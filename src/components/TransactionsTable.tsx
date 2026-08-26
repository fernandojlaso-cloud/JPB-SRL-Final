import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Edit3, 
  Trash2, 
  ArrowUpDown, 
  Tag,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock
} from 'lucide-react';
import { Transaction, Project, AccountCategory, Currency } from '../types';
import { formatCurrency, formatDate, formatNumber } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';

interface TransactionsTableProps {
  transactions: Transaction[];
  projects: Project[];
  categories: AccountCategory[];
  currency: Currency;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  title?: string;
  typeFilter?: 'ingreso' | 'egreso' | 'all';
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  projects,
  categories,
  currency,
  onEdit,
  onDelete,
  title,
  typeFilter = 'all',
}) => {
  const { canEditTransactions, canDeleteTransactions } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'amountARS' | 'amountUSD'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type match
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // Category match
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) return false;

      // Month match (YYYY-MM)
      if (selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) return false;

      // Search match
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const cat = categories.find((c) => c.id === tx.categoryId);
        const proj = projects.find((p) => p.id === tx.projectId);
        const matchConcept = tx.concept.toLowerCase().includes(term);
        const matchPayer = (tx.payerOrRecipient || '').toLowerCase().includes(term);
        const matchCat = (cat?.name || '').toLowerCase().includes(term);
        const matchProj = (proj?.name || '').toLowerCase().includes(term);
        const matchNotes = (tx.notes || '').toLowerCase().includes(term);

        if (!matchConcept && !matchPayer && !matchCat && !matchProj && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, typeFilter, selectedCategory, selectedMonth, searchTerm, categories, projects]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amountARS') {
        comparison = a.amountARS - b.amountARS;
      } else if (sortField === 'amountUSD') {
        comparison = a.amountUSD - b.amountUSD;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredTransactions, sortField, sortOrder]);

  // Calculate Running Cumulative Total ($ and USD)
  const transactionsWithAccumulated = useMemo(() => {
    let runningARS = 0;
    let runningUSD = 0;
    return sortedTransactions.map((tx) => {
      runningARS += tx.amountARS;
      runningUSD += tx.amountUSD;
      return {
        ...tx,
        accumulatedARS: runningARS,
        accumulatedUSD: runningUSD,
      };
    });
  }, [sortedTransactions]);

  // Unique months available for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        months.add(tx.date.substring(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const toggleSort = (field: 'date' | 'amountARS' | 'amountUSD') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const totalFilteredARS = filteredTransactions.reduce((acc, t) => acc + t.amountARS, 0);
  const totalFilteredUSD = filteredTransactions.reduce((acc, t) => acc + t.amountUSD, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Table Header Controls */}
      <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {title && (
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-100 text-sm">{title}</h4>
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full border border-slate-700 font-medium">
              {filteredTransactions.length} registros
            </span>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 md:justify-end">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por concepto, proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
            />
          </div>

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="all">📅 Todos los Meses</option>
            {availableMonths.map((m) => {
              const [y, mo] = m.split('-');
              const dateObj = new Date(parseInt(y), parseInt(mo) - 1, 1);
              const monthName = dateObj.toLocaleString('es-AR', { month: 'short', year: 'numeric' });
              return (
                <option key={m} value={m}>
                  {monthName.toUpperCase()}
                </option>
              );
            })}
          </select>

          {/* Category Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer max-w-[180px] truncate"
          >
            <option value="all">🏷️ Todos los Rubros</option>
            {categories
              .filter((c) => (typeFilter === 'all' ? true : c.type === typeFilter))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-slate-200 select-none whitespace-nowrap"
                onClick={() => toggleSort('date')}
              >
                <div className="flex items-center gap-1">
                  <span>FECHA</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4 whitespace-nowrap">RUBRO / CUENTA</th>
              <th className="py-3 px-4 min-w-[220px]">CONCEPTO / DETALLE</th>
              <th 
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-200 select-none whitespace-nowrap"
                onClick={() => toggleSort('amountARS')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>MONTO $ (ARS)</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-3 text-center whitespace-nowrap">t.c.</th>
              <th 
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-200 select-none whitespace-nowrap text-emerald-400"
                onClick={() => toggleSort('amountUSD')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>MONTO u$s (USD)</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-right whitespace-nowrap text-slate-400">
                ACUMULADO ($)
              </th>
              <th className="py-3 px-4 whitespace-nowrap">PROVEEDOR / CLIENTE</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">ESTADO</th>
              <th className="py-3 px-3 text-right whitespace-nowrap">ACCIONES</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-normal">
            {transactionsWithAccumulated.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500">
                  <p className="text-sm">No se encontraron movimientos con los filtros seleccionados.</p>
                  <p className="text-xs mt-1">Prueba modificando la búsqueda o el rango de fechas.</p>
                </td>
              </tr>
            ) : (
              transactionsWithAccumulated.map((tx) => {
                const category = categories.find((c) => c.id === tx.categoryId);
                const project = projects.find((p) => p.id === tx.projectId);
                const isCardOrImportant = tx.concept.toLowerCase().includes('tarjeta') || tx.concept.toLowerCase().includes('saldo');

                return (
                  <tr 
                    key={tx.id} 
                    className={`hover:bg-slate-800/40 transition group ${
                      isCardOrImportant ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    {/* Fecha */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300 font-medium">
                      {formatDate(tx.date)}
                    </td>

                    {/* Rubro badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span 
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${category?.color || '#64748b'}20`,
                          color: category?.color || '#cbd5e1',
                          border: `1px solid ${category?.color || '#64748b'}40`,
                        }}
                      >
                        <span 
                          className="h-1.5 w-1.5 rounded-full" 
                          style={{ backgroundColor: category?.color || '#64748b' }}
                        />
                        {category?.name || 'General'}
                      </span>
                    </td>

                    {/* Concepto */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">
                        {tx.concept}
                      </div>
                      {project && (
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span>Obra: {project.name}</span>
                          {tx.notes && <span className="text-slate-400">• {tx.notes}</span>}
                        </div>
                      )}
                    </td>

                    {/* Monto ARS */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                      {formatCurrency(tx.amountARS, 'ARS')}
                    </td>

                    {/* Tipo de Cambio */}
                    <td className="py-3 px-3 text-center font-mono text-amber-300/90 whitespace-nowrap bg-slate-950/30">
                      {formatNumber(tx.exchangeRate, 2)}
                    </td>

                    {/* Monto USD */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap bg-emerald-950/10">
                      {formatCurrency(tx.amountUSD, 'USD')}
                    </td>

                    {/* Acumulado */}
                    <td className="py-3 px-4 text-right font-mono text-slate-400 whitespace-nowrap">
                      {currency === 'ARS' 
                        ? formatCurrency(tx.accumulatedARS, 'ARS') 
                        : formatCurrency(tx.accumulatedUSD, 'USD')}
                    </td>

                    {/* Proveedor / Pagador */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[140px]">{tx.payerOrRecipient || '-'}</span>
                      </div>
                      {tx.paymentMethod && (
                        <span className="text-[10px] text-slate-400 block">{tx.paymentMethod}</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {tx.status === 'pagado' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          <CheckCircle2 className="h-3 w-3" />
                          Pagado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400 text-[10px] font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                          <Clock className="h-3 w-3" />
                          Pendiente
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {canEditTransactions || canDeleteTransactions ? (
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition">
                          {canEditTransactions && (
                            <button
                              onClick={() => onEdit(tx)}
                              title="Corregir / Editar asiento (Director / Administrativo)"
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDeleteTransactions && (
                            <button
                              onClick={() => onDelete(tx.id)}
                              title="Borrar asiento (Director)"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end pr-2 text-slate-600" title="Solo Director y Administrativo pueden modificar asientos">
                          <Lock className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer Totals */}
          {filteredTransactions.length > 0 && (
            <tfoot className="bg-slate-950 font-bold text-slate-200 border-t-2 border-slate-800">
              <tr>
                <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider text-xs text-slate-400">
                  TOTAL FILTRADO:
                </td>
                <td className="py-3 px-4 text-right font-mono text-amber-400 text-sm whitespace-nowrap">
                  {formatCurrency(totalFilteredARS, 'ARS')}
                </td>
                <td className="py-3 px-3 text-center text-slate-500">-</td>
                <td className="py-3 px-4 text-right font-mono text-emerald-400 text-sm whitespace-nowrap">
                  {formatCurrency(totalFilteredUSD, 'USD')}
                </td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
