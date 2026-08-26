import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileJson, 
  RefreshCw,
  Layers
} from 'lucide-react';
import { fetchAllDataForBackup, restoreCompleteBackup } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { isSuperAdmin, isDirector } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      setStatusMessage(null);

      const fullData = await fetchAllDataForBackup();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(fullData, null, 2))}`;
      
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `JPB_SRL_Backup_Completo_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setStatusMessage({
        type: 'success',
        text: `¡Copia de seguridad generada con éxito! (${fullData.projects.length} obras, ${fullData.transactions.length} comprobantes, ${fullData.categories.length} rubros).`,
      });
    } catch (err: any) {
      console.error('Error exporting backup:', err);
      setStatusMessage({
        type: 'error',
        text: 'Error al generar la copia de seguridad.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('⚠️ ATENCIÓN: La restauración sincronizará e insertará las obras, transacciones y presupuestos del respaldo. ¿Deseas continuar?')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsRestoring(true);
        setStatusMessage(null);
        const parsed = JSON.parse(event.target?.result as string);
        const result = await restoreCompleteBackup(parsed);
        setStatusMessage({
          type: 'success',
          text: `¡Restauración exitosa! Se actualizaron ${result.count} registros en la base de datos en la nube.`,
        });
      } catch (err: any) {
        console.error('Error restoring backup:', err);
        setStatusMessage({
          type: 'error',
          text: err.message || 'Error al restaurar el archivo de respaldo.',
        });
      } finally {
        setIsRestoring(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Copia de Seguridad y Restauración
              </h3>
              <p className="text-xs text-slate-400">
                Resguardo integral de obras, transacciones y rubros contables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Export Backup Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileJson className="h-4 w-4 text-emerald-400" />
                <span>Descargar Copia de Seguridad Diaria</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Genera un archivo JSON completo con todas las obras, movimientos, rubros y presupuestos.
              </p>
            </div>
          </div>

          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Generando Respaldo...' : 'Exportar Backup Completo (.JSON)'}</span>
          </button>
        </div>

        {/* Restore Backup Card (Superadmin only) */}
        {isSuperAdmin && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-amber-400" />
                  <span>Restaurar Copia de Seguridad</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sube un archivo de backup previamente generado para restablecer los datos en Firestore.
                </p>
              </div>
            </div>

            <label className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="h-4 w-4 text-amber-400" />
              <span>{isRestoring ? 'Restaurando...' : 'Seleccionar Archivo JSON de Respaldo'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileRestore}
                disabled={isRestoring}
                className="hidden"
              />
            </label>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
