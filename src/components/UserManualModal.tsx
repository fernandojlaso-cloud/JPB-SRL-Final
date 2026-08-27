import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Layers, 
  DollarSign, 
  TrendingUp, 
  FileSpreadsheet, 
  ShieldCheck, 
  Hammer, 
  ArrowRightLeft, 
  Sliders, 
  Building2,
  CheckCircle2,
  AlertTriangle,
  FolderDown,
  Sparkles,
  Calculator,
  Percent
} from 'lucide-react';
import { JpbSrlLogo } from './JpbSrlLogo';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('all');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const manualMarkdown = `# MANUAL DE USUARIO & GUÍA OPERATIVA
## PLATAFORMA DE CONTROL FINANCIERO Y PRESUPUESTARIO DE OBRAS
### JPB SRL - CONTROL FINANCIERO & GESTIÓN DE OBRAS

---

### 1. INTRODUCCIÓN Y ALCANCE
Esta plataforma es una solución integral para el control de **Origen y Aplicación de Fondos** en proyectos de construcción y obras civiles de JPB SRL. Permite una gestión bimonetaria transparente (Pesos Argentinos ARS y Dólares Estadounidenses USD), seguimiento de presupuestos por contratista, detección de desvíos y sincronización en la nube mediante Firebase.

---

### 2. ESTRUCTURA Y NAVEGACIÓN PRINCIPAL
- **Visión Macro (Todas las Obras)**: Vista consolidada de tesorería, total recaudado, total ejecutado y saldos combinados de todas las obras activas.
- **Obra Específica (ej. Casa Mily y Fer)**: Permite ingresar al detalle granular de movimientos, comprobantes, contratos y desvíos de una obra puntual.
- **Control Presupuestario en Dólares (u$s USD)**: Toda la evaluación de desvíos, presupuestos meta y costos por m² se gestiona en moneda dura.

---

### 3. MÓDULO 1: ORIGEN DE FONDOS (INGRESOS & APORTES)
- **Registro de Ingresos**: Permite asentar aportes de socios/propietarios, anticipos, cobranzas de certificados o canjes.
- **Venta de Divisas (u$s)**: Soporta el ingreso de ventas de dólares con su cotización respectiva (ej. "vta. u$s 7.500 tc 200"), calculando automáticamente los pesos ingresados a caja.
- **Filtros y Búsquedas**: Búsqueda por concepto, aportante, medio de pago y rango de fechas.

---

### 4. MÓDULO 2: APLICACIÓN DE FONDOS (EGRESOS & GASTOS)
- **Carga de Comprobantes y Gastos**: Permite imputar comprobantes con fecha, rubro, proveedor, importe en $ y/o u$s, tipo de cambio y estado de pago (Pagado / Pendiente).
- **Conversor Bidireccional Integrado**: Permite registrar gastos en Pesos ingresando el tipo de cambio del comprobante para su cómputo automático en Dólares u$s.

---

### 5. MÓDULO 3: PRESUPUESTO, CONTROL DE DESVÍOS & AUTO-CALIBRACIÓN DE RUBROS
- **Comparativa Presupuestado vs. Real**: Monitoreo en tiempo real del gasto ejecutado frente a la meta asignada.
- **Precio y Desvío por Metro Cuadrado (u$s / m²)**: Cálculo automático del costo unitario presupuestado vs. costo unitario real ejecutado según la superficie total (m²).
- **Parámetros de Auto-calibración de Rubros**:
  Para distribuir el Presupuesto Meta Total en Dólares (u$s) entre los rubros de egreso, el sistema utiliza una matriz de ponderación estándar de la industria:
  * **Materiales e Insumos (MAT)**: ~35% (hierros, cemento, áridos, corralón)
  * **Mano de Obra & Contratistas (MO)**: ~35% (albañilería, demolición, gremios)
  * **Estructura & Hormigón (ESTR)**: ~15%
  * **Honorarios Profesionales (HON)**: ~10% (dirección técnica, proyecto)
  * **Aberturas & Carpintería (ABER)**: ~8% (aluminio, aberturas, carpinterías)
  * **Instalación Sanitaria / Gas (SAN/PLO)**: ~8% (plomería, gas, sanitarios)
  * **Pisos & Revestimientos (PIS)**: ~8% (porcelanatos, revestimientos)
  * **Instalación Eléctrica (ELEC)**: ~7% (materiales eléctricos e iluminación)
  * **Pintura & Terminaciones (PINT)**: ~6% (pintura integral, yesería)
  * **Fletes & Volquetes (FLET/LOG)**: ~5% (logística y retiro de escombros)
  * **Permisos & Tasas Municipales (PERM)**: ~5% (derechos de construcción)
  * **Gastos Generales / Varios (GEN)**: ~5%
- **Fórmula de Normalización y Conversión**:
  1. Normaliza los coeficientes al 100% según los rubros activos de la empresa.
  2. Presupuesto Rubro (u$s) = Presupuesto Total Obra (u$s) * (Peso Rubro / Suma de Pesos Activos).
  3. Presupuesto Rubro (ARS) = Presupuesto Rubro (u$s) * Tipo de Cambio de Referencia.
  4. Ajuste manual: Cada rubro queda editable individualmente en la matriz.

---

### 6. MÓDULO 4: IMPORTADOR INTELIGENTE DE EXCEL (.XLSX / .XLS / .CSV)
- **Importación Masiva**: Carga de cientos de movimientos en segundos.
- **Detección Automática de Columnas**: Identifica fechas, montos, tipos de cambio y contratistas sin importar el orden de las columnas.
- **Reparación y Autocompletado**:
  * Extrae montos en dólares y cotizaciones del texto del concepto.
  * Botón "⚡ Autocompletar y Validar Todo" para resolver inconsistencias.
  * Botón "Forzar Importación de Todo" para cargas inmediatas.

---

### 7. HERRAMIENTAS ADICIONALES
- **Exportación a Excel**: Genera reportes en formato .xlsx listos para auditorías contables.
- **Plan de Cuentas**: Administración en el Back para crear nuevos rubros, contratistas o códigos contables.
- **Auditoría & Trazabilidad**: Registro cronológico de todas las altas, modificaciones y calibraciones de obras.

---
*Desarrollado para JPB SRL - Control Financiero & Gestión de Obras*
`;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(manualMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([manualMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Manual_Usuario_Grupo_Simetris_Control_Obras.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:bg-white print:text-black">
        
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-700">
              <BookOpen className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <span>Manual de Usuario & Guía del Cliente</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                  JPB SRL
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Documentación completa para entrega y capacitación a clientes y directores de obra
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
              title="Copiar texto del manual"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
              title="Descargar archivo Markdown"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Descargar .MD</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition shadow-md"
              title="Imprimir o guardar como PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Manual Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 print:p-0 print:overflow-visible text-slate-200 print:text-slate-900 bg-slate-900 print:bg-white">
          
          {/* Cover & Brand Presentation Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 print:border-b-2 print:border-slate-300 print:bg-none print:p-4">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold uppercase tracking-wider print:text-rose-700">
                Documento de Entrega a Clientes
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-100 print:text-slate-900 tracking-tight">
                MANUAL OPERATIVO DE GESTIÓN
              </h1>
              <p className="text-sm text-slate-400 print:text-slate-600 max-w-xl">
                Sistema de Control Financiero Bimonetario, Origen y Aplicación de Fondos, Contratistas y Desvíos de Obras.
              </p>
            </div>

            {/* JPB SRL Brand Logo */}
            <div className="p-3 bg-white rounded-2xl border border-slate-300 shadow-xl print:shadow-none print:border-slate-300">
              <JpbSrlLogo variant="card" size="md" />
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-2">
            <div className="p-4 bg-slate-800/50 print:bg-slate-100 rounded-xl border border-slate-700/50 print:border-slate-300">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase mb-1">
                <DollarSign className="h-4 w-4" /> Bimonetario
              </div>
              <p className="text-sm font-semibold text-slate-200 print:text-slate-800">Cálculo Dual en ARS y USD</p>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Conversión histórica con Tipo de Cambio propio por comprobante.
              </p>
            </div>

            <div className="p-4 bg-slate-800/50 print:bg-slate-100 rounded-xl border border-slate-700/50 print:border-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-1">
                <Hammer className="h-4 w-4" /> Contratos
              </div>
              <p className="text-sm font-semibold text-slate-200 print:text-slate-800">Centros de Costos Directos</p>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Control de Lázaro, Miguel, Walter, Marcelo, Carlitos y materiales.
              </p>
            </div>

            <div className="p-4 bg-slate-800/50 print:bg-slate-100 rounded-xl border border-slate-700/50 print:border-slate-300">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase mb-1">
                <TrendingUp className="h-4 w-4" /> Desvíos
              </div>
              <p className="text-sm font-semibold text-slate-200 print:text-slate-800">Monitoreo de Saldos</p>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Comparación instantánea entre Presupuesto Previsto vs Ejecutado.
              </p>
            </div>

            <div className="p-4 bg-slate-800/50 print:bg-slate-100 rounded-xl border border-slate-700/50 print:border-slate-300">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase mb-1">
                <FileSpreadsheet className="h-4 w-4" /> Automatización
              </div>
              <p className="text-sm font-semibold text-slate-200 print:text-slate-800">Importador Inteligente</p>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Sube archivos Excel (.xlsx/.xls) y repara inconsistencias en 1 clic.
              </p>
            </div>
          </div>

          {/* Section 1: Selector de Obras y Moneda */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2 print:text-amber-700">
              <span>1. Selección de Obra y Conmutador de Moneda</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 print:text-slate-700">
              <div className="p-4 bg-slate-800/40 print:bg-slate-50 rounded-xl border border-slate-800 print:border-slate-200 space-y-2">
                <p className="font-bold text-slate-100 print:text-slate-900 text-sm flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-amber-400" />
                  Navegación entre Obras
                </p>
                <p>
                  En la barra superior encontrarás el selector desplegable de proyectos:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 print:text-slate-600">
                  <li><strong>Visión Macro:</strong> Consolida todas las obras para los socios e inversores.</li>
                  <li><strong>Obra Individual (ej. Casa Fer y Mili):</strong> Muestra los números y contratistas específicos de dicha obra.</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-800/40 print:bg-slate-50 rounded-xl border border-slate-800 print:border-slate-200 space-y-2">
                <p className="font-bold text-slate-100 print:text-slate-900 text-sm flex items-center gap-1.5">
                  <ArrowRightLeft className="h-4 w-4 text-emerald-400" />
                  Conmutador Bimonetario ($ ARS / u$s USD)
                </p>
                <p>
                  Puedes alternar con un solo clic entre ver todos los reportes, tablas y gráficos en Pesos o en Dólares.
                </p>
                <p className="text-slate-400 print:text-slate-600">
                  Cada gasto e ingreso conserva su tipo de cambio real del día en que se realizó la operación.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Origen de Fondos */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2 print:text-emerald-700">
              <span>2. Módulo de Origen de Fondos (Ingresos & Aportes)</span>
            </h2>
            <div className="text-xs text-slate-300 print:text-slate-700 space-y-2">
              <p>
                En la pestaña <strong>Origen de Fondos (Ingresos)</strong> se registran todos los ingresos de dinero destinados a la obra:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-800 print:border-slate-200">
                  <span className="font-bold text-slate-200 print:text-slate-900 block mb-1">Aportes Propietarios</span>
                  <span className="text-slate-400 print:text-slate-600">Inyecciones directas de capital en efectivo o transferencias bancarias.</span>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-800 print:border-slate-200">
                  <span className="font-bold text-slate-200 print:text-slate-900 block mb-1">Ventas de Divisas (u$s)</span>
                  <span className="text-slate-400 print:text-slate-600">Liquidación de dólares a tipo de cambio específico para cubrir gastos en pesos.</span>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-800 print:border-slate-200">
                  <span className="font-bold text-slate-200 print:text-slate-900 block mb-1">Certificados y Canjes</span>
                  <span className="text-slate-400 print:text-slate-600">Cobranza por certificaciones de avance y compensación de materiales.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Aplicación de Fondos y Contratistas */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2 border-b border-slate-800 pb-2 print:text-blue-700">
              <span>3. Aplicación de Fondos & Contratos de Mano de Obra</span>
            </h2>
            <div className="text-xs text-slate-300 print:text-slate-700 space-y-2">
              <p>
                Los gastos de la obra se imputan a centros de costos específicos para tener trazabilidad total por contratista y rubro:
              </p>
              <div className="border border-slate-800 print:border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/80 print:bg-slate-200 text-slate-300 print:text-slate-800 font-bold">
                    <tr>
                      <th className="p-2.5">Contratista / Rubro</th>
                      <th className="p-2.5">Detalle del Contrato</th>
                      <th className="p-2.5 text-right">Presupuesto Base (ARS)</th>
                      <th className="p-2.5 text-center">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-slate-200 text-slate-300 print:text-slate-700">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-100 print:text-slate-900">Walter</td>
                      <td className="p-2.5">M.O y materiales con motor y filtro s/presupuesto</td>
                      <td className="p-2.5 text-right font-mono text-emerald-400 print:text-emerald-700 font-bold">$ 700.000</td>
                      <td className="p-2.5 text-center"><span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px]">Piscina / Equip.</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-100 print:text-slate-900">Lázaro (Demolición)</td>
                      <td className="p-2.5">M.O. demolición ($1.430.000 + adicional $277.400)</td>
                      <td className="p-2.5 text-right font-mono text-emerald-400 print:text-emerald-700 font-bold">$ 1.707.400</td>
                      <td className="p-2.5 text-center"><span className="px-2 py-0.5 rounded bg-red-950 text-red-300 text-[10px]">Demolición</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-100 print:text-slate-900">Lázaro (Albañilería)</td>
                      <td className="p-2.5">M.O. albañilería general s/presupuesto</td>
                      <td className="p-2.5 text-right font-mono text-emerald-400 print:text-emerald-700 font-bold">$ 4.600.000</td>
                      <td className="p-2.5 text-center"><span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px]">Albañilería</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-100 print:text-slate-900">Miguel</td>
                      <td className="p-2.5">M.O. plomería completa s/presupuesto</td>
                      <td className="p-2.5 text-right font-mono text-emerald-400 print:text-emerald-700 font-bold">$ 1.205.000</td>
                      <td className="p-2.5 text-center"><span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 text-[10px]">Inst. Sanitarias</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-100 print:text-slate-900">Marcelo Meneghello</td>
                      <td className="p-2.5">M.O. electricista s/presupuesto</td>
                      <td className="p-2.5 text-right font-mono text-emerald-400 print:text-emerald-700 font-bold">$ 461.000</td>
                      <td className="p-2.5 text-center"><span className="px-2 py-0.5 rounded bg-yellow-950 text-yellow-300 text-[10px]">Electricidad</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-100 print:text-slate-900">Carlitos</td>
                      <td className="p-2.5">M.O. pintura integral y techados</td>
                      <td className="p-2.5 text-right font-mono text-emerald-400 print:text-emerald-700 font-bold">s/ Avance</td>
                      <td className="p-2.5 text-center"><span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px]">Pintura & Techado</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 4: Presupuesto, Desvíos y Auto-calibración de Rubros */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-rose-400 flex items-center gap-2 border-b border-slate-800 pb-2 print:text-rose-700">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <span>4. Control de Presupuesto, Desvíos & Auto-Calibración de Rubros</span>
            </h2>
            <div className="text-xs text-slate-300 print:text-slate-700 space-y-3">
              <p>
                En la pestaña <strong>Presupuesto vs. Real & Desvíos</strong> se monitorea la salud financiera en moneda dura (<strong>u$s USD</strong>) y el costo unitario por metro cuadrado (<strong>u$s / m²</strong>):
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 print:text-slate-600">
                <li><strong>Presupuesto Meta (u$s):</strong> Objetivo económico general fijado al dar de alta la obra.</li>
                <li><strong>Costo Real Ejecutado (u$s):</strong> Suma consolidada de los comprobantes y pagos efectuados.</li>
                <li><strong>Desvío Neto (u$s):</strong> Diferencia entre lo ejecutado y lo presupuestado, alertando sobrecostos.</li>
                <li><strong>Precio por m² Presupuestado vs. Real:</strong> Ratio unitario calculado automáticamente sobre la superficie de la obra.</li>
              </ul>

              {/* Explanatory Box: Parámetros de Auto-calibración */}
              <div className="p-4 bg-slate-800/60 print:bg-slate-50 border border-slate-700/70 print:border-slate-300 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400 print:text-amber-700 font-bold text-sm">
                  <Calculator className="h-4 w-4" />
                  <span>¿Qué parámetros toma el sistema para la Auto-Calibración de Rubros?</span>
                </div>
                <p className="text-slate-300 print:text-slate-700 leading-relaxed">
                  Cuando se da de alta una obra con un presupuesto meta en dólares, o al pulsar el botón <strong>"Auto-calibrar Rubros"</strong>, el sistema distribuye el monto total entre los rubros activos de tipo egreso aplicando la siguiente <strong>matriz de ponderación estándar de la industria de la construcción</strong>:
                </p>

                <div className="border border-slate-700/80 print:border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 print:bg-slate-200 text-slate-200 print:text-slate-800 font-bold">
                      <tr>
                        <th className="p-2">Rubro / Categoría</th>
                        <th className="p-2">Códigos & Palabras Clave</th>
                        <th className="p-2 text-right">Peso Estimado</th>
                        <th className="p-2">Destino Típico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 print:divide-slate-200 text-slate-300 print:text-slate-700">
                      <tr>
                        <td className="p-2 font-bold text-slate-100 print:text-slate-900">Materiales e Insumos</td>
                        <td className="p-2 font-mono text-[11px] text-slate-400">MAT, Materiales, Áridos, Corralón</td>
                        <td className="p-2 text-right font-bold text-amber-400 print:text-amber-700">~ 35%</td>
                        <td className="p-2 text-slate-400 print:text-slate-600">Cemento, hierros, arena, ladrillos</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-100 print:text-slate-900">Mano de Obra & Gremios</td>
                        <td className="p-2 font-mono text-[11px] text-slate-400">MO, Albañilería, Demolición</td>
                        <td className="p-2 text-right font-bold text-amber-400 print:text-amber-700">~ 35%</td>
                        <td className="p-2 text-slate-400 print:text-slate-600">Contratistas, cuadrillas y jornales</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-100 print:text-slate-900">Estructura & Hormigón</td>
                        <td className="p-2 font-mono text-[11px] text-slate-400">ESTR, Estructura, Hormigón</td>
                        <td className="p-2 text-right font-bold text-emerald-400 print:text-emerald-700">~ 15%</td>
                        <td className="p-2 text-slate-400 print:text-slate-600">Hormigón elaborado, bases y losas</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-100 print:text-slate-900">Honorarios Profesionales</td>
                        <td className="p-2 font-mono text-[11px] text-slate-400">HON, Dirección, Proyecto</td>
                        <td className="p-2 text-right font-bold text-blue-400 print:text-blue-700">~ 10%</td>
                        <td className="p-2 text-slate-400 print:text-slate-600">Arquitectura, cálculo, agrimensura</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-100 print:text-slate-900">Aberturas & Carpintería</td>
                        <td className="p-2 font-mono text-[11px] text-slate-400">ABER, Abertura, Aluminio</td>
                        <td className="p-2 text-right font-bold text-slate-300">~ 8%</td>
                        <td className="p-2 text-slate-400 print:text-slate-600">Ventanas DVH, puertas, portones</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-100 print:text-slate-900">Instalación Sanitaria / Gas</td>
                        <td className="p-2 font-mono text-[11px] text-slate-400">SAN, PLO, Plomería, Gas</td>
                        <td className="p-2 text-right font-bold text-slate-300">~ 8%</td>
                        <td className="p-2 text-slate-400 print:text-slate-600">Cañerías, tanques, termofusión</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-100 print:text-slate-900">Pisos & Revestimientos</td>
                        <td className="p-2 font-mono text-[11px] text-slate-400">PIS, Revestimiento, Cerámico</td>
                        <td className="p-2 text-right font-bold text-slate-300">~ 8%</td>
                        <td className="p-2 text-slate-400 print:text-slate-600">Porcelanatos, zócalos y pegamentos</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-100 print:text-slate-900">Instalación Eléctrica</td>
                        <td className="p-2 font-mono text-[11px] text-slate-400">ELEC, Electricidad</td>
                        <td className="p-2 text-right font-bold text-slate-300">~ 7%</td>
                        <td className="p-2 text-slate-400 print:text-slate-600">Cables, tableros, térmicas</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-100 print:text-slate-900">Pintura & Terminaciones</td>
                        <td className="p-2 font-mono text-[11px] text-slate-400">PINT, Pintura, Yeso</td>
                        <td className="p-2 text-right font-bold text-slate-300">~ 6%</td>
                        <td className="p-2 text-slate-400 print:text-slate-600">Látex, impermeabilizantes, enduido</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-100 print:text-slate-900">Fletes, Logística & Permisos</td>
                        <td className="p-2 font-mono text-[11px] text-slate-400">FLET, LOG, PERM, Tasas</td>
                        <td className="p-2 text-right font-bold text-slate-300">~ 5% c/u</td>
                        <td className="p-2 text-slate-400 print:text-slate-600">Volquetes, derechos municipales</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px]">
                  <div className="p-2.5 bg-slate-900/60 print:bg-slate-100 rounded-lg border border-slate-700/60 print:border-slate-200">
                    <span className="font-bold text-amber-300 print:text-amber-800 block mb-0.5">1. Normalización Matemática al 100%</span>
                    <span className="text-slate-400 print:text-slate-600">El sistema totaliza los coeficientes de las categorías activas y normaliza la suma para que coincida exactamente con el 100% del Presupuesto Meta.</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 print:bg-slate-100 rounded-lg border border-slate-700/60 print:border-slate-200">
                    <span className="font-bold text-emerald-300 print:text-emerald-800 block mb-0.5">2. Edición Libre y Ajuste Fino</span>
                    <span className="text-slate-400 print:text-slate-600">Tras la calibración, el usuario puede editar manualmente el monto en dólares de cualquier rubro pulsando el ícono de edición de la tabla.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Importador Inteligente */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-purple-400 flex items-center gap-2 border-b border-slate-800 pb-2 print:text-purple-700">
              <span>5. Uso del Importador Inteligente de Excel</span>
            </h2>
            <div className="text-xs text-slate-300 print:text-slate-700 space-y-2">
              <p>
                Para cargar planillas de liquidación o extractos históricos en un solo paso:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 print:text-slate-600">
                <li>Haz clic en el botón <strong>"Importar Excel"</strong> en el encabezado.</li>
                <li>Selecciona la obra a la que se imputarán los registros.</li>
                <li>Arrastra o sube tu archivo <code>.xlsx</code> o <code>.xls</code> (soporta planillas unificadas o con hojas de Ingresos/Mano de Obra).</li>
                <li>El sistema detecta automáticamente los montos y cotizaciones en el texto (ej. <em>"Aporte Mily y Fer vta. u$s 7.500 tac 200"</em>).</li>
                <li>Si alguna fila requiere ajuste, puedes hacer clic en <strong>"⚡ Autocompletar y Validar Todo"</strong> o <strong>"Forzar Importación"</strong>.</li>
              </ol>
            </div>
          </div>

          {/* Section 6: Exportación y Seguridad Cloud */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2 print:text-slate-800">
              <span>6. Exportaciones y Respaldos Cloud en Tiempo Real</span>
            </h2>
            <div className="text-xs text-slate-300 print:text-slate-700 space-y-2">
              <p>
                - <strong>Exportación a Excel:</strong> Al hacer clic en el botón de descarga del encabezado, se genera un archivo Excel con todas las hojas (Ingresos, Egresos, Contratistas y Resumen).
                <br />
                - <strong>Sincronización Cloud:</strong> Todos los datos se guardan de forma instantánea y segura en Google Cloud Firestore, permitiendo que varios usuarios o directores consulten la información en tiempo real desde cualquier dispositivo.
              </p>
            </div>
          </div>

          {/* Manual Footer Brand */}
          <div className="pt-6 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 print:text-slate-600">
            <div className="flex items-center gap-3">
              <JpbSrlLogo size="sm" variant="badge" />
              <span className="font-bold text-slate-200">JPB SRL • Obras & Construcciones</span>
            </div>
            <p className="text-center sm:text-right">
              Plataforma para <strong>JPB SRL</strong>
              <br />
              Versión Operativa 2.5 • Control Financiero y Presupuestario de Obras
            </p>
          </div>

        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-400">
            Listo para entregar a clientes y contratistas en formato PDF o impreso.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition"
          >
            Cerrar Manual
          </button>
        </div>

      </div>
    </div>
  );
};
