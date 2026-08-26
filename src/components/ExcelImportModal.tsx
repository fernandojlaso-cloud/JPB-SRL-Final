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
  Layers
} from 'lucide-react';
import { Project, AccountCategory, Transaction } from '../types';
import { parseUploadedFile, downloadExcelTemplate, ParsedRowResult } from '../utils/excelHelper';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  categories: AccountCategory[];
  defaultProjectId: string;
  onImportSuccess: (importedTransactions: Transaction[]) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  projects,
  categories,
  defaultProjectId,
  onImportSuccess,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId === 'macro' ? projects[0]?.id || '' : defaultProjectId
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRowResult[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setFileName(file.name);
      const buffer = await file.arrayBuffer();
      const rows = parseUploadedFile(buffer, categories);
      setParsedRows(rows);
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

  const handleAutoRepairAll = () => {
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
    if (parsedRows.length === 0) return;

    const rowsToImport = importAllAnyway ? parsedRows : parsedRows.filter((r) => r.isValid);
    if (rowsToImport.length === 0) {
      alert('No hay filas válidas para importar. Puedes hacer clic en "Autocompletar Todo" para validar automáticamente.');
      return;
    }

    const newTransactions: Transaction[] = rowsToImport.map((row, idx) => {
      // Find matching category or create ID safely
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
  const invalidCount = parsedRows.length - validCount;
  const totalARS = parsedRows.reduce((acc, r) => acc + (r.amountARS || 0), 0);
  const totalUSD = parsedRows.reduce((acc, r) => acc + (r.amountUSD || 0), 0);

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
                Carga masiva de comprobantes, mano de obra, materiales y origen de fondos
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
          
          {/* Obra selector & Download template bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                Obra a la que se imputarán los registros:
              </label>
              <select
                id="import-project-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 font-medium focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    🏗️ {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={downloadExcelTemplate}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition self-start sm:self-end"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Descargar Plantilla Modelo Excel</span>
            </button>
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
                {fileName ? `Archivo cargado: ${fileName}` : 'Haz clic o arrastra tu archivo Excel / CSV aquí (.xlsx, .xls)'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Soporta archivos multimoneda, formatos clásicos .xls / .xlsx y pestañas de Origen / Mano de Obra
              </p>
            </div>
          </div>

          {/* Preview Table */}
          {parsedRows.length > 0 && (
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
                    Total $: {formatCurrency(totalARS, 'ARS')}
                  </span>
                  <span className="text-[11px] bg-slate-800 text-emerald-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                    Total u$s: {formatCurrency(totalUSD, 'USD')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAutoRepairAll}
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
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleConfirmImport(true)}
              disabled={parsedRows.length === 0}
              className={`px-5 py-2 font-bold text-xs rounded-lg transition shadow-md flex items-center gap-2 ${
                parsedRows.length > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirmar e Importar {parsedRows.length} Filas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
