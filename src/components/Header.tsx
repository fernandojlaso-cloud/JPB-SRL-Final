import React from 'react';
import { 
  Building2, 
  DollarSign, 
  ArrowRightLeft, 
  UploadCloud, 
  Download, 
  Plus, 
  Layers, 
  MapPin, 
  User, 
  TrendingUp,
  AlertCircle,
  Cloud,
  CheckCircle2,
  BookOpen,
  Database,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { Project, Currency } from '../types';
import { formatCurrency } from '../utils/formatters';
import { JpbSrlLogo } from './JpbSrlLogo';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  projects: Project[];
  selectedProjectId: string; // 'macro' or project.id
  onSelectProject: (id: string) => void;
  currency: Currency;
  onToggleCurrency: (c: Currency) => void;
  onOpenConverter: () => void;
  onOpenImport: () => void;
  onExportExcel: () => void;
  onNewProject: () => void;
  onOpenManual?: () => void;
  onOpenBackup?: () => void;
  totalIncomeARS: number;
  totalIncomeUSD: number;
  totalExpenseARS: number;
  totalExpenseUSD: number;
  isCloudSynced?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  currency,
  onToggleCurrency,
  onOpenConverter,
  onOpenImport,
  onExportExcel,
  onNewProject,
  onOpenManual,
  onOpenBackup,
  totalIncomeARS,
  totalIncomeUSD,
  totalExpenseARS,
  totalExpenseUSD,
  isCloudSynced = true,
}) => {
  const { userProfile, currentUser, logout, canManageObras, canBackup, isComitente } = useAuth();
  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const isMacro = selectedProjectId === 'macro';

  const income = currency === 'ARS' ? totalIncomeARS : totalIncomeUSD;
  const expense = currency === 'ARS' ? totalExpenseARS : totalExpenseUSD;
  const balance = income - expense;
  const balancePercent = income > 0 ? (expense / income) * 100 : 0;

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar: Brand & Action Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-4 border-b border-slate-800/80">
          
          {/* Logo & Title JPB SRL */}
          <div className="flex items-center gap-3">
            <JpbSrlLogo variant="full" />
            <div className="hidden xl:block h-7 w-px bg-slate-800 ml-1" />
            <div className="hidden xl:block">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                  Control Financiero de Obras
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Firebase Cloud Activo
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Origen & Aplicación de Fondos Bimonetario
              </span>
            </div>
          </div>

          {/* Center/Right Controls: Obra Selector, Currency Toggle, Excel Tools & User */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Obra Selector Dropdown */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <select
                id="project-selector"
                value={selectedProjectId}
                onChange={(e) => onSelectProject(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-100 py-1.5 px-2.5 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer max-w-[220px] truncate"
              >
                {!isComitente && (
                  <option value="macro" className="bg-slate-800 text-amber-300 font-semibold">
                    🌐 Visión Macro (Todas las Obras)
                  </option>
                )}
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-800 text-slate-100">
                    🏗️ {p.name}
                  </option>
                ))}
              </select>

              {canManageObras && (
                <button
                  id="add-project-btn"
                  onClick={onNewProject}
                  title="Crear Nueva Obra"
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 rounded transition"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Currency Selector (ARS / USD) */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                id="currency-ars-btn"
                onClick={() => onToggleCurrency('ARS')}
                className={`px-3 py-1 text-xs font-bold rounded transition ${
                  currency === 'ARS'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                $ ARS
              </button>
              <button
                id="currency-usd-btn"
                onClick={() => onToggleCurrency('USD')}
                className={`px-3 py-1 text-xs font-bold rounded transition ${
                  currency === 'USD'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                u$s USD
              </button>
            </div>

            {/* Quick Currency Converter Button */}
            <button
              id="converter-modal-btn"
              onClick={onOpenConverter}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
              title="Calculadora y Conversor de Tipo de Cambio"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Conversor</span>
            </button>

            {/* Manual de Usuario */}
            {onOpenManual && (
              <button
                id="open-manual-btn"
                onClick={onOpenManual}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-600/40 rounded-lg transition shadow-sm"
                title="Ver Manual de Usuario"
              >
                <BookOpen className="h-3.5 w-3.5 text-rose-400" />
                <span className="hidden sm:inline">Manual</span>
              </button>
            )}

            {/* Backup Button (Superadmin & Director) */}
            {canBackup && onOpenBackup && (
              <button
                id="backup-btn"
                onClick={onOpenBackup}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg transition shadow-sm"
                title="Copia de Seguridad y Restauración de Base de Datos"
              >
                <Database className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Backup</span>
              </button>
            )}

            {/* Excel Import & Export */}
            <div className="flex items-center gap-1">
              {!isComitente && (
                <button
                  id="import-excel-header-btn"
                  onClick={onOpenImport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg transition"
                  title="Importar datos desde Excel (.xlsx/.csv)"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Importar</span>
                </button>
              )}

              <button
                id="export-excel-header-btn"
                onClick={onExportExcel}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
                title="Exportar a Excel (.xlsx)"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* User Profile Badge & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200 truncate max-w-[130px]">
                  {userProfile?.displayName || currentUser?.email?.split('@')[0]}
                </span>
                <span className="text-[10px] font-semibold text-amber-400 capitalize">
                  {userProfile?.role === 'superadmin' ? 'Super Admin' : userProfile?.role}
                </span>
              </div>

              <button
                onClick={() => logout()}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                title="Cerrar Sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Banner: Selected Obra Details & Quick High-Level Metric Strip */}
        <div className="py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          {/* Obra Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-slate-300">
            {isMacro ? (
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Layers className="h-4 w-4" />
                <span>Panel Consolidado: {projects.length} Obras en Seguimiento</span>
              </div>
            ) : (
              currentProject && (
                <>
                  <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
                    <JpbSrlLogo variant="compact" />
                    <span>{currentProject.name}</span>
                    <span className="text-slate-500 text-xs">({currentProject.code})</span>
                  </div>
                  {currentProject.address && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      <span>{currentProject.address}</span>
                    </div>
                  )}
                  {currentProject.client && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <span>Cliente: {currentProject.client}</span>
                    </div>
                  )}
                </>
              )
            )}
          </div>

          {/* Quick Financial Snapshot */}
          <div className="flex items-center gap-4 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Ingresos:</span>
              <span className="font-bold text-emerald-400">{formatCurrency(income, currency)}</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Egresos:</span>
              <span className="font-bold text-rose-400">{formatCurrency(expense, currency)}</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Saldo Disp.:</span>
              <span className={`font-bold ${balance >= 0 ? 'text-amber-400' : 'text-rose-500'}`}>
                {formatCurrency(balance, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
