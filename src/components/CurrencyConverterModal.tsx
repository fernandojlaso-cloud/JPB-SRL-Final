import React, { useState } from 'react';
import { X, ArrowRightLeft, Calculator, Info, Check } from 'lucide-react';
import { formatCurrency, formatNumber, parseArgentineNumber } from '../utils/formatters';

interface CurrencyConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRate?: number;
}

export const CurrencyConverterModal: React.FC<CurrencyConverterModalProps> = ({
  isOpen,
  onClose,
  initialRate = 180.0,
}) => {
  const [exchangeRate, setExchangeRate] = useState<number>(initialRate);
  const [arsAmount, setArsAmount] = useState<string>('1000000');
  const [usdAmount, setUsdAmount] = useState<string>(
    (1000000 / initialRate).toFixed(2)
  );
  const [activeDirection, setActiveDirection] = useState<'ARS_TO_USD' | 'USD_TO_ARS'>('ARS_TO_USD');

  if (!isOpen) return null;

  const handleRateChange = (rateStr: string) => {
    const rate = parseArgentineNumber(rateStr);
    setExchangeRate(rate);
    if (rate > 0) {
      if (activeDirection === 'ARS_TO_USD') {
        const ars = parseArgentineNumber(arsAmount);
        setUsdAmount((ars / rate).toFixed(2));
      } else {
        const usd = parseArgentineNumber(usdAmount);
        setArsAmount((usd * rate).toFixed(2));
      }
    }
  };

  const handleArsChange = (val: string) => {
    setArsAmount(val);
    setActiveDirection('ARS_TO_USD');
    const ars = parseArgentineNumber(val);
    if (exchangeRate > 0) {
      setUsdAmount((ars / exchangeRate).toFixed(2));
    }
  };

  const handleUsdChange = (val: string) => {
    setUsdAmount(val);
    setActiveDirection('USD_TO_ARS');
    const usd = parseArgentineNumber(val);
    if (exchangeRate > 0) {
      setArsAmount((usd * exchangeRate).toFixed(2));
    }
  };

  const presetRates = [140, 150, 160, 175, 180, 190, 200, 1000, 1250];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Conversor Bimonetario de Obra</h3>
              <p className="text-xs text-slate-400">Pesos Argentinos ($) ⇄ Dólares Americanos (u$s)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Exchange Rate Input */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Tipo de Cambio de Imputación (t.c.)
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  id="modal-exchange-rate-input"
                  type="number"
                  step="0.5"
                  value={exchangeRate || ''}
                  onChange={(e) => handleRateChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-4 py-2 text-white font-mono text-base font-bold focus:border-amber-400 focus:outline-none"
                  placeholder="Ej: 180.00"
                />
              </div>
              <span className="text-xs text-slate-400 font-medium">ARS por cada 1 USD</span>
            </div>

            {/* Quick Rates */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">Rápidos:</span>
              {presetRates.slice(0, 6).map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleRateChange(String(rate))}
                  className={`text-xs px-2 py-0.5 rounded border transition font-mono ${
                    exchangeRate === rate
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  ${rate}
                </button>
              ))}
            </div>
          </div>

          {/* Dual Inputs */}
          <div className="space-y-4">
            {/* ARS Box */}
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 focus-within:border-amber-500/60 transition">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Monto en Pesos Argentinos ($ ARS)</label>
                <span className="text-xs text-amber-400 font-mono font-medium">
                  {formatCurrency(parseArgentineNumber(arsAmount), 'ARS')}
                </span>
              </div>
              <div className="flex items-center bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-amber-400 transition">
                <span className="text-slate-400 font-bold text-lg mr-2 select-none">$</span>
                <input
                  id="modal-ars-input"
                  name="modal_ars_input"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={arsAmount}
                  onChange={(e) => handleArsChange(e.target.value)}
                  className="w-full bg-transparent text-white font-mono text-lg font-bold focus:outline-none placeholder-slate-600"
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Switch icon */}
            <div className="flex justify-center -my-2 relative z-10">
              <div className="bg-slate-800 border border-slate-700 rounded-full p-1.5 text-slate-400 shadow">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
            </div>

            {/* USD Box */}
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 focus-within:border-emerald-500/60 transition">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Monto en Dólares (u$s USD)</label>
                <span className="text-xs text-emerald-400 font-mono font-medium">
                  {formatCurrency(parseArgentineNumber(usdAmount), 'USD')}
                </span>
              </div>
              <div className="flex items-center bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-emerald-400 transition">
                <span className="text-emerald-400 font-bold text-sm mr-2 select-none">u$s</span>
                <input
                  id="modal-usd-input"
                  name="modal_usd_input"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={usdAmount}
                  onChange={(e) => handleUsdChange(e.target.value)}
                  className="w-full bg-transparent text-white font-mono text-lg font-bold focus:outline-none placeholder-slate-600"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          {/* Useful Notice */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-400">
            <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-200">Principio de Imputación de Obra:</strong> Cada gasto o ingreso
              se registra con su tipo de cambio específico de la fecha pactada. Esto preserva el valor real en dólares
              independientemente de la inflación o devaluación del peso.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-800/80 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-md"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
