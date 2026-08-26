import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  User, 
  Building2, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  FileSpreadsheet, 
  ShieldCheck, 
  Clock, 
  Database,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  Trash
} from 'lucide-react';
import { ActivityLog, UserRole } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { clearAllActivityLogs } from '../services/firestoreService';

interface ActivityLogTabProps {
  logs: ActivityLog[];
  onRefresh?: () => void;
}

export const ActivityLogTab: React.FC<ActivityLogTabProps> = ({ logs, onRefresh }) => {
  const { isSuperAdmin, isDirector } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [isClearing, setIsClearing] = useState(false);

  // Unique users from logs
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, { email: string; name: string }>();
    logs.forEach(l => {
      if (l.userEmail) {
        map.set(l.userEmail, { email: l.userEmail, name: l.userName || l.userEmail });
      }
    });
    return Array.from(map.values());
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const now = new Date();
    return logs.filter((log) => {
      // Entity match
      if (selectedEntity !== 'all' && log.entity !== selectedEntity) return false;

      // Action match
      if (selectedAction !== 'all' && log.action !== selectedAction) return false;

      // User match
      if (selectedUser !== 'all' && log.userEmail !== selectedUser) return false;

      // Period match
      if (selectedPeriod !== 'all') {
        const logDate = new Date(log.timestamp);
        if (selectedPeriod === 'today') {
          if (logDate.toDateString() !== now.toDateString()) return false;
        } else if (selectedPeriod === '7d') {
          const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (selectedPeriod === '30d') {
          const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        }
      }

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches = 
          (log.details && log.details.toLowerCase().includes(q)) ||
          (log.entityName && log.entityName.toLowerCase().includes(q)) ||
          (log.projectName && log.projectName.toLowerCase().includes(q)) ||
          (log.userName && log.userName.toLowerCase().includes(q)) ||
          (log.userEmail && log.userEmail.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [logs, selectedEntity, selectedAction, selectedUser, selectedPeriod, searchTerm]);

  // Metric stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayCount = logs.filter(l => new Date(l.timestamp).toDateString() === today).length;
    const creates = logs.filter(l => l.action === 'create' || l.action === 'import').length;
    const updates = logs.filter(l => l.action === 'update').length;
    const deletes = logs.filter(l => l.action === 'delete').length;
    return { todayCount, creates, updates, deletes };
  }, [logs]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Fecha y Hora', 'Usuario', 'Email', 'Rol', 'Acción', 'Entidad', 'Obra', 'Detalle', 'Monto ARS', 'Monto USD'];
    const rows = filteredLogs.map(l => [
      new Date(l.timestamp).toLocaleString('es-AR'),
      `"${(l.userName || '').replace(/"/g, '""')}"`,
      `"${(l.userEmail || '').replace(/"/g, '""')}"`,
      l.userRole,
      l.action,
      l.entity,
      `"${(l.projectName || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.amountARS || '',
      l.amountUSD || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_actividad_simetris_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = async () => {
    if (!window.confirm('¿Está seguro de que desea vaciar todo el registro histórico de actividad? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      setIsClearing(true);
      await clearAllActivityLogs();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Error al limpiar registros: ' + (err.message || 'Desconocido'));
    } finally {
      setIsClearing(false);
    }
  };

  const getActionBadge = (action: ActivityLog['action']) => {
    switch (action) {
      case 'create':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
            <PlusCircle className="h-3 w-3" /> Creación
          </span>
        );
      case 'update':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md">
            <Edit3 className="h-3 w-3" /> Modificación
          </span>
        );
      case 'delete':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded-md">
            <Trash2 className="h-3 w-3" /> Eliminación
          </span>
        );
      case 'import':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-md">
            <FileSpreadsheet className="h-3 w-3" /> Importación Excel
          </span>
        );
      case 'backup_export':
      case 'backup_restore':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded-md">
            <Database className="h-3 w-3" /> Backup
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md">
            <Activity className="h-3 w-3" /> {action}
          </span>
        );
    }
  };

  const getEntityBadge = (entity: ActivityLog['entity']) => {
    switch (entity) {
      case 'obra':
        return <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">OBRA</span>;
      case 'egreso':
        return <span className="text-xs bg-rose-950/50 text-rose-300 border border-rose-900/40 px-2 py-0.5 rounded font-mono">EGRESO</span>;
      case 'ingreso':
        return <span className="text-xs bg-emerald-950/50 text-emerald-300 border border-emerald-900/40 px-2 py-0.5 rounded font-mono">INGRESO</span>;
      case 'rubro':
        return <span className="text-xs bg-amber-950/50 text-amber-300 border border-amber-900/40 px-2 py-0.5 rounded font-mono">RUBRO</span>;
      case 'presupuesto':
        return <span className="text-xs bg-blue-950/50 text-blue-300 border border-blue-900/40 px-2 py-0.5 rounded font-mono">PRESUPUESTO</span>;
      case 'usuario':
        return <span className="text-xs bg-purple-950/50 text-purple-300 border border-purple-900/40 px-2 py-0.5 rounded font-mono">USUARIO</span>;
      default:
        return <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">SISTEMA</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">Registro de Actividad & Auditoría</h2>
              <span className="bg-amber-950/80 text-amber-300 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-amber-700/60">
                Solo Dirección
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Historial cronológico de creaciones, modificaciones, importaciones y eliminaciones realizadas por los usuarios.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg transition flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar CSV
          </button>

          {isSuperAdmin && (
            <button
              onClick={handleClearLogs}
              disabled={isClearing || logs.length === 0}
              className="px-3 py-1.5 bg-rose-900/40 hover:bg-rose-900/70 border border-rose-800/60 text-rose-300 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
              title="Vaciar historial de logs (Superadmin)"
            >
              <Trash className="h-3.5 w-3.5" />
              Vaciar Historial
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Total Registros</span>
          <div className="text-xl font-bold text-slate-100">{logs.length}</div>
          <span className="text-[10px] text-slate-500">Histórico acumulado</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] uppercase font-bold text-emerald-400 block mb-1">Actividad Hoy</span>
          <div className="text-xl font-bold text-emerald-400">{stats.todayCount}</div>
          <span className="text-[10px] text-slate-500">Eventos registrados hoy</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] uppercase font-bold text-amber-400 block mb-1">Modificaciones</span>
          <div className="text-xl font-bold text-amber-400">{stats.updates}</div>
          <span className="text-[10px] text-slate-500">Ediciones de asientos/rubros</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] uppercase font-bold text-rose-400 block mb-1">Eliminaciones</span>
          <div className="text-xl font-bold text-rose-400">{stats.deletes}</div>
          <span className="text-[10px] text-slate-500">Bajas de registros</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por detalle, usuario, obra o rubro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
            />
          </div>

          {/* Period Filter */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="all">📅 Cualquier Período</option>
            <option value="today">Hoy</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
          </select>

          {/* Entity Filter */}
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="all">🏷️ Todas las Entidades</option>
            <option value="egreso">Egresos</option>
            <option value="ingreso">Ingresos</option>
            <option value="obra">Obras</option>
            <option value="rubro">Plan de Cuentas / Rubros</option>
            <option value="presupuesto">Presupuestos</option>
            <option value="usuario">Usuarios & Permisos</option>
            <option value="sistema">Sistema / Backups</option>
          </select>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="all">⚡ Todas las Acciones</option>
            <option value="create">Creaciones</option>
            <option value="update">Modificaciones / Ediciones</option>
            <option value="delete">Eliminaciones</option>
            <option value="import">Importaciones Excel</option>
            <option value="backup_export">Exportación Backup</option>
            <option value="backup_restore">Restauración Backup</option>
          </select>

          {/* User Filter */}
          {uniqueUsers.length > 0 && (
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">👤 Todos los Usuarios</option>
              {uniqueUsers.map(u => (
                <option key={u.email} value={u.email}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Active results counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
          <span>Mostrando <strong className="text-slate-200">{filteredLogs.length}</strong> de {logs.length} eventos</span>
          {(selectedEntity !== 'all' || selectedAction !== 'all' || selectedUser !== 'all' || selectedPeriod !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedEntity('all');
                setSelectedAction('all');
                setSelectedUser('all');
                setSelectedPeriod('all');
                setSearchTerm('');
              }}
              className="text-amber-400 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4 whitespace-nowrap">Fecha & Hora</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Usuario</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Acción</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Entidad</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Obra</th>
                <th className="py-3.5 px-4">Detalle de la Operación</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="font-semibold text-slate-400">No se encontraron eventos de actividad</p>
                    <p className="text-xs text-slate-500 mt-1">Los registros se generarán automáticamente a medida que los usuarios operen en la plataforma.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const formattedDate = dateObj.toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });
                  const formattedTime = dateObj.toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/50 transition">
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-medium text-slate-200">{formattedDate}</div>
                        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formattedTime} hs
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-amber-400">
                            {(log.userName || log.userEmail || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200 truncate max-w-[150px]">
                              {log.userName || log.userEmail}
                            </div>
                            <div className="text-[10px] text-slate-400 capitalize">{log.userRole}</div>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Entity */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {getEntityBadge(log.entity)}
                      </td>

                      {/* Project */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-medium">
                        {log.projectName ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 text-amber-400 shrink-0" />
                            <span className="truncate max-w-[160px]">{log.projectName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 text-slate-300">
                        <div className="font-medium text-slate-200">
                          {log.entityName && <strong className="text-amber-300 mr-1.5">{log.entityName}:</strong>}
                          <span>{log.details}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                        {log.amountARS ? (
                          <div className="text-amber-400 font-bold">
                            {formatCurrency(log.amountARS, 'ARS')}
                          </div>
                        ) : null}
                        {log.amountUSD ? (
                          <div className="text-emerald-400 text-[11px] font-medium">
                            {formatCurrency(log.amountUSD, 'USD')}
                          </div>
                        ) : null}
                        {!log.amountARS && !log.amountUSD && (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
