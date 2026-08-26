import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  Layers,
  PieChart,
  DollarSign
} from 'lucide-react';
import { Project, AccountCategory, Transaction, BudgetEstimate } from '../types';
import { 
  parseUploadedFile, 
  downloadExcelTemplate, 
  ParsedRowResult,
  parseBudgetUploadedFile,
  downloadBudgetExcelTemplate,
  ParsedBudgetRowResult
} from '../utils/excelHelper';
import { formatCurrency, formatDate } from '../utils/formatters';

export type ImportMode = 'transacciones' | 'presupuesto';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  categories: AccountCategory[];
  defaultProjectId: string;
  onImportSuccess: (importedTransactions: Transaction[]) => void;
  onImportBudgets?: (importedBudgets: BudgetEstimate[], projectId: string) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  projects,
  categories,
  defaultProjectId,
  onImportSuccess,
  onImportBudgets,
}) => {
  const [importMode, setImportMode] = useState<ImportMode>('transacciones');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId === 'macro' ? projects[0]?.id || '' : defaultProjectId
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRowResult[]>([]);
  const [parsedBudgetRows, setParsedBudgetRows] = useState<ParsedBudgetRowResult[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setFileName(file.name);
      const buffer = await file.arrayBuffer();

      if (importMode === 'presupuesto') {
        const budgetRows = parseBudgetUploadedFile(buffer, categories);
        if (budgetRows.length === 0) {
          alert('No se detectaron rubros o montos presupuestarios en el archivo. Verifica el formato de columnas.');
        }
        setParsedBudgetRows(budgetRows);
      } else {
        const rows = parseUploadedFile(buffer, categories);
        if (rows.length === 0) {
          alert('No se detectaron movimientos válidos en el archivo. Verifica el formato.');
        }
        setParsedRows(rows);
      }
    } catch (err: any) {
      alert('Error al leer el archivo Excel: ' + (err?.message || 'Formato no soportado'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleModeChange = (newMode: ImportMode) => {
    setImportMode(newMode);
    setParsedRows([]);
    setParsedBudgetRows([]);
    setFileName('');
  };

  const handleAutoRepairAllTransactions = () => {
    setParsedRows((prev) => {
      return prev.map((row) => {
        let ars = row.amountARS;
        let usd = row.amountUSD;
        let tc = row.exchangeRate > 0 ? row.exchangeRate : 1;

        if (ars <= 0 && usd <= 0) {
          ars = 1;
          usd = 1;
        } else if (ars > 0 && usd <= 0) {
          usd = tc > 1 ? Math.round((ars / tc) * 100) / 100 : ars;
        } else if (usd > 0 && ars <= 0) {
          ars = tc > 1 ? Math.round(usd * tc * 100) / 100 : usd;
        }

        return {
          ...row,
          amountARS: ars,
          amountUSD: usd,
          exchangeRate: tc,
          isValid: true,
          errors: [],
        };
      });
    });
  };

  const handleConfirmImport = (importAllAnyway = false) => {
    if (importMode === 'presupuesto') {
      if (parsedBudgetRows.length === 0) return;

      const newBudgets: BudgetEstimate[] = parsedBudgetRows.map((bRow, idx) => {
        let matchedCat = categories.find((c) => c.id === bRow.matchedCategoryId);
        if (!matchedCat) {
          const rowName = (bRow.categoryName || '').toLowerCase().trim();
          matchedCat = categories.find((c) => {
            const cName = (c.name || '').toLowerCase().trim();
            return cName.includes(rowName) || rowName.includes(cName);
          });
        }

        const categoryId = matchedCat ? matchedCat.id : (bRow.matchedCategoryId || `cat-${idx + 1}`);

        return {
          id: `bud-${selectedProjectId}-${categoryId}`,
          projectId: selectedProjectId,
          categoryId: categoryId,
          budgetedARS: bRow.budgetedARS || 0,
          budgetedUSD: bRow.budgetedUSD || 0,
          notes: bRow.notes || `Presupuesto importado: ${bRow.categoryName}`,
        };
      });

      if (onImportBudgets) {
        onImportBudgets(newBudgets, selectedProjectId);
      } else {
        alert('Se importaron los rubros presupuestarios.');
      }
      onClose();
      return;
    }

    // Transactions mode
    if (parsedRows.length === 0) return;

    const rowsToImport = importAllAnyway ? parsedRows : parsedRows.filter((r) => r.isValid);
    if (rowsToImport.length === 0) {
      alert('No hay filas válidas para importar. Puedes hacer clic en "Autocompletar Todo" para validar automáticamente.');
      return;
    }

    const newTransactions: Transaction[] = rowsToImport.map((row, idx) => {
      const rowCatName = (row.categoryName || '').toLowerCase().trim();
      let matchedCategory = categories.find((c) => {
        if (c.type !== row.type) return false;
        const cName = (c.name || '').toLowerCase().trim();
        if (!rowCatName || !cName) return false;
        return cName.includes(rowCatName) || rowCatName.includes(cName);
      });

      if (!matchedCategory) {
        matchedCategory = categories.find((c) => c.type === row.type);
      }

      const safeARS = row.amountARS > 0 ? row.amountARS : (row.amountUSD > 0 ? row.amountUSD * (row.exchangeRate || 1) : 0);
      const safeUSD = row.amountUSD > 0 ? row.amountUSD : (row.amountARS > 0 && row.exchangeRate > 0 ? row.amountARS / row.exchangeRate : safeARS);

      return {
        id: `tx-import-${Date.now()}-${idx}`,
        projectId: selectedProjectId,
        type: row.type,
        categoryId: matchedCategory ? matchedCategory.id : row.type === 'ingreso' ? 'cat-in-1' : 'cat-mo',
        date: row.date || new Date().toISOString().split('T')[0],
        concept: row.concept || 'Movimiento importado',
        amountARS: safeARS,
        amountUSD: safeUSD,
        exchangeRate: row.exchangeRate || 1,
        payerOrRecipient: row.payerOrRecipient || '',
        paymentMethod: row.paymentMethod || 'Transferencia',
        status: 'pagado',
        notes: `Importado desde ${fileName || 'Excel'}`,
      };
    });

    onImportSuccess(newTransactions);
    onClose();
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const totalTxARS = parsedRows.reduce((acc, r) => acc + (r.amountARS || 0), 0);
  const totalTxUSD = parsedRows.reduce((acc, r) => acc + (r.amountUSD || 0), 0);

  const totalBudARS = parsedBudgetRows.reduce((acc, r) => acc + (r.budgetedARS || 0), 0);
  const totalBudUSD = parsedBudgetRows.reduce((acc, r) => acc + (r.budgetedUSD || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Importador Inteligente de Excel (.xlsx / .xls / .csv)</h3>
              <p className="text-xs text-slate-400">
                Selecciona si deseas cargar el presupuesto de la obra o los movimientos de ingresos y egresos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* DESPLEGABLE / SELECTOR DE TIPO DE IMPORTACION */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">
                Tipo de Carga / Datos a Importar:
              </label>
              <select
                id="excel-import-mode-select"
                value={importMode}
                onChange={(e) => handleModeChange(e.target.value as ImportMode)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-400 cursor-pointer shadow-sm"
              >
                <option value="transacciones">💳 Ingresos y Egresos (Comprobantes / Movimientos Históricos)</option>
                <option value="presupuesto">📊 Presupuesto de Obra (Rubros, Contratistas y Montos Presupuestados)</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Obra de Destino:
              </label>
              <select
                id="import-project-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    🏗️ {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="self-end pt-1">
              <button
                type="button"
                onClick={importMode === 'presupuesto' ? downloadBudgetExcelTemplate : downloadExcelTemplate}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition whitespace-nowrap"
              >
                <Download className="h-4 w-4 text-emerald-400" />
                <span>Descargar Plantilla {importMode === 'presupuesto' ? 'Presupuesto' : 'Ingresos/Egresos'}</span>
              </button>
            </div>
          </div>

          {/* Contextual notice */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5">
            {importMode === 'presupuesto' ? (
              <>
                <PieChart className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Modo Presupuesto:</strong> Importa los rubros, contratistas y montos presupuestados en Pesos ($) y Dólares (u$s) para la obra seleccionada.
                </span>
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Modo Ingresos/Egresos:</strong> Importa las transacciones con fecha, concepto, montos bimonetarios ($/u$s) y tipo de cambio aplicado.
                </span>
              </>
            )}
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-emerald-500 bg-emerald-950/20'
                : 'border-slate-700 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="p-4 rounded-full bg-slate-800 text-emerald-400">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">
                {fileName 
                  ? `Archivo cargado: ${fileName}` 
                  : `Haz clic o arrastra tu archivo Excel de ${importMode === 'presupuesto' ? 'Presupuesto' : 'Ingresos/Egresos'} (.xlsx, .xls, .csv)`}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {importMode === 'presupuesto' 
                  ? 'Reconoce columnas de Rubro/Contratista, Código, Presupuesto Pesos ($), Presupuesto Dólares (u$s) y Notas'
                  : 'Soporta archivos multimoneda, formatos clásicos .xls / .xlsx y pestañas de Origen / Mano de Obra'}
              </p>
            </div>
          </div>

          {/* PREVIEW: BUDGET MODE */}
          {importMode === 'presupuesto' && parsedBudgetRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-slate-100">
                    Rubros Presupuestarios Detectados ({parsedBudgetRows.length} ítems)
                  </h4>
                  <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                    Total Presupuesto $: {formatCurrency(totalBudARS, 'ARS')}
                  </span>
                  <span className="text-[11px] bg-slate-800 text-emerald-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                    Total Presupuesto u$s: {formatCurrency(totalBudUSD, 'USD')}
                  </span>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Rubro / Contratista</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3 text-right">Presupuesto $</th>
                      <th className="py-2.5 px-3 text-right text-emerald-400">Presupuesto u$s</th>
                      <th className="py-2.5 px-3">Notas / Alcance</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-normal">
                    {parsedBudgetRows.map((b, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 whitespace-nowrap font-mono font-bold text-amber-400">{b.code}</td>
                        <td className="py-2 px-3 whitespace-nowrap font-semibold text-slate-200">{b.categoryName}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            b.type === 'ingreso' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                          }`}>
                            {b.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">{formatCurrency(b.budgetedARS, 'ARS')}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(b.budgetedUSD, 'USD')}</td>
                        <td className="py-2 px-3 max-w-[200px] truncate text-slate-400">{b.notes || '-'}</td>
                        <td className="py-2 px-3 text-center">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 inline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PREVIEW: TRANSACTIONS MODE */}
          {importMode === 'transacciones' && parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-slate-100">
                    Previsualización de Filas ({parsedRows.length} detectadas)
                  </h4>
                  <span className="text-[11px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-medium">
                    {validCount} listas para importar
                  </span>
                  <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                    Total $: {formatCurrency(totalTxARS, 'ARS')}
                  </span>
                  <span className="text-[11px] bg-slate-800 text-emerald-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                    Total u$s: {formatCurrency(totalTxUSD, 'USD')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoRepairAllTransactions}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg transition"
                    title="Recalcular montos y validar todas las filas"
                  >
                    <span>⚡ Recalcular y Validar Todo ({parsedRows.length})</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Rubro / Cuenta</th>
                      <th className="py-2.5 px-3">Concepto</th>
                      <th className="py-2.5 px-3 text-right">Monto $</th>
                      <th className="py-2.5 px-2 text-center">t.c.</th>
                      <th className="py-2.5 px-3 text-right text-emerald-400">Monto u$s</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-normal">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className={`hover:bg-slate-800/30 ${!r.isValid ? 'bg-amber-950/20' : ''}`}>
                        <td className="py-2 px-3 whitespace-nowrap font-mono">{formatDate(r.date)}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            r.type === 'ingreso' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                          }`}>
                            {r.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-slate-300">{r.categoryName}</td>
                        <td className="py-2 px-3 max-w-[240px] truncate text-slate-200">{r.concept}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">{formatCurrency(r.amountARS, 'ARS')}</td>
                        <td className="py-2 px-2 text-center font-mono text-amber-300">{r.exchangeRate.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(r.amountUSD, 'USD')}</td>
                        <td className="py-2 px-3 text-center">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 inline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleConfirmImport(true)}
              disabled={importMode === 'presupuesto' ? parsedBudgetRows.length === 0 : parsedRows.length === 0}
              className={`px-5 py-2 font-bold text-xs rounded-lg transition shadow-md flex items-center gap-2 ${
                (importMode === 'presupuesto' ? parsedBudgetRows.length > 0 : parsedRows.length > 0)
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {importMode === 'presupuesto'
                  ? `Confirmar e Importar ${parsedBudgetRows.length} Rubros de Presupuesto`
                  : `Confirmar e Importar ${parsedRows.length} Movimientos`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
