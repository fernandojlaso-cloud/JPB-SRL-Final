import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, Tag, FileText, User, CreditCard, HelpCircle } from 'lucide-react';
import { Transaction, Project, AccountCategory, TransactionType } from '../types';
import { parseArgentineNumber, formatCurrency } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>, editId?: string) => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  projects: Project[];
  categories: AccountCategory[];
  defaultProjectId: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'egreso',
  editingTransaction = null,
  projects,
  categories,
  defaultProjectId,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [projectId, setProjectId] = useState<string>(defaultProjectId === 'macro' ? projects[0]?.id || '' : defaultProjectId);
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [concept, setConcept] = useState<string>('');
  const [amountARS, setAmountARS] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<string>('180.00');
  const [amountUSD, setAmountUSD] = useState<string>('');
  const [payerOrRecipient, setPayerOrRecipient] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Transferencia');
  const [status, setStatus] = useState<'pagado' | 'pendiente' | 'previsto'>('pagado');
  const [notes, setNotes] = useState<string>('');

  // Sync with editing item or defaults
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setProjectId(editingTransaction.projectId);
      setCategoryId(editingTransaction.categoryId);
      setDate(editingTransaction.date);
      setConcept(editingTransaction.concept);
      setAmountARS(String(editingTransaction.amountARS));
      setExchangeRate(String(editingTransaction.exchangeRate));
      setAmountUSD(String(editingTransaction.amountUSD));
      setPayerOrRecipient(editingTransaction.payerOrRecipient || '');
      setPaymentMethod(editingTransaction.paymentMethod || 'Transferencia');
      setStatus(editingTransaction.status || 'pagado');
      setNotes(editingTransaction.notes || '');
    } else {
      setType(initialType);
      const currentProj = projects.find(p => p.id === (defaultProjectId === 'macro' ? projects[0]?.id : defaultProjectId));
      setProjectId(currentProj ? currentProj.id : projects[0]?.id || '');
      
      const availableCategories = categories.filter(c => c.type === initialType);
      setCategoryId(availableCategories[0]?.id || '');
      
      setDate(new Date().toISOString().split('T')[0]);
      setConcept('');
      setAmountARS('');
      setExchangeRate(String(currentProj?.defaultExchangeRate || 180.0));
      setAmountUSD('');
      setPayerOrRecipient('');
      setPaymentMethod('Transferencia');
      setStatus('pagado');
      setNotes('');
    }
  }, [editingTransaction, initialType, defaultProjectId, isOpen, projects, categories]);

  // When type changes, select first valid category
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const validCats = categories.filter(c => c.type === newType);
    if (!validCats.some(c => c.id === categoryId)) {
      setCategoryId(validCats[0]?.id || '');
    }
  };

  // Smart calculations
  const handleARSChange = (val: string) => {
    setAmountARS(val);
    const ars = parseArgentineNumber(val);
    const tc = parseArgentineNumber(exchangeRate);
    if (tc > 0 && ars > 0) {
      setAmountUSD((ars / tc).toFixed(2));
    }
  };

  const handleTCChange = (val: string) => {
    setExchangeRate(val);
    const tc = parseArgentineNumber(val);
    const ars = parseArgentineNumber(amountARS);
    const usd = parseArgentineNumber(amountUSD);
    if (tc > 0) {
      if (ars > 0) {
        setAmountUSD((ars / tc).toFixed(2));
      } else if (usd > 0) {
        setAmountARS((usd * tc).toFixed(2));
      }
    }
  };

  const handleUSDChange = (val: string) => {
    setAmountUSD(val);
    const usd = parseArgentineNumber(val);
    const tc = parseArgentineNumber(exchangeRate);
    if (tc > 0 && usd > 0) {
      setAmountARS((usd * tc).toFixed(2));
    }
  };

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ars = parseArgentineNumber(amountARS);
    const tc = parseArgentineNumber(exchangeRate) || 1;
    const usd = parseArgentineNumber(amountUSD) || (tc > 0 ? ars / tc : 0);

    if (!concept.trim()) {
      alert('Por favor complete el concepto del movimiento.');
      return;
    }
    if (ars <= 0 && usd <= 0) {
      alert('Por favor ingrese un monto válido en pesos o dólares.');
      return;
    }

    onSave(
      {
        projectId,
        type,
        categoryId: categoryId || filteredCategories[0]?.id || 'default',
        date,
        concept: concept.trim(),
        amountARS: ars,
        amountUSD: usd,
        exchangeRate: tc,
        payerOrRecipient: payerOrRecipient.trim(),
        paymentMethod,
        status,
        notes: notes.trim(),
      },
      editingTransaction?.id
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl text-slate-950 font-black shadow-md ${
              type === 'ingreso' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}>
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {editingTransaction ? 'Editar Registro' : type === 'ingreso' ? 'Nuevo Origen de Fondos (Ingreso)' : 'Nueva Aplicación de Fondos (Egreso)'}
              </h3>
              <p className="text-xs text-slate-400">
                {editingTransaction ? 'Actualiza los valores del movimiento' : 'Carga un nuevo comprobante con imputación bimonetaria'}
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Type Toggle (Ingreso vs Egreso) */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange('ingreso')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                type === 'ingreso'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🟢 Origen de Fondos (Ingreso)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('egreso')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                type === 'egreso'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔴 Aplicación de Fondos (Egreso / Costo)
            </button>
          </div>

          {/* Obra and Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Obra de Destino <span className="text-rose-400">*</span>
              </label>
              <select
                id="tx-project-select"
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  const p = projects.find(proj => proj.id === e.target.value);
                  if (p && !editingTransaction) {
                    setExchangeRate(String(p.defaultExchangeRate || 180));
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Rubro / Cuenta de Imputación <span className="text-rose-400">*</span>
              </label>
              <select
                id="tx-category-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                required
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Concept */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Fecha del Movimiento <span className="text-rose-400">*</span>
              </label>
              <input
                id="tx-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Concepto / Detalle <span className="text-rose-400">*</span>
              </label>
              <input
                id="tx-concept-input"
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder={type === 'ingreso' ? 'Ej: Aporte Mily y Fer (vta. u$s 4.400 t.c. 175,50)' : 'Ej: Acopio Materiales M.O. Walter c/mat y filtros'}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          {/* Bimonetary Inputs Box (The Core Excel Converter Mechanism) */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Imputación Bimonetaria & Tipo de Cambio
              </span>
              <span className="text-[11px] text-slate-400">
                Al cargar 2 valores se calcula automáticamente el tercero
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Monto ARS */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Monto en Pesos ($ ARS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    id="tx-amount-ars-input"
                    type="number"
                    step="any"
                    value={amountARS}
                    onChange={(e) => handleARSChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 font-mono text-sm text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Tipo de Cambio */}
              <div>
                <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                  Tipo de Cambio (t.c.)
                </label>
                <div className="relative">
                  <input
                    id="tx-tc-input"
                    type="number"
                    step="0.1"
                    value={exchangeRate}
                    onChange={(e) => handleTCChange(e.target.value)}
                    placeholder="180.00"
                    className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 font-mono text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Monto USD */}
              <div>
                <label className="block text-[11px] font-semibold text-emerald-300 mb-1">
                  Monto en Dólares (u$s USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-xs">u$s</span>
                  <input
                    id="tx-amount-usd-input"
                    type="number"
                    step="any"
                    value={amountUSD}
                    onChange={(e) => handleUSDChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg pl-9 pr-3 py-2 font-mono text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payer/Recipient, Payment Method & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {type === 'ingreso' ? 'Aportante / Cliente' : 'Proveedor / Contratista'}
              </label>
              <input
                id="tx-payer-input"
                type="text"
                value={payerOrRecipient}
                onChange={(e) => setPayerOrRecipient(e.target.value)}
                placeholder={type === 'ingreso' ? 'Ej: Mily y Fer' : 'Ej: Walter Contratista'}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Medio de Pago
              </label>
              <select
                id="tx-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="Transferencia">Transferencia Bancaria</option>
                <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                <option value="Efectivo">Efectivo ($ / u$s)</option>
                <option value="Cheque">Cheque</option>
                <option value="Vep Bancario">VEP / Impuestos</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Estado del Pago
              </label>
              <select
                id="tx-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="pagado">✅ Pagado / Cobrado</option>
                <option value="pendiente">⏳ Pendiente</option>
                <option value="previsto">📅 Previsto</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Observaciones / Comprobante (Opcional)
            </label>
            <textarea
              id="tx-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Número de factura, detalle de retenciones o notas sobre adicionales..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`px-5 py-2 font-bold text-xs rounded-lg transition shadow-md flex items-center gap-2 ${
              type === 'ingreso'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'bg-rose-500 hover:bg-rose-400 text-white'
            }`}
          >
            <Save className="h-4 w-4" />
            {editingTransaction ? 'Guardar Cambios' : 'Registrar Movimiento'}
          </button>
        </div>
      </div>
    </div>
  );
};
