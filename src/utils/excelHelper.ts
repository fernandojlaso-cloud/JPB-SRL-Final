import * as XLSX from 'xlsx';
import { Transaction, Project, AccountCategory } from '../types';
import { parseArgentineNumber, parseToISO } from './formatters';

export interface ParsedRowResult {
  date: string;
  concept: string;
  type: 'ingreso' | 'egreso';
  categoryName: string;
  amountARS: number;
  exchangeRate: number;
  amountUSD: number;
  payerOrRecipient?: string;
  paymentMethod?: string;
  notes?: string;
  isValid: boolean;
  errors: string[];
}

/**
 * Downloads a sample Excel template for construction accounting
 */
export const downloadExcelTemplate = () => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Plantilla Unificada de Movimientos
  const templateData = [
    {
      'Fecha (DD/MM/AAAA)': '15/10/2021',
      'Tipo (Ingreso/Egreso)': 'Ingreso',
      'Rubro / Cuenta': 'Venta de Divisas (u$s)',
      'Concepto / Detalle': 'Aporte Mily y Fer (vta. u$s 4.400 t.c. 175,50)',
      'Monto en Pesos ($)': 772200,
      'Tipo de Cambio (t.c.)': 175.50,
      'Monto en Dólares (u$s)': 4400,
      'Cliente / Proveedor': 'Mily y Fer',
      'Medio de Pago': 'Transferencia',
      'Estado': 'Pagado',
    },
    {
      'Fecha (DD/MM/AAAA)': '09/11/2021',
      'Tipo (Ingreso/Egreso)': 'Egreso',
      'Rubro / Cuenta': 'Mano de Obra (M.O.)',
      'Concepto / Detalle': 'Walter M.O. y materiales c/mat y filtros / presupuesto $700.000',
      'Monto en Pesos ($)': 420000,
      'Tipo de Cambio (t.c.)': 146.00,
      'Monto en Dólares (u$s)': 2876.71,
      'Cliente / Proveedor': 'Walter Contratista',
      'Medio de Pago': 'Efectivo',
      'Estado': 'Pagado',
    },
    {
      'Fecha (DD/MM/AAAA)': '19/10/2021',
      'Tipo (Ingreso/Egreso)': 'Egreso',
      'Rubro / Cuenta': 'Materiales y Acopios',
      'Concepto / Detalle': 'Acopio Rogelio Fioce Techista M.O. y materiales s/presupuesto $590.000',
      'Monto en Pesos ($)': 490000,
      'Tipo de Cambio (t.c.)': 175.50,
      'Monto en Dólares (u$s)': 2792.02,
      'Cliente / Proveedor': 'Rogelio Fioce Techista',
      'Medio de Pago': 'Transferencia',
      'Estado': 'Pagado',
    },
    {
      'Fecha (DD/MM/AAAA)': '14/11/2021',
      'Tipo (Ingreso/Egreso)': 'Egreso',
      'Rubro / Cuenta': 'Honorarios y Dirección de Obra',
      'Concepto / Detalle': 'Pago Honorarios Emanuel Lizarraga anticipo 10% s/presupuesto u$s 450',
      'Monto en Pesos ($)': 67500,
      'Tipo de Cambio (t.c.)': 150.00,
      'Monto en Dólares (u$s)': 450,
      'Cliente / Proveedor': 'Arq. Emanuel Lizarraga',
      'Medio de Pago': 'Transferencia',
      'Estado': 'Pagado',
    },
    {
      'Fecha (DD/MM/AAAA)': '13/08/2021',
      'Tipo (Ingreso/Egreso)': 'Egreso',
      'Rubro / Cuenta': 'Logística, Fletes y Volquetes',
      'Concepto / Detalle': 'Pago 7 volquetes',
      'Monto en Pesos ($)': 38500,
      'Tipo de Cambio (t.c.)': 178.00,
      'Monto en Dólares (u$s)': 216.29,
      'Cliente / Proveedor': 'Volquetes del Sur',
      'Medio de Pago': 'Efectivo',
      'Estado': 'Pagado',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  // Column widths
  ws['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 45 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
  XLSX.writeFile(wb, 'Plantilla_Control_Financiero_Obra.xlsx');
};

/**
 * Downloads a sample Excel template for construction budgets / rubros
 */
export const downloadBudgetExcelTemplate = () => {
  const wb = XLSX.utils.book_new();

  const templateData = [
    {
      'Código': '101',
      'Rubro / Contratista': 'Mano de Obra (M.O.)',
      'Tipo (Egreso/Ingreso)': 'Egreso',
      'Presupuesto en Pesos ($)': 5000000,
      'Presupuesto en Dólares (u$s)': 28000,
      'Notas / Alcance': 'Presupuesto total estimado mano de obra contratada',
    },
    {
      'Código': '102',
      'Rubro / Contratista': 'Materiales y Acopios',
      'Tipo (Egreso/Ingreso)': 'Egreso',
      'Presupuesto en Pesos ($)': 8500000,
      'Presupuesto en Dólares (u$s)': 48000,
      'Notas / Alcance': 'Hierro, cemento, ladrillos, terminaciones',
    },
    {
      'Código': '103',
      'Rubro / Contratista': 'Honorarios y Dirección de Obra',
      'Tipo (Egreso/Ingreso)': 'Egreso',
      'Presupuesto en Pesos ($)': 2500000,
      'Presupuesto en Dólares (u$s)': 14000,
      'Notas / Alcance': 'Honorarios profesionales y supervisión técnica',
    },
    {
      'Código': '104',
      'Rubro / Contratista': 'Logística, Fletes y Volquetes',
      'Tipo (Egreso/Ingreso)': 'Egreso',
      'Presupuesto en Pesos ($)': 800000,
      'Presupuesto en Dólares (u$s)': 4500,
      'Notas / Alcance': 'Retiro de escombros y fletes a obra',
    },
    {
      'Código': '201',
      'Rubro / Contratista': 'Walter M.O. y materiales',
      'Tipo (Egreso/Ingreso)': 'Egreso',
      'Presupuesto en Pesos ($)': 1800000,
      'Presupuesto en Dólares (u$s)': 10000,
      'Notas / Alcance': 'Subcontratista Walter albañilería',
    },
    {
      'Código': '202',
      'Rubro / Contratista': 'Rogelio Fioce Techista',
      'Tipo (Egreso/Ingreso)': 'Egreso',
      'Presupuesto en Pesos ($)': 1200000,
      'Presupuesto en Dólares (u$s)': 6800,
      'Notas / Alcance': 'Subcontratista techos y zinguería',
    },
    {
      'Código': '301',
      'Rubro / Contratista': 'Aportes de Capital / Comitente',
      'Tipo (Egreso/Ingreso)': 'Ingreso',
      'Presupuesto en Pesos ($)': 19000000,
      'Presupuesto en Dólares (u$s)': 105000,
      'Notas / Alcance': 'Fondo total previsto comitente',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 35 },
    { wch: 22 },
    { wch: 25 },
    { wch: 25 },
    { wch: 45 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Presupuesto_Obra');
  XLSX.writeFile(wb, 'Plantilla_Presupuesto_Obra.xlsx');
};

export interface ParsedBudgetRowResult {
  code: string;
  categoryName: string;
  type: 'ingreso' | 'egreso';
  budgetedARS: number;
  budgetedUSD: number;
  notes?: string;
  matchedCategoryId?: string;
  isValid: boolean;
  errors: string[];
}

/**
 * Parses an Excel or CSV file buffer specifically for Budgets and Cost Centers
 */
export const parseBudgetUploadedFile = (
  data: ArrayBuffer,
  defaultCategories: AccountCategory[] = []
): ParsedBudgetRowResult[] => {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: 'array', cellDates: true, cellNF: true });
  } catch {
    throw new Error('No se pudo abrir el archivo Excel de presupuesto. Verifica que no esté dañado.');
  }

  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('El archivo Excel no contiene ninguna hoja válida.');
  }

  const results: ParsedBudgetRowResult[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: '' });
    const formattedRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });

    if (!rawRows || rawRows.length < 1) continue;

    // Find header row
    let headerIndex = 0;
    let highestScore = 0;

    for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
      const row = rawRows[i];
      if (!Array.isArray(row) || row.length === 0) continue;
      let score = 0;
      const words = row.map(c => normalizeText(c));
      for (const w of words) {
        if (!w) continue;
        if (w.includes('rubro') || w.includes('item') || w.includes('cuenta') || w.includes('contratista') || w.includes('descripcion')) score += 5;
        if (w.includes('presupuesto') || w.includes('monto') || w.includes('importe') || w.includes('total') || w === '$' || w === 'ars') score += 5;
        if (w.includes('u$s') || w.includes('usd') || w.includes('dolar')) score += 5;
        if (w.includes('codigo') || w.includes('cod') || w === 'nro') score += 4;
        if (w.includes('tipo') || w.includes('notas') || w.includes('observaciones')) score += 2;
      }
      if (score > highestScore) {
        highestScore = score;
        headerIndex = i;
      }
    }

    const headerRow = rawRows[headerIndex] || [];
    const headers = Array.isArray(headerRow) ? headerRow.map(h => normalizeText(h)) : [];

    const findColIdx = (keywords: string[]) => {
      for (const kw of keywords) {
        const norm = normalizeText(kw);
        const idx = headers.findIndex(h => h.includes(norm));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const codeIdx = findColIdx(['codigo', 'cod', 'nro', 'item']);
    const rubroIdx = findColIdx(['rubro', 'cuenta', 'contratista', 'nombre', 'descripcion', 'concepto']);
    const typeIdx = findColIdx(['tipo', 'origen', 'clasificacion']);
    const arsIdx = findColIdx(['pesos', 'presupuesto $', 'presupuesto ars', 'monto $', 'importe $', '$', 'ars', 'presupuesto en pesos']);
    const usdIdx = findColIdx(['dolares', 'presupuesto u$s', 'presupuesto usd', 'monto u$s', 'importe u$s', 'u$s', 'usd', 'presupuesto en dolares']);
    const notesIdx = findColIdx(['notas', 'observaciones', 'alcance', 'detalle']);

    for (let r = headerIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      const fRow = formattedRows[r] || [];
      if (!Array.isArray(row) || row.length === 0) continue;

      const rowStr = row.map(c => normalizeText(c)).join(' ');
      if (!rowStr || rowStr.includes('total general') || rowStr.includes('subtotal')) continue;

      const codeRaw = codeIdx !== -1 ? String(row[codeIdx] || '').trim() : '';
      const rubroRaw = rubroIdx !== -1 ? String(row[rubroIdx] || '').trim() : '';
      if (!rubroRaw && !codeRaw) continue;

      const categoryName = rubroRaw || `Rubro ${codeRaw}`;
      const code = codeRaw || `RUB-${r}`;

      // Extract ARS and USD
      let budgetedARS = 0;
      let budgetedUSD = 0;

      if (arsIdx !== -1 && row[arsIdx] !== undefined) {
        budgetedARS = typeof row[arsIdx] === 'number' ? row[arsIdx] : parseArgentineNumber(fRow[arsIdx] || row[arsIdx]);
      }
      if (usdIdx !== -1 && row[usdIdx] !== undefined) {
        budgetedUSD = typeof row[usdIdx] === 'number' ? row[usdIdx] : parseArgentineNumber(fRow[usdIdx] || row[usdIdx]);
      }

      // Auto-fallback if one is provided
      if (budgetedARS <= 0 && budgetedUSD <= 0) {
        budgetedARS = 0;
        budgetedUSD = 0;
      }

      const typeRaw = typeIdx !== -1 ? normalizeText(row[typeIdx]) : '';
      const type: 'ingreso' | 'egreso' = typeRaw.includes('ingreso') || typeRaw.includes('aporte') ? 'ingreso' : 'egreso';
      const notes = notesIdx !== -1 ? String(row[notesIdx] || '').trim() : '';

      // Match category
      const matchedCat = defaultCategories.find(c => {
        const cCode = normalizeText(c.code);
        const cName = normalizeText(c.name);
        const targetName = normalizeText(categoryName);
        const targetCode = normalizeText(code);
        return (targetCode && cCode === targetCode) || (targetName && cName.includes(targetName)) || (targetName && targetName.includes(cName));
      });

      results.push({
        code,
        categoryName,
        type,
        budgetedARS,
        budgetedUSD,
        notes,
        matchedCategoryId: matchedCat?.id,
        isValid: true,
        errors: [],
      });
    }
  }

  return results;
};

/**
 * Helper to normalize string for comparison (removes accents, lowercase, trim)
 * Guaranteed to NEVER return null/undefined and always return a safe string.
 */
const normalizeText = (text: any): string => {
  if (text === undefined || text === null) return '';
  try {
    return String(text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  } catch {
    return '';
  }
};

/**
 * Parses an Excel or CSV file buffer with ultra-resilient multi-strategy extraction
 */
export const parseUploadedFile = (
  data: ArrayBuffer,
  defaultCategories: AccountCategory[] = []
): ParsedRowResult[] => {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: 'array', cellDates: true, cellNF: true });
  } catch (e: any) {
    throw new Error('No se pudo abrir el archivo Excel. Verifica que no esté dañado.');
  }

  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('El archivo Excel no contiene ninguna hoja válida.');
  }

  const results: ParsedRowResult[] = [];

  // Iterate over all sheets in the workbook
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert to 2D array of raw values (numbers as floats, dates, strings)
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: '' });
    // Also get formatted string version for fallbacks
    const formattedRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });

    if (!rawRows || rawRows.length < 1) continue;

    const normSheetName = normalizeText(sheetName);
    const sheetIsIncome = normSheetName.includes('ingreso') || normSheetName.includes('origen') || normSheetName.includes('aporte') || normSheetName.includes('venta');

    // Score header rows to find the true table header row
    let bestHeaderIndex = -1;
    let highestScore = 0;

    for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
      const row = rawRows[i];
      if (!Array.isArray(row) || row.length === 0) continue;
      
      let score = 0;
      const rowWords = row.map(c => normalizeText(c));

      for (const w of rowWords) {
        if (!w) continue;
        if (w.includes('fecha') || w.includes('date') || w === 'fec' || w === 'dia') score += 5;
        if (w.includes('concepto') || w.includes('detalle') || w.includes('descripcion') || w.includes('movimiento') || w.includes('motivo')) score += 5;
        if (w.includes('monto') || w.includes('importe') || w.includes('pesos') || w.includes('total') || w === '$' || w === 'ars' || w.includes('ingreso') || w.includes('egreso') || w.includes('gasto')) score += 5;
        if (w.includes('u$s') || w.includes('usd') || w.includes('dolar') || w.includes('dolares') || w === 'u$d' || w === 'us$') score += 5;
        if (w.includes('tc') || w.includes('t.c') || w.includes('tipo de cambio') || w.includes('t/c') || w.includes('cotiz') || w.includes('cambio')) score += 4;
        if (w.includes('rubro') || w.includes('cuenta') || w.includes('categoria') || w.includes('subrubro') || w.includes('item')) score += 3;
        if (w.includes('proveedor') || w.includes('cliente') || w.includes('destinatario') || w.includes('pagado') || w.includes('aportante')) score += 3;
        if (w.includes('medio') || w.includes('forma de pago') || w.includes('pago')) score += 2;
      }

      if (score > highestScore) {
        highestScore = score;
        bestHeaderIndex = i;
      }
    }

    // Determine header row index
    let headerIndex = highestScore >= 3 ? bestHeaderIndex : 0;
    const headerRow = rawRows[headerIndex] || [];
    const headers = Array.isArray(headerRow) ? headerRow.map((h: any) => normalizeText(h)) : [];

    // Safe column finder helper
    const findColIdx = (exactMatches: string[], partialKeywords: string[]) => {
      const normExact = exactMatches.map(k => normalizeText(k));
      const normPartial = partialKeywords.map(k => normalizeText(k));

      // 1. Try exact match
      const exactIdx = headers.findIndex(h => h && normExact.includes(h));
      if (exactIdx !== -1) return exactIdx;

      // 2. Try partial match
      return headers.findIndex(h => {
        if (!h) return false;
        return normPartial.some(k => h.includes(k));
      });
    };

    const fechaIdx = findColIdx(
      ['fecha', 'date', 'fec', 'dia'],
      ['fecha', 'date', 'dia']
    );

    const tipoIdx = findColIdx(
      ['tipo', 'origen', 'aplicacion', 'movimiento', 'tipo mov'],
      ['tipo', 'origen', 'aplicacion']
    );

    const rubroIdx = findColIdx(
      ['rubro', 'cuenta', 'categoria', 'subrubro', 'item'],
      ['rubro', 'cuenta', 'categoria', 'item']
    );

    const conceptoIdx = findColIdx(
      ['concepto', 'detalle', 'descripcion', 'proveedor / detalle', 'movimiento', 'observacion', 'gasto', 'motivo'],
      ['concepto', 'detalle', 'descripcion', 'observacion', 'motivo']
    );

    // Dedicated Ingreso vs Egreso columns
    const ingresoColIdx = headers.findIndex(h => {
      if (!h) return false;
      if (h.includes('u$s') || h.includes('usd') || h.includes('tc')) return false;
      return h === 'ingreso' || h === 'ingresos' || h === 'entrada' || h === 'entradas' || h === 'credito' || h === 'origen' || h.includes('ingreso');
    });

    const egresoColIdx = headers.findIndex(h => {
      if (!h) return false;
      if (h.includes('u$s') || h.includes('usd') || h.includes('tc')) return false;
      return h === 'egreso' || h === 'egresos' || h === 'salida' || h === 'salidas' || h === 'debito' || h === 'gasto' || h === 'gastos' || h === 'pago' || h === 'pagos' || h.includes('egreso') || h.includes('gasto');
    });

    // Monto ARS
    let montoARSIdx = headers.findIndex(h => {
      if (!h) return false;
      if (h.includes('u$s') || h.includes('usd') || h.includes('us$') || h.includes('dolar')) return false;
      if (h.includes('tc') || h.includes('t.c') || h.includes('tipo de cambio') || h.includes('cotiz')) return false;
      if (h === 'saldo' || h.includes('saldo')) return false;
      return (
        h === '$' ||
        h === 'pesos' ||
        h === 'monto' ||
        h === 'importe' ||
        h === 'total' ||
        h === 'ars' ||
        h.includes('monto') ||
        h.includes('importe') ||
        h.includes('pesos') ||
        h.includes('total $') ||
        h.includes('$') ||
        h.includes('ars')
      );
    });

    // Monto USD
    let montoUSDIdx = headers.findIndex(h => {
      if (!h) return false;
      if (h.includes('tc') || h.includes('t.c') || h.includes('tipo de cambio') || h.includes('cotiz')) return false;
      return (
        h === 'u$s' ||
        h === 'usd' ||
        h === 'us$' ||
        h === 'u$d' ||
        h === 'dolar' ||
        h === 'dolares' ||
        h.includes('u$s') ||
        h.includes('usd') ||
        h.includes('us$') ||
        h.includes('u$d') ||
        h.includes('dolar') ||
        h.includes('dolares')
      );
    });

    // Tipo de Cambio
    const tcIdx = headers.findIndex(h => {
      if (!h) return false;
      return (
        h === 'tc' ||
        h === 't.c.' ||
        h === 't.c' ||
        h === 't/c' ||
        h === 'cotiz' ||
        h === 'cotizacion' ||
        h === 'cambio' ||
        h.includes('tc') ||
        h.includes('t.c') ||
        h.includes('tipo de cambio') ||
        h.includes('cotiz') ||
        h.includes('cambio')
      );
    });

    const provIdx = findColIdx(
      ['proveedor', 'cliente', 'destinatario', 'pagado a', 'aportante', 'beneficiario', 'responsable'],
      ['proveedor', 'destinatario', 'cliente', 'pagado', 'responsable']
    );

    const medioIdx = findColIdx(
      ['medio', 'forma de pago', 'pago', 'cuenta bancaria', 'canal'],
      ['medio', 'forma de pago', 'cuenta']
    );

    const startRow = highestScore >= 3 ? headerIndex + 1 : 0;

    for (let i = startRow; i < rawRows.length; i++) {
      const row = rawRows[i];
      const fRow = formattedRows[i] || [];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      const errors: string[] = [];

      // Extract concept/detail
      let conceptRaw = '';
      if (conceptoIdx !== -1 && row[conceptoIdx] !== undefined && String(row[conceptoIdx]).trim() !== '') {
        conceptRaw = row[conceptoIdx];
      } else if (rubroIdx !== -1 && row[rubroIdx] !== undefined && String(row[rubroIdx]).trim() !== '') {
        conceptRaw = row[rubroIdx];
      } else if (row[1] !== undefined && String(row[1]).trim() !== '') {
        conceptRaw = row[1];
      } else if (row[0] !== undefined) {
        conceptRaw = row[0];
      }

      const concept = String(conceptRaw || '').trim();
      if (!concept) continue; // Skip completely empty lines

      const normConcept = normalizeText(concept);
      
      // Ignore summary / total rows
      if (
        normConcept === 'total' || 
        normConcept === 'totales' || 
        normConcept === 'subtotal' || 
        normConcept === 'saldo' || 
        normConcept.startsWith('total ') ||
        normConcept.startsWith('resumen') ||
        normConcept.startsWith('saldo ')
      ) {
        continue;
      }

      // Ignore rows that are actually header copies
      const rowStrings = row.map(c => normalizeText(c));
      const hasHeaderKeywords = rowStrings.some(s => s === 'fecha' || s === 'date') && 
                                rowStrings.some(s => s === 'concepto' || s === 'detalle' || s.includes('monto') || s.includes('importe') || s.includes('rubro'));
      if (hasHeaderKeywords || normConcept === 'concepto' || normConcept === 'detalle' || normConcept === 'fecha' || normConcept.includes('fecha concepto')) {
        continue;
      }

      // Extract date safely
      const dateRaw = fechaIdx !== -1 && row[fechaIdx] !== undefined && row[fechaIdx] !== '' ? row[fechaIdx] : row[0];
      const normDateStr = normalizeText(dateRaw);
      if (normDateStr === 'fecha' || normDateStr === 'date') {
        continue;
      }
      const date = parseToISO(dateRaw);

      // Extract type & category
      let type: 'ingreso' | 'egreso' = sheetIsIncome ? 'ingreso' : 'egreso';
      const typeRaw = tipoIdx !== -1 ? normalizeText(row[tipoIdx]) : '';
      let categoryName = rubroIdx !== -1 && row[rubroIdx] !== undefined ? String(row[rubroIdx]).trim() : '';

      // Check if specific Ingreso / Egreso column had values
      let valIngreso = ingresoColIdx !== -1 ? (parseArgentineNumber(row[ingresoColIdx]) || parseArgentineNumber(fRow[ingresoColIdx])) : 0;
      let valEgreso = egresoColIdx !== -1 ? (parseArgentineNumber(row[egresoColIdx]) || parseArgentineNumber(fRow[egresoColIdx])) : 0;

      if (valIngreso > 0 && valEgreso === 0) {
        type = 'ingreso';
      } else if (valEgreso > 0 && valIngreso === 0) {
        type = 'egreso';
      } else if (
        typeRaw.includes('ingreso') || 
        typeRaw.includes('origen') || 
        typeRaw.includes('aporte') || 
        normConcept.includes('aporte') || 
        normConcept.includes('vta. u$s') ||
        normConcept.includes('vta u$s') ||
        normConcept.includes('venta divisas') ||
        normConcept.includes('cobro') ||
        normConcept.includes('canje')
      ) {
        type = 'ingreso';
      } else if (typeRaw.includes('egreso') || typeRaw.includes('aplicacion') || typeRaw.includes('gasto') || typeRaw.includes('pago')) {
        type = 'egreso';
      }

      // Guess category from concept or sheet name if not provided
      if (!categoryName) {
        const lowerC = normConcept;
        if (normSheetName.includes('mano de obra') || normSheetName.includes('m.o')) {
          categoryName = 'Mano de Obra (M.O.)';
        } else if (normSheetName.includes('material')) {
          categoryName = 'Materiales y Acopios';
        } else if (type === 'ingreso') {
          if (lowerC.includes('vta') || lowerC.includes('u$s') || lowerC.includes('dolar') || lowerC.includes('divisa')) {
            categoryName = 'Venta de Divisas (u$s)';
          } else if (lowerC.includes('tarjeta')) {
            categoryName = 'Pagos con Tarjeta / Terceros';
          } else {
            categoryName = 'Aporte de Propietarios / Socios';
          }
        } else {
          // Specific contractor / cost center matching
          if (lowerC.includes('walter') || (lowerC.includes('motor') && lowerC.includes('filtro'))) {
            categoryName = 'M.O. y Mat. - Motor y Filtro (Walter)';
          } else if (lowerC.includes('lazaro') && lowerC.includes('demolicion')) {
            categoryName = 'M.O. Demolición (Lázaro)';
          } else if (lowerC.includes('lazaro') || (lowerC.includes('albanil') && !lowerC.includes('miguel'))) {
            categoryName = 'M.O. Albañilería (Lázaro)';
          } else if (lowerC.includes('miguel') || lowerC.includes('plameria') || lowerC.includes('plomeria') || lowerC.includes('plomero')) {
            categoryName = 'M.O. Plomería Completa (Miguel)';
          } else if (lowerC.includes('marcelo') || lowerC.includes('meneghello') || lowerC.includes('electric')) {
            categoryName = 'M.O. Electricista (Marcelo Meneghello)';
          } else if (lowerC.includes('carlitos') || lowerC.includes('pintura') || lowerC.includes('techado')) {
            categoryName = 'M.O. Pintura y Techados (Carlitos)';
          } else if (lowerC.includes('m.o') || lowerC.includes('mano de obra')) {
            categoryName = 'Mano de Obra (M.O.)';
          } else if (lowerC.includes('acopio') || lowerC.includes('material') || lowerC.includes('ceramica') || lowerC.includes('abertura') || lowerC.includes('caldera') || lowerC.includes('canilla') || lowerC.includes('cemento') || lowerC.includes('hierro') || lowerC.includes('corralon')) {
            categoryName = 'Materiales y Acopios';
          } else if (lowerC.includes('honorarios') || lowerC.includes('direccion') || lowerC.includes('arq') || lowerC.includes('ing.')) {
            categoryName = 'Honorarios y Dirección de Obra';
          } else if (lowerC.includes('derechos') || lowerC.includes('visado') || lowerC.includes('permiso') || lowerC.includes('plano') || lowerC.includes('tasa') || lowerC.includes('municipal')) {
            categoryName = 'Derechos de Construcción y Tasas';
          } else if (lowerC.includes('volquete') || lowerC.includes('flete') || lowerC.includes('transporte') || lowerC.includes('logistica')) {
            categoryName = 'Logística, Fletes y Volquetes';
          } else {
            categoryName = 'Gastos Generales de Obra';
          }
        }
      }

      // Auto-detect contractor/payer if not present in column
      let detectedPayer = provIdx !== -1 && row[provIdx] !== undefined ? String(row[provIdx]).trim() : '';
      if (!detectedPayer) {
        const lowerC = normConcept;
        if (lowerC.includes('walter')) detectedPayer = 'Walter';
        else if (lowerC.includes('lazaro')) detectedPayer = 'Lázaro';
        else if (lowerC.includes('miguel')) detectedPayer = 'Miguel';
        else if (lowerC.includes('marcelo meneghello') || lowerC.includes('meneghello')) detectedPayer = 'Marcelo Meneghello';
        else if (lowerC.includes('carlitos')) detectedPayer = 'Carlitos';
        else if (lowerC.includes('mily') || lowerC.includes('fer')) detectedPayer = 'Mily y Fer';
      }

      // Parse amounts & exchange rate directly from detected columns (checking both raw and formatted values)
      let amountARS = 0;
      if (valIngreso > 0 && type === 'ingreso') {
        amountARS = valIngreso;
      } else if (valEgreso > 0 && type === 'egreso') {
        amountARS = valEgreso;
      } else if (montoARSIdx !== -1) {
        amountARS = parseArgentineNumber(row[montoARSIdx]) || parseArgentineNumber(fRow[montoARSIdx]) || 0;
      }

      let exchangeRate = tcIdx !== -1 ? (parseArgentineNumber(row[tcIdx]) || parseArgentineNumber(fRow[tcIdx]) || 0) : 0;
      let amountUSD = montoUSDIdx !== -1 ? (parseArgentineNumber(row[montoUSDIdx]) || parseArgentineNumber(fRow[montoUSDIdx]) || 0) : 0;

      // 1. SMART FALLBACK: Extract from Concept Text
      // Matches "vta. u$s 4.400", "u$s 7.500", "USD 4400", "u$s 4,400"
      const usdMatch = concept.match(/(?:vta\.?\s*|canje\s*|ap\.?\s*)?(?:u\$s|usd|us\$|u\$d|u\$|dolares|dolar)\s*[:=]?\s*([0-9\.\,]+)/i);
      if (usdMatch && usdMatch[1]) {
        const parsedUSD = parseArgentineNumber(usdMatch[1]);
        if (parsedUSD > 0 && amountUSD === 0) {
          amountUSD = parsedUSD;
        }
      }

      // Matches "tac 175,50", "t.c. 175.50", "tc 200", "t/c 180", "cotiz 175", "cambio 190"
      const tcMatch = concept.match(/(?:tac|t\.c\.|tc|t\/c|cambio|cotiz(?:acion)?)\s*[:=]?\s*([0-9\.\,]+)/i);
      if (tcMatch && tcMatch[1]) {
        const parsedTC = parseArgentineNumber(tcMatch[1]);
        if (parsedTC > 0 && (exchangeRate <= 1 || exchangeRate === 0)) {
          exchangeRate = parsedTC;
        }
      }

      // Matches ARS in concept text: "presupuesto $700.000", "$ 420.000", "monto $ 150000"
      const arsMatch = concept.match(/(?:presupuesto|monto|importe|total|\$)\s*[:=]?\s*\$?\s*([0-9\.\,]+)/i);
      if (arsMatch && arsMatch[1] && amountARS === 0) {
        const parsedARS = parseArgentineNumber(arsMatch[1]);
        if (parsedARS > 0) {
          amountARS = parsedARS;
        }
      }

      // 2. SMART FALLBACK: Scan all numeric cells across the row if amounts are still 0
      if (amountARS === 0 && amountUSD === 0) {
        const numericValues: number[] = [];
        row.forEach((cellVal, colIdx) => {
          if (colIdx === fechaIdx) return;
          const parsed = parseArgentineNumber(cellVal) || parseArgentineNumber(fRow[colIdx]);
          if (parsed > 0) {
            numericValues.push(parsed);
          }
        });

        if (numericValues.length === 1) {
          if (numericValues[0] >= 10000 || type === 'egreso') {
            amountARS = numericValues[0];
          } else {
            amountUSD = numericValues[0];
          }
        } else if (numericValues.length >= 2) {
          // Identify TC (usually between 50 and 3000)
          const potentialTC = numericValues.find(n => n >= 50 && n <= 3000);
          if (potentialTC && (exchangeRate <= 1 || exchangeRate === 0)) {
            exchangeRate = potentialTC;
          }

          const otherNums = numericValues.filter(n => n !== exchangeRate);
          if (otherNums.length > 0) {
            const maxNum = Math.max(...otherNums);
            const minNum = Math.min(...otherNums);
            if (maxNum > minNum && minNum > 0) {
              amountARS = maxNum;
              amountUSD = minNum;
            } else {
              amountARS = maxNum;
            }
          }
        }
      }

      // 3. Mathematical Recalculation & Cross-balancing
      if (exchangeRate <= 0) {
        exchangeRate = 1;
      }

      if (amountARS > 0 && exchangeRate > 1 && amountUSD === 0) {
        amountUSD = Math.round((amountARS / exchangeRate) * 100) / 100;
      } else if (amountUSD > 0 && exchangeRate > 1 && amountARS === 0) {
        amountARS = Math.round(amountUSD * exchangeRate * 100) / 100;
      } else if (amountARS > 0 && amountUSD > 0 && exchangeRate <= 1) {
        exchangeRate = Math.round((amountARS / amountUSD) * 100) / 100;
      } else if (amountARS > 0 && amountUSD === 0 && exchangeRate === 1) {
        amountUSD = amountARS; // fallback 1:1 if no TC
      } else if (amountUSD > 0 && amountARS === 0 && exchangeRate === 1) {
        amountARS = amountUSD;
      }

      // Final validity check
      if (amountARS <= 0 && amountUSD <= 0) {
        // Fallback default amount so row is never strictly blocked
        amountARS = 1;
        amountUSD = 1;
        errors.push('Monto autocompletado');
      }

      const payerOrRecipient = (provIdx !== -1 && row[provIdx] !== undefined && String(row[provIdx]).trim()) ? String(row[provIdx]).trim() : detectedPayer;
      const paymentMethod = medioIdx !== -1 && row[medioIdx] !== undefined && String(row[medioIdx]).trim() ? String(row[medioIdx]).trim() : 'Transferencia';

      results.push({
        date,
        concept,
        type,
        categoryName,
        amountARS,
        exchangeRate: exchangeRate || 1,
        amountUSD,
        payerOrRecipient,
        paymentMethod,
        isValid: true,
        errors,
      });
    }
  }

  return results;
};

/**
 * Export current transactions list to Excel
 */
export const exportTransactionsToExcel = (
  transactions: Transaction[],
  projects: Project[],
  categories: AccountCategory[],
  fileName = 'JPB_SRL_Control_Financiero.xlsx'
) => {
  const wb = XLSX.utils.book_new();

  const dataRows = transactions.map((t, idx) => {
    const project = projects.find(p => p.id === t.projectId);
    const category = categories.find(c => c.id === t.categoryId);

    return {
      'N°': idx + 1,
      'Fecha': t.date,
      'Obra': project ? project.name : t.projectId,
      'Tipo': t.type === 'ingreso' ? 'Origen de Fondos (Ingreso)' : 'Aplicación de Fondos (Egreso)',
      'Rubro / Cuenta': category ? category.name : 'Sin categorizar',
      'Concepto': t.concept,
      'Monto $ (ARS)': t.amountARS,
      'Tipo de Cambio (t.c.)': t.exchangeRate,
      'Monto u$s (USD)': t.amountUSD,
      'Destinatario / Pagador': t.payerOrRecipient || '-',
      'Medio de Pago': t.paymentMethod || 'Transferencia',
      'Estado': t.status || 'pagado',
    };
  });

  const ws = XLSX.utils.json_to_sheet(dataRows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 28 },
    { wch: 26 },
    { wch: 28 },
    { wch: 45 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 24 },
    { wch: 16 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
  XLSX.writeFile(wb, fileName);
};
