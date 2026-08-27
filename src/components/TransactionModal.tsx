import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Save, 
  DollarSign, 
  Calendar, 
  Tag, 
  FileText, 
  User, 
  CreditCard, 
  HelpCircle,
  Search,
  ChevronDown,
  Check,
  ArrowRightLeft,
  Coins,
  Receipt,
  Calculator
} from 'lucide-react';
import { Transaction, Project, AccountCategory, TransactionType } from '../types';
import { parseArgentineNumber, formatCurrency, formatNumber } from '../utils/formatters';

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

type CurrencyInputMode = 'USD' | 'ARS' | 'BIMONETARY';

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
  const [currencyInputMode, setCurrencyInputMode] = useState<CurrencyInputMode>('USD');
  const [amountARS, setAmountARS] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<string>('180,00');
  const [amountUSD, setAmountUSD] = useState<string>('');
  const [payerOrRecipient, setPayerOrRecipient] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Transferencia');
  const [status, setStatus] = useState<'pagado' | 'pendiente' | 'previsto'>('pagado');
  const [notes, setNotes] = useState<string>('');

  // Searchable Category Picker State
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState<boolean>(false);
  const categoryPickerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync with editing item or defaults
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setProjectId(editingTransaction.projectId);
      setCategoryId(editingTransaction.categoryId);
      setDate(editingTransaction.date);
      setConcept(editingTransaction.concept);
      setAmountARS(editingTransaction.amountARS ? formatNumber(editingTransaction.amountARS, 2) : '');
      setExchangeRate(editingTransaction.exchangeRate ? formatNumber(editingTransaction.exchangeRate, 2) : '180,00');
      setAmountUSD(editingTransaction.amountUSD ? formatNumber(editingTransaction.amountUSD, 2) : '');
      setPayerOrRecipient(editingTransaction.payerOrRecipient || '');
      setPaymentMethod(editingTransaction.paymentMethod || 'Transferencia');
      setStatus(editingTransaction.status || 'pagado');
      setNotes(editingTransaction.notes || '');

      if (editingTransaction.amountUSD && !editingTransaction.amountARS) {
        setCurrencyInputMode('USD');
      } else if (editingTransaction.amountARS && !editingTransaction.amountUSD) {
        setCurrencyInputMode('ARS');
      } else {
        setCurrencyInputMode('USD');
      }
    } else {
      setType(initialType);
      const currentProj = projects.find(p => p.id === (defaultProjectId === 'macro' ? projects[0]?.id : defaultProjectId));
      setProjectId(currentProj ? currentProj.id : projects[0]?.id || '');
      
      const availableCategories = categories.filter(c => c.type === initialType);
      setCategoryId(availableCategories[0]?.id || '');
      
      setDate(new Date().toISOString().split('T')[0]);
      setConcept('');
      setAmountARS('');
      setExchangeRate(currentProj?.defaultExchangeRate ? formatNumber(currentProj.defaultExchangeRate, 2) : '180,00');
      setAmountUSD('');
      setPayerOrRecipient('');
      setPaymentMethod('Transferencia');
      setStatus('pagado');
      setNotes('');
      setCurrencyInputMode('USD');
    }
    setCategorySearchQuery('');
    setIsCategoryPickerOpen(false);
  }, [editingTransaction, initialType, defaultProjectId, isOpen, projects, categories]);

  // Click outside to close category picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryPickerRef.current && !categoryPickerRef.current.contains(event.target as Node)) {
        setIsCategoryPickerOpen(false);
      }
    };
    if (isCategoryPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryPickerOpen]);

  // Auto-focus search input when category dropdown opens
  useEffect(() => {
    if (isCategoryPickerOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isCategoryPickerOpen]);

  // When type changes, select first valid category
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategorySearchQuery('');
    const validCats = categories.filter(c => c.type === newType);
    if (!validCats.some(c => c.id === categoryId)) {
      setCategoryId(validCats[0]?.id || '');
    }
  };

  // Smart calculations with Argentine decimals and thousand dots
  const handleARSChange = (val: string) => {
    setAmountARS(val);
    const ars = parseArgentineNumber(val);
    const tc = parseArgentineNumber(exchangeRate);
    if (tc > 0 && ars > 0) {
      setAmountUSD(formatNumber(ars / tc, 2));
    }
  };

  const handleARSBlur = () => {
    const ars = parseArgentineNumber(amountARS);
    if (ars > 0) {
      setAmountARS(formatNumber(ars, 2));
    }
  };

  const handleTCChange = (val: string) => {
    setExchangeRate(val);
    const tc = parseArgentineNumber(val);
    const ars = parseArgentineNumber(amountARS);
    const usd = parseArgentineNumber(amountUSD);
    if (tc > 0) {
      if (ars > 0) {
        setAmountUSD(formatNumber(ars / tc, 2));
      } else if (usd > 0) {
        setAmountARS(formatNumber(usd * tc, 2));
      }
    }
  };

  const handleTCBlur = () => {
    const tc = parseArgentineNumber(exchangeRate);
    if (tc > 0) {
      setExchangeRate(formatNumber(tc, 2));
    }
  };

  const handleUSDChange = (val: string) => {
    setAmountUSD(val);
    const usd = parseArgentineNumber(val);
    const tc = parseArgentineNumber(exchangeRate);
    if (tc > 0 && usd > 0) {
      setAmountARS(formatNumber(usd * tc, 2));
    }
  };

  const handleUSDBlur = () => {
    const usd = parseArgentineNumber(amountUSD);
    if (usd > 0) {
      setAmountUSD(formatNumber(usd, 2));
    }
  };

  const filteredCategories = useMemo(() => {
    const list = categories.filter(c => c.type === type);
    if (!categorySearchQuery.trim()) return list;

    const q = categorySearchQuery.toLowerCase().trim();
    return list.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.code.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, type, categorySearchQuery]);

  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === categoryId) || filteredCategories[0];
  }, [categories, categoryId, filteredCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawArs = parseArgentineNumber(amountARS);
    const rawTc = parseArgentineNumber(exchangeRate) || 1;
    let rawUsd = parseArgentineNumber(amountUSD);

    if (currencyInputMode === 'USD' && rawUsd > 0 && rawArs <= 0) {
      // If entered in USD, guarantee ARS equivalent
      rawUsd = rawUsd;
    } else if (currencyInputMode === 'ARS' && rawArs > 0 && rawUsd <= 0) {
      rawUsd = rawTc > 0 ? rawArs / rawTc : 0;
    } else if (rawUsd <= 0 && rawArs > 0 && rawTc > 0) {
      rawUsd = rawArs / rawTc;
    }

    const finalARS = rawArs > 0 ? rawArs : (rawUsd > 0 && rawTc > 0 ? rawUsd * rawTc : 0);
    const finalUSD = rawUsd > 0 ? rawUsd : (rawArs > 0 && rawTc > 0 ? rawArs / rawTc : 0);

    if (!concept.trim()) {
      alert('Por favor complete el concepto del movimiento.');
      return;
    }
    if (finalARS <= 0 && finalUSD <= 0) {
      alert('Por favor ingrese un monto válido en dólares o pesos.');
      return;
    }

    onSave(
      {
        projectId,
        type,
        categoryId: categoryId || selectedCategory?.id || 'default',
        date,
        concept: concept.trim(),
        amountARS: finalARS,
        amountUSD: finalUSD,
        exchangeRate: rawTc,
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
                {editingTransaction ? 'Actualiza los valores del movimiento' : 'Carga un nuevo comprobante con buscador de rubros e imputación bimonetaria'}
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

            {/* BUSCADOR DE RUBROS / CUENTA DE IMPUTACION */}
            <div className="relative" ref={categoryPickerRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Rubro / Cuenta de Imputación <span className="text-rose-400">*</span>
                </label>
                {type === 'egreso' && (
                  <span className="text-[10px] text-amber-400 font-medium">Buscador integrado</span>
                )}
              </div>

              {/* Selected Rubro Trigger Button */}
              <button
                type="button"
                id="tx-category-picker-trigger"
                onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                className="w-full bg-slate-950 border border-slate-700 hover:border-amber-500/60 rounded-lg px-3 py-2 text-left flex items-center justify-between text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition group"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: selectedCategory?.color || '#F59E0B' }}
                  />
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40 shrink-0">
                    {selectedCategory?.code || 'RUB'}
                  </span>
                  <span className="font-semibold text-slate-200 truncate">
                    {selectedCategory?.name || 'Seleccionar Rubro'}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 group-hover:text-amber-400 transition shrink-0 ${isCategoryPickerOpen ? 'rotate-180 text-amber-400' : ''}`} />
              </button>

              {/* Category Searchable Dropdown Popup */}
              {isCategoryPickerOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
                  
                  {/* Search Input */}
                  <div className="p-2 border-b border-slate-800 bg-slate-950 flex items-center gap-2">
                    <Search className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      placeholder={type === 'egreso' ? "Buscar rubro por nombre o código (ej: Walter, Techista, 101, Pintura)..." : "Buscar cuenta de ingreso..."}
                      className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none py-1"
                    />
                    {categorySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCategorySearchQuery('')}
                        className="p-1 text-slate-400 hover:text-white rounded transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filtered Category Items List */}
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/60 p-1">
                    {filteredCategories.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No se encontraron rubros con &ldquo;{categorySearchQuery}&rdquo;
                      </div>
                    ) : (
                      filteredCategories.map((c) => {
                        const isSelected = c.id === categoryId;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCategoryId(c.id);
                              setIsCategoryPickerOpen(false);
                              setCategorySearchQuery('');
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition ${
                              isSelected
                                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: c.color }}
                              />
                              <span className="font-mono font-bold text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                                {c.code}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-200">{c.name}</p>
                                {c.description && (
                                  <p className="text-[10px] text-slate-400 truncate">{c.description}</p>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 text-amber-400 shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Summary Bar */}
                  <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{filteredCategories.length} rubros disponibles</span>
                    <span className="text-slate-500 font-mono">Escribe para filtrar</span>
                  </div>
                </div>
              )}
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

          {/* Selector de Sistema de Carga de Moneda */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-amber-400" />
                  Sistema de Carga de Moneda
                </span>
                <p className="text-[11px] text-slate-400">
                  Seleccione cómo desea ingresar el comprobante o gasto
                </p>
              </div>

              {/* Segmented Mode Selector */}
              <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  id="mode-usd-btn"
                  onClick={() => setCurrencyInputMode('USD')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    currencyInputMode === 'USD'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  Cargar en Dólares (u$s)
                </button>

                <button
                  type="button"
                  id="mode-ars-btn"
                  onClick={() => setCurrencyInputMode('ARS')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    currencyInputMode === 'ARS'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  Cargar en Pesos ($)
                </button>

                <button
                  type="button"
                  id="mode-bimonetary-btn"
                  onClick={() => setCurrencyInputMode('BIMONETARY')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    currencyInputMode === 'BIMONETARY'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Bimonetario
                </button>
              </div>
            </div>

            {/* MODO 1: CARGA DIRECTA EN DÓLARES (USD) */}
            {currencyInputMode === 'USD' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-7">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        Monto en Dólares (u$s USD) <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-sans">
                        Moneda oficial del presupuesto
                      </span>
                    </div>
                    <div className="flex items-center bg-slate-900 border-2 border-emerald-500/50 rounded-xl px-3 py-1.5 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition shadow-inner">
                      <span className="text-sm font-black text-emerald-400 select-none mr-2">
                        u$s
                      </span>
                      <input
                        id="tx-amount-usd-direct"
                        name="tx_amount_usd_direct"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        value={amountUSD}
                        onChange={(e) => handleUSDChange(e.target.value)}
                        onBlur={handleUSDBlur}
                        placeholder="0,00"
                        className="w-full bg-transparent text-lg font-mono text-emerald-300 font-bold focus:outline-none placeholder-slate-600"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="md:col-span-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Tipo de Cambio Ref. (t.c.)
                      </label>
                      {parseArgentineNumber(exchangeRate) > 0 && (
                        <span className="text-[10px] font-mono text-amber-300">
                          t.c. {formatNumber(parseArgentineNumber(exchangeRate), 2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/30 transition">
                      <span className="text-xs text-slate-400 font-bold select-none mr-2">
                        t.c.
                      </span>
                      <input
                        id="tx-exchange-rate-usd-mode"
                        name="tx_tc_usd_mode"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        value={exchangeRate}
                        onChange={(e) => handleTCChange(e.target.value)}
                        onBlur={handleTCBlur}
                        placeholder="1.500,00"
                        className="w-full bg-transparent text-sm font-mono text-slate-200 font-bold focus:outline-none placeholder-slate-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Live ARS Equivalent Pill */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-slate-400" />
                    Equivalente calculado en Pesos ($ ARS):
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    $ {formatNumber(parseArgentineNumber(amountARS) || (parseArgentineNumber(amountUSD) * (parseArgentineNumber(exchangeRate) || 1)), 2)}
                  </span>
                </div>
              </div>
            )}

            {/* MODO 2: CARGA EN PESOS (ARS) CON CONVERSOR */}
            {currencyInputMode === 'ARS' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-7">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-amber-400 flex items-center gap-1">
                        <Receipt className="h-3.5 w-3.5" />
                        Monto en Pesos ($ ARS) <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-sans">
                        Según factura o ticket
                      </span>
                    </div>
                    <div className="flex items-center bg-slate-900 border-2 border-amber-500/50 rounded-xl px-3 py-1.5 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition shadow-inner">
                      <span className="text-sm font-black text-amber-400 select-none mr-2">
                        $
                      </span>
                      <input
                        id="tx-amount-ars-mode"
                        name="tx_amount_ars_mode"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        value={amountARS}
                        onChange={(e) => handleARSChange(e.target.value)}
                        onBlur={handleARSBlur}
                        placeholder="0,00"
                        className="w-full bg-transparent text-lg font-mono text-amber-300 font-bold focus:outline-none placeholder-slate-600"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="md:col-span-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Tipo de Cambio (t.c.) <span className="text-rose-400">*</span>
                      </label>
                      {parseArgentineNumber(exchangeRate) > 0 && (
                        <span className="text-[10px] font-mono text-amber-300">
                          t.c. {formatNumber(parseArgentineNumber(exchangeRate), 2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/30 transition">
                      <span className="text-xs text-slate-400 font-bold select-none mr-2">
                        t.c.
                      </span>
                      <input
                        id="tx-exchange-rate-ars-mode"
                        name="tx_tc_ars_mode"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        value={exchangeRate}
                        onChange={(e) => handleTCChange(e.target.value)}
                        onBlur={handleTCBlur}
                        placeholder="1.500,00"
                        className="w-full bg-transparent text-sm font-mono text-slate-200 font-bold focus:outline-none placeholder-slate-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Resulting USD Conversion Card */}
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-300 block">
                        Conversión a Presupuesto General (USD)
                      </span>
                      <span className="text-[11px] text-emerald-400/80">
                        Se imputa a la obra al tipo de cambio indicado
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black font-mono text-emerald-400">
                      u$s {formatNumber(parseArgentineNumber(amountUSD) || (parseArgentineNumber(exchangeRate) > 0 ? parseArgentineNumber(amountARS) / parseArgentineNumber(exchangeRate) : 0), 2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* MODO 3: MODO BIMONETARIO SIMULTÁNEO */}
            {currencyInputMode === 'BIMONETARY' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Monto en Pesos ($ ARS)
                      </label>
                      {parseArgentineNumber(amountARS) > 0 && (
                        <span className="text-[10px] font-mono text-slate-400">
                          $ {formatNumber(parseArgentineNumber(amountARS), 2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus-within:border-amber-400 transition">
                      <span className="text-xs text-slate-400 font-bold select-none mr-1.5">$</span>
                      <input
                        id="tx-amount-ars-bimonetary"
                        name="tx_ars_bimonetary"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        value={amountARS}
                        onChange={(e) => handleARSChange(e.target.value)}
                        onBlur={handleARSBlur}
                        placeholder="0,00"
                        className="w-full bg-transparent text-sm font-mono text-slate-100 font-bold focus:outline-none placeholder-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Tipo de Cambio (t.c.)
                      </label>
                      {parseArgentineNumber(exchangeRate) > 0 && (
                        <span className="text-[10px] font-mono text-amber-300/80">
                          t.c. {formatNumber(parseArgentineNumber(exchangeRate), 2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus-within:border-amber-400 transition">
                      <span className="text-xs text-slate-400 font-bold select-none mr-1.5">t.c.</span>
                      <input
                        id="tx-exchange-rate-bimonetary"
                        name="tx_tc_bimonetary"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        value={exchangeRate}
                        onChange={(e) => handleTCChange(e.target.value)}
                        onBlur={handleTCBlur}
                        placeholder="1.500,00"
                        className="w-full bg-transparent text-sm font-mono text-amber-300 font-bold focus:outline-none placeholder-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Monto en Dólares (u$s USD)
                      </label>
                      {parseArgentineNumber(amountUSD) > 0 && (
                        <span className="text-[10px] font-mono text-emerald-400">
                          u$s {formatNumber(parseArgentineNumber(amountUSD), 2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus-within:border-emerald-400 transition">
                      <span className="text-xs text-emerald-400 font-bold select-none mr-1.5">u$s</span>
                      <input
                        id="tx-amount-usd-bimonetary"
                        name="tx_usd_bimonetary"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        value={amountUSD}
                        onChange={(e) => handleUSDChange(e.target.value)}
                        onBlur={handleUSDBlur}
                        placeholder="0,00"
                        className="w-full bg-transparent text-sm font-mono text-emerald-400 font-bold focus:outline-none placeholder-slate-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {type === 'ingreso' ? 'Aportante / Cliente' : 'Proveedor / Contratista'}
              </label>
              <input
                id="tx-payer-input"
                type="text"
                value={payerOrRecipient}
                onChange={(e) => setPayerOrRecipient(e.target.value)}
                placeholder={type === 'ingreso' ? 'Ej: Mily y Fer' : 'Ej: Rogelio Fioce Techista'}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Medio de Pago
              </label>
              <select
                id="tx-payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="Transferencia">Transferencia Bancaria</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Cheque">Cheque</option>
                <option value="Dólares Físicos">Dólares Físicos</option>
                <option value="Venta de Divisas">Venta de Divisas (u$s)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Estado del Movimiento
              </label>
              <select
                id="tx-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="pagado">🟢 Pagado / Efectivizado</option>
                <option value="pendiente">🟡 Pendiente de Pago</option>
                <option value="previsto">🔵 Previsto / Presupuestado</option>
              </select>
            </div>
          </div>

          {/* Notes / Internal Observations */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Observaciones Internas / Comprobante
            </label>
            <textarea
              id="tx-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Número de factura, detalle de retenciones o notas sobre el contratista..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
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
              <span>{editingTransaction ? 'Actualizar Registro' : 'Guardar Movimiento'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
