import React, { useState } from 'react';
import { 
  FolderTree, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Building2, 
  Sliders, 
  Tag, 
  DollarSign, 
  Save, 
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  ListPlus,
  Sparkles,
  AlertTriangle,
  CheckSquare,
  Square,
  FileText,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { AccountCategory, Project, TransactionType } from '../types';
import { formatCurrency } from '../utils/formatters';
import { STANDARD_CONSTRUCTION_CATEGORIES } from '../data/initialData';
import { useAuth } from '../contexts/AuthContext';

interface AccountsAdminTabProps {
  categories: AccountCategory[];
  projects: Project[];
  onAddCategory: (cat: Omit<AccountCategory, 'id'>) => void;
  onAddBatchCategories?: (cats: Omit<AccountCategory, 'id'>[]) => void;
  onUpdateCategory: (id: string, cat: Partial<AccountCategory>) => void;
  onDeleteCategory: (id: string) => void;
  onAddProject: (proj: Omit<Project, 'id'>) => void;
  onUpdateProject: (id: string, proj: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onOpenProjectModal: (projectToEdit?: Project) => void;
}

export const AccountsAdminTab: React.FC<AccountsAdminTabProps> = ({
  categories,
  projects,
  onAddCategory,
  onAddBatchCategories,
  onUpdateCategory,
  onDeleteCategory,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onOpenProjectModal,
}) => {
  const { canManageObras, isSuperAdmin, isDirector } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'projects'>('projects');
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<TransactionType>('egreso');

  // Category creation / editing state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catColor, setCatColor] = useState('#3B82F6');
  const [catType, setCatType] = useState<TransactionType>('egreso');

  // Batch / Quick accounts importer modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [batchType, setBatchType] = useState<TransactionType>('egreso');
  const [selectedStandardCats, setSelectedStandardCats] = useState<string[]>([]);

  // Project deletion confirmation modal
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Preset color palette for categories
  const PRESET_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', 
    '#64748B', '#D97706', '#059669', '#2563EB',
    '#0284C7', '#E11D48', '#7C3AED', '#854D0E'
  ];

  const handleStartCreateCat = (type: TransactionType) => {
    setCatType(type);
    setCatName('');
    const count = categories.filter(c => c.type === type).length + 1;
    setCatCode(type === 'ingreso' ? `ING-0${count}` : `EGR-RUB${count}`);
    setCatDescription('');
    setCatColor(type === 'ingreso' ? '#10B981' : '#F59E0B');
    setIsCreatingCategory(true);
    setEditingCategoryId(null);
  };

  const handleStartEditCat = (cat: AccountCategory) => {
    setEditingCategoryId(cat.id);
    setCatName(cat.name);
    setCatCode(cat.code);
    setCatDescription(cat.description || '');
    setCatColor(cat.color);
    setCatType(cat.type);
    setIsCreatingCategory(false);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      alert('Por favor ingrese un nombre para la cuenta/rubro');
      return;
    }

    if (isCreatingCategory) {
      onAddCategory({
        type: catType,
        name: catName.trim(),
        code: catCode.trim() || 'RUB',
        description: catDescription.trim(),
        color: catColor,
        isDefault: false,
      });
      setIsCreatingCategory(false);
    } else if (editingCategoryId) {
      onUpdateCategory(editingCategoryId, {
        name: catName.trim(),
        code: catCode.trim(),
        description: catDescription.trim(),
        color: catColor,
        type: catType,
      });
      setEditingCategoryId(null);
    }
  };

  // Batch import handler
  const handleOpenBatchModal = () => {
    // Select all standard categories by default that aren't already added
    const existingNames = new Set(categories.map(c => c.name.toLowerCase().trim()));
    const unadded = STANDARD_CONSTRUCTION_CATEGORIES.filter(
      sc => !existingNames.has(sc.name.toLowerCase().trim())
    ).map(sc => sc.name);
    setSelectedStandardCats(unadded);
    setBatchText('');
    setIsBatchModalOpen(true);
  };

  const handleProcessBatchImport = () => {
    const toAdd: Omit<AccountCategory, 'id'>[] = [];

    // 1. Add selected from standard catalogue
    STANDARD_CONSTRUCTION_CATEGORIES.forEach(sc => {
      if (selectedStandardCats.includes(sc.name)) {
        // Only if not duplicated
        if (!categories.some(c => c.name.toLowerCase() === sc.name.toLowerCase())) {
          toAdd.push(sc);
        }
      }
    });

    // 2. Add from multiline text
    if (batchText.trim()) {
      const lines = batchText.split('\n').map(l => l.trim()).filter(Boolean);
      lines.forEach((line, idx) => {
        // Check format: "Code - Name - Description" or just "Name"
        let code = '';
        let name = line;
        let desc = '';

        if (line.includes(' - ')) {
          const parts = line.split(' - ');
          if (parts.length === 2) {
            name = parts[0].trim();
            desc = parts[1].trim();
          } else if (parts.length >= 3) {
            code = parts[0].trim();
            name = parts[1].trim();
            desc = parts.slice(2).join(' - ').trim();
          }
        }

        if (!code) {
          code = batchType === 'ingreso' ? `ING-N${idx + 1}` : `EGR-N${idx + 1}`;
        }

        if (name && !categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
          toAdd.push({
            type: batchType,
            code,
            name,
            description: desc || 'Cuenta agregada por lote',
            color: batchType === 'ingreso' ? '#10B981' : PRESET_COLORS[idx % PRESET_COLORS.length],
            isDefault: false,
          });
        }
      });
    }

    if (toAdd.length === 0) {
      alert('No hay cuentas nuevas para agregar o ya existen en el sistema.');
      return;
    }

    if (onAddBatchCategories) {
      onAddBatchCategories(toAdd);
    } else {
      toAdd.forEach(cat => onAddCategory(cat));
    }

    alert(`¡Se agregaron con éxito ${toAdd.length} cuentas/rubros al plan de cuentas!`);
    setIsBatchModalOpen(false);
  };

  const filteredCategories = categories.filter((c) => c.type === categoryTypeFilter);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white tracking-tight">Administración & Plan de Cuentas (Back)</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Grupo SimetriS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {canManageObras
              ? 'Gestiona, edita o elimina Obras Activas y configura el Plan de Cuentas bimonetario para Origen y Aplicación de Fondos.'
              : 'Consulta el estado de las Obras Activas y administra el Plan de Cuentas bimonetario para Origen y Aplicación de Fondos.'}
          </p>
        </div>

        {/* Sub-tabs switch */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('projects')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeSubTab === 'projects'
                ? 'bg-amber-500 text-slate-950 shadow font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Obras Activas ({projects.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeSubTab === 'categories'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>Plan de Cuentas ({categories.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUBTAB: OBRAS ACTIVAS (EDIT & DELETE CAPABILITIES) */}
      {/* ======================================================== */}
      {activeSubTab === 'projects' && (
        <div className="space-y-5">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">
                Total de Obras Registradas: <strong className="text-amber-400">{projects.length}</strong>
              </span>
              <span className="text-slate-700">|</span>
              <span className="text-xs text-slate-400">
                Activas: <strong className="text-emerald-400">{projects.filter(p => p.status === 'active').length}</strong>
              </span>
              <span className="text-xs text-slate-400">
                Finalizadas: <strong className="text-slate-300">{projects.filter(p => p.status === 'completed').length}</strong>
              </span>
            </div>

            {canManageObras ? (
              <button
                onClick={() => onOpenProjectModal()}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
              >
                <Plus className="h-4 w-4" />
                <span>+ Nueva Obra</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 border border-slate-800 text-slate-400 rounded-xl text-xs font-medium">
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span>Solo Consulta (Edición exclusiva del Director)</span>
              </div>
            )}
          </div>

          {/* Projects Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group"
              >
                <div>
                  {/* Top Bar: Code, Status & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                      {p.code}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : p.status === 'completed'
                          ? 'bg-slate-700/50 text-slate-300 border border-slate-600'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {p.status === 'active' ? '🟢 En Ejecución' : p.status === 'completed' ? '⚪ Finalizada' : '🟡 En Pausa'}
                      </span>

                      {/* Edit & Delete Buttons (Director Only) */}
                      {canManageObras && (
                        <>
                          <button
                            onClick={() => onOpenProjectModal(p)}
                            className="p-1.5 bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 text-slate-300 rounded-lg transition border border-slate-700 hover:border-amber-500/40"
                            title="Editar datos de la obra"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => setProjectToDelete(p)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 rounded-lg transition border border-slate-700 hover:border-rose-500/40"
                            title="Eliminar obra"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title & Info */}
                  <h3 className="font-bold text-base text-white group-hover:text-amber-300 transition line-clamp-1 mb-1">
                    {p.name}
                  </h3>
                  {p.address ? (
                    <p className="text-xs text-slate-400 line-clamp-1 mb-3">{p.address}</p>
                  ) : (
                    <p className="text-xs text-slate-500 italic mb-3">Sin dirección especificada</p>
                  )}

                  {/* Financial Details Table */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-3">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">Presupuesto ($ ARS)</span>
                      <span className="font-mono font-bold text-slate-200">{formatCurrency(p.budgetARS, 'ARS')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">Presupuesto (u$s)</span>
                      <span className="font-mono font-bold text-emerald-400">{formatCurrency(p.budgetUSD, 'USD')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">t.c. Base Ref.</span>
                      <span className="font-mono font-bold text-amber-400">${p.defaultExchangeRate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">Comitente</span>
                      <span className="font-semibold text-slate-300 truncate block">{p.client || '-'}</span>
                    </div>
                  </div>

                  {p.notes && (
                    <p className="text-[11px] text-slate-400 bg-slate-800/40 p-2 rounded-lg border border-slate-800 line-clamp-2">
                      {p.notes}
                    </p>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Inicio: {p.startDate || 'No informado'}
                  </span>

                  {canManageObras ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenProjectModal(p)}
                        className="px-2.5 py-1 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition flex items-center gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => setProjectToDelete(p)}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Borrar</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic flex items-center gap-1">
                      <Lock className="h-3 w-3 text-slate-600" />
                      Solo Director
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB: PLAN DE CUENTAS & LISTADO DE CUENTAS */}
      {/* ======================================================== */}
      {activeSubTab === 'categories' && (
        <div className="space-y-5">
          {/* Action and Filter Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCategoryTypeFilter('egreso')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  categoryTypeFilter === 'egreso'
                    ? 'bg-rose-500 text-white shadow font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownRight className="h-3.5 w-3.5" />
                <span>Rubros de Egresos ({categories.filter(c => c.type === 'egreso').length})</span>
              </button>

              <button
                onClick={() => setCategoryTypeFilter('ingreso')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  categoryTypeFilter === 'ingreso'
                    ? 'bg-emerald-500 text-slate-950 shadow font-black'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Cuentas de Ingresos ({categories.filter(c => c.type === 'ingreso').length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenBatchModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-bold rounded-lg shadow transition"
                title="Cargar lote de cuentas o rubros estándar de construcción"
              >
                <ListPlus className="h-4 w-4 text-purple-400" />
                <span>+ Agregar Listado / Carga Masiva</span>
              </button>

              <button
                onClick={() => handleStartCreateCat(categoryTypeFilter)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow transition"
              >
                <Plus className="h-4 w-4" />
                <span>+ Nueva Cuenta Individual</span>
              </button>
            </div>
          </div>

          {/* Form Modal / Inline Box for Create or Edit Category */}
          {(isCreatingCategory || editingCategoryId) && (
            <form onSubmit={handleSaveCategory} className="bg-slate-900 border-2 border-purple-500/50 p-5 rounded-2xl shadow-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {isCreatingCategory ? 'Crear Nueva Cuenta / Rubro' : 'Editar Cuenta / Rubro'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setEditingCategoryId(null);
                  }}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Código de Cuenta
                  </label>
                  <input
                    type="text"
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value)}
                    placeholder="Ej: EGR-HORM"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre del Rubro / Cuenta
                  </label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Ej: Hormigón Elaborado & Bombas"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descripción o Subrubros incluidos (Opcional)
                </label>
                <input
                  type="text"
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Ej: Camiones mixer, servicio de bomba pluma y aditivos"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Color Identificador
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCatColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition ${
                        catColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    className="h-7 w-7 rounded-full bg-transparent border-0 cursor-pointer"
                    title="Color personalizado"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setEditingCategoryId(null);
                  }}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>Guardar Cuenta</span>
                </button>
              </div>
            </form>
          )}

          {/* Categories Grid List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-mono text-xs font-bold text-slate-400 uppercase">
                        {cat.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEditCat(cat)}
                        className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition"
                        title="Editar cuenta"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Estás seguro de eliminar el rubro "${cat.name}"?`)) {
                            onDeleteCategory(cat.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                        title="Eliminar cuenta"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-100 mb-1">{cat.name}</h4>
                  {cat.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{cat.description}</p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="capitalize">{cat.type === 'ingreso' ? '🟢 Origen de Fondos' : '🔴 Aplicación de Fondos'}</span>
                  {cat.isDefault && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Predefinido</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CARGA RÁPIDA / IMPORTAR LISTADO DE CUENTAS */}
      {/* ======================================================== */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
            
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <ListPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Agregar Listado de Cuentas / Rubros</h3>
                  <p className="text-xs text-slate-400">Incorpora rubros estándar de construcción o pega tu propio listado</p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Option 1: Standard Construction Catalogue */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                      Catálogo Estándar de Obras y Construcción
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedStandardCats(STANDARD_CONSTRUCTION_CATEGORIES.map(s => s.name))}
                      className="text-purple-400 hover:underline font-semibold"
                    >
                      Seleccionar Todos
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedStandardCats([])}
                      className="text-slate-400 hover:underline"
                    >
                      Deseleccionar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                  {STANDARD_CONSTRUCTION_CATEGORIES.map((sc) => {
                    const isSelected = selectedStandardCats.includes(sc.name);
                    const isAlreadyAdded = categories.some(c => c.name.toLowerCase() === sc.name.toLowerCase());

                    return (
                      <div
                        key={sc.name}
                        onClick={() => {
                          if (isAlreadyAdded) return;
                          setSelectedStandardCats(prev => 
                            isSelected ? prev.filter(n => n !== sc.name) : [...prev, sc.name]
                          );
                        }}
                        className={`flex items-center gap-2 p-1.5 rounded-md text-xs cursor-pointer transition ${
                          isAlreadyAdded 
                            ? 'opacity-40 cursor-not-allowed bg-slate-800/40 text-slate-500'
                            : isSelected 
                            ? 'bg-purple-900/30 text-purple-200 border border-purple-700/50' 
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isAlreadyAdded ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : isSelected ? (
                          <CheckSquare className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        )}
                        <span className="truncate">{sc.name}</span>
                        {isAlreadyAdded && <span className="text-[9px] text-emerald-500 ml-auto shrink-0 font-bold">(Ya existe)</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Option 2: Custom Multiline Text Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    O escribe / pega tus propias cuentas (una por renglón):
                  </label>
                  <select
                    value={batchType}
                    onChange={(e) => setBatchType(e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value="egreso">🔴 Rubros de Egresos</option>
                    <option value="ingreso">🟢 Cuentas de Ingresos</option>
                  </select>
                </div>

                <textarea
                  rows={4}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder={`Ejemplos:\nPintura y Revestimientos Plásticos\nCarpintería Metálica y Vidrios\nHonorarios de Agrimensura`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-mono leading-relaxed"
                />
                <p className="text-[11px] text-slate-400">
                  Puedes escribir un nombre por línea. Se generarán automáticamente los códigos y colores asignados.
                </p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Seleccionadas del catálogo: <strong className="text-purple-400">{selectedStandardCats.length}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleProcessBatchImport}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition shadow-md flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  <span>Incorporar al Plan de Cuentas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMACIÓN PARA BORRAR OBRA */}
      {/* ======================================================== */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">¿Eliminar esta Obra?</h3>
                <span className="text-xs font-mono text-rose-300 font-semibold">{projectToDelete.code}</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <p className="font-bold text-slate-200 text-sm">{projectToDelete.name}</p>
              {projectToDelete.client && <p className="text-slate-400">Comitente: {projectToDelete.client}</p>}
              {projectToDelete.address && <p className="text-slate-400">Ubicación: {projectToDelete.address}</p>}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Al eliminar la obra, se desvincularán y limpiarán sus presupuestos y registros asociados. Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition shadow-md flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>Sí, Eliminar Obra</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
