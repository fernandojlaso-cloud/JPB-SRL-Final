import React, { useState, useEffect } from 'react';
import { X, Building2, Save, DollarSign } from 'lucide-react';
import { Project } from '../types';
import { parseArgentineNumber } from '../utils/formatters';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (proj: Omit<Project, 'id'>, editId?: string) => void;
  editingProject?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProject,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [client, setClient] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'on-hold'>('active');
  const [budgetARS, setBudgetARS] = useState('15000000');
  const [defaultExchangeRate, setDefaultExchangeRate] = useState('180.00');
  const [budgetUSD, setBudgetUSD] = useState((15000000 / 180).toFixed(2));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setCode(editingProject.code);
      setAddress(editingProject.address || '');
      setClient(editingProject.client || '');
      setStatus(editingProject.status);
      setBudgetARS(editingProject.budgetARS.toString());
      setDefaultExchangeRate(editingProject.defaultExchangeRate.toString());
      setBudgetUSD(editingProject.budgetUSD.toString());
      setNotes(editingProject.notes || '');
    } else {
      setName('');
      setCode('');
      setAddress('');
      setClient('');
      setStatus('active');
      setBudgetARS('15000000');
      setDefaultExchangeRate('180.00');
      setBudgetUSD((15000000 / 180).toFixed(2));
      setNotes('');
    }
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  const handleBudgetARSChange = (val: string) => {
    setBudgetARS(val);
    const ars = parseArgentineNumber(val);
    const tc = parseArgentineNumber(defaultExchangeRate);
    if (tc > 0 && ars > 0) {
      setBudgetUSD((ars / tc).toFixed(2));
    }
  };

  const handleExchangeRateChange = (val: string) => {
    setDefaultExchangeRate(val);
    const tc = parseArgentineNumber(val);
    const ars = parseArgentineNumber(budgetARS);
    if (tc > 0 && ars > 0) {
      setBudgetUSD((ars / tc).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingrese el nombre de la obra.');
      return;
    }

    const ars = parseArgentineNumber(budgetARS);
    const tc = parseArgentineNumber(defaultExchangeRate) || 180;
    const usd = parseArgentineNumber(budgetUSD) || (tc > 0 ? ars / tc : 0);

    onSave(
      {
        name: name.trim(),
        code: code.trim() || `OBRA-${Date.now().toString().slice(-4)}`,
        address: address.trim(),
        client: client.trim(),
        status: status,
        startDate: editingProject?.startDate || new Date().toISOString().split('T')[0],
        budgetARS: ars,
        budgetUSD: usd,
        defaultExchangeRate: tc,
        notes: notes.trim(),
      },
      editingProject ? editingProject.id : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {editingProject ? 'Editar Obra' : 'Alta de Nueva Obra'}
              </h3>
              <p className="text-xs text-slate-400">
                {editingProject ? 'Modificar datos, presupuestos y estado de la obra' : 'Registra un nuevo frente de trabajo o desarrollo'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre de la Obra <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: CASA MILY y FER CARACAS 2672"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Código / Identificador
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: OBRA-2672"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cliente / Propietario
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Ej: Mily & Fer"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ubicación / Dirección
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej: Caracas 2672, CABA"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estado de la Obra
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="active">🟢 En Ejecución (Activa)</option>
                <option value="completed">⚪ Finalizada</option>
                <option value="on-hold">🟡 En Pausa</option>
              </select>
            </div>
          </div>

          {/* Budget Dual Inputs */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Presupuesto Meta & Tipo de Cambio
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Monto en $ (ARS)
                </label>
                <input
                  type="number"
                  step="any"
                  value={budgetARS}
                  onChange={(e) => handleBudgetARSChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-amber-400 mb-1">
                  t.c. Base Referencia
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={defaultExchangeRate}
                  onChange={(e) => handleExchangeRateChange(e.target.value)}
                  className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-1.5 text-sm font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-emerald-400 mb-1">
                  Monto en u$s (USD)
                </label>
                <input
                  type="number"
                  step="any"
                  value={budgetUSD}
                  onChange={(e) => setBudgetUSD(e.target.value)}
                  className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-3 py-1.5 text-sm font-mono text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas Adicionales
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalle del contrato, plazos estimados, etc."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-md flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>{editingProject ? 'Guardar Cambios' : 'Crear Obra'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
