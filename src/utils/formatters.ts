import { Currency } from '../types';

export const formatCurrency = (amount: number | undefined | null, currency: Currency = 'ARS'): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return currency === 'ARS' ? '$ 0,00' : 'u$s 0,00';
  }

  if (currency === 'USD') {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount).replace('USD', 'u$s');
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (amount: number | undefined | null, decimals: number = 2): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0,00';
  }
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

export const formatDisplayNumber = (value: number | string | undefined | null, decimals: number = 2): string => {
  const num = typeof value === 'number' ? value : parseArgentineNumber(value);
  if (isNaN(num) || num === 0) return '0,00';
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatInputLive = (val: string | number): string => {
  const num = typeof val === 'number' ? val : parseArgentineNumber(val);
  if (num <= 0) return '';
  // Check if integer or has decimals
  if (num % 1 === 0) {
    return new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 0,
    }).format(num);
  }
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const parseArgentineNumber = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  let str = String(value).trim();
  if (!str || str === '-' || str === 'N/A' || str === 'null' || str === 'undefined' || str === '$ -' || str === '$ -  ') return 0;
  
  // Clean currency symbols and special chars ($, u$s, usd, ARS, spaces, non-breaking spaces)
  str = str.replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ');
  str = str.replace(/[$\s]/g, '');
  str = str.replace(/u\$s/gi, '').replace(/usd/gi, '').replace(/ars/gi, '').replace(/us\$/gi, '').replace(/u\$d/gi, '');
  str = str.trim();
  if (!str) return 0;

  // Pattern: 1.430.000,50 (both dot and comma)
  if (str.includes(',') && str.includes('.')) {
    // If dot comes before comma (1.234,56)
    if (str.indexOf('.') < str.indexOf(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // If comma comes before dot (1,234.56)
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Only comma (e.g. 1500,50 or 1.500)
    // If multiple commas, it's thousands separator
    const commaCount = (str.match(/,/g) || []).length;
    if (commaCount > 1) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(',', '.');
    }
  } else if (str.includes('.')) {
    // Only dots (e.g. 7.500 or 150.000 or 175.50)
    const dotCount = (str.match(/\./g) || []).length;
    if (dotCount > 1) {
      // Multiple dots: definitely thousands separator (e.g. 1.250.000)
      str = str.replace(/\./g, '');
    } else {
      // Single dot: e.g. 7.500 (thousands in AR) vs 175.50 (decimal)
      // If exactly 3 digits after dot and before dot <= 3 digits, it's Argentine thousands (e.g. 7.500, 1.000, 150.000)
      if (/^\d{1,3}\.\d{3}$/.test(str)) {
        str = str.replace('.', '');
      }
      // Otherwise keep as decimal (e.g. 175.5 or 200.25)
    }
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr.toLowerCase().includes('fecha')) return '-';
  try {
    // Check if format is YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    // Check if DD/MM/YYYY
    const dParts = dateStr.split('/');
    if (dParts.length === 3) {
      return dateStr;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const parseToISO = (value: any): string => {
  if (value === undefined || value === null || value === '') {
    return new Date().toISOString().split('T')[0];
  }
  
  // 1. JS Date object
  if (value instanceof Date && !isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 2. Excel serial date number (e.g. 44119 = 2020-10-15)
  if (typeof value === 'number' && value > 25000 && value < 75000) {
    try {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const dateObj = new Date(excelEpoch.getTime() + value * 86400000);
      if (!isNaN(dateObj.getTime())) {
        const year = dateObj.getUTCFullYear();
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch {
      // ignore
    }
  }

  const dateStr = String(value).trim();
  if (!dateStr || dateStr.toLowerCase().includes('fecha')) {
    return new Date().toISOString().split('T')[0];
  }
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  // Handles DD/MM/YYYY or DD-MM-YYYY or MM/DD/YYYY
  const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
  if (parts.length === 3) {
    let day = parts[0].padStart(2, '0');
    let month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) year = '20' + year;
    // If first part is 4 digits, it's YYYY-MM-DD
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return `${year}-${month}-${day}`;
  }
  
  // Try fallback Date parse
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
};
