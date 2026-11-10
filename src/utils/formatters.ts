import { RespondenData } from '../types/rekonda';

/**
 * Formats a number to Indonesian standard format:
 * Thousands separator: dot (.)
 * Decimal separator: comma (,)
 */
export function formatRupiahNumber(val: number, decimals: number = 0): string {
  if (val === undefined || val === null || isNaN(val)) return '-';
  if (val === 0) return '0';
  
  const fixed = val.toFixed(decimals);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.join(',');
}

export function formatRupiahCurrency(val: number): string {
  if (val === undefined || val === null || isNaN(val) || val === 0) return 'Rp 0';
  return `Rp ${formatRupiahNumber(val, 0)}`;
}

export function formatPercent(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '0,00';
  return val.toFixed(2).replace('.', ',');
}

/**
 * Calculate mean, standard deviation, and Coefficient of Variation (CV)
 * across respondent prices in the same regency/city.
 */
export function calculateStats(values: number[]): {
  mean: number;
  sd: number;
  cv: number;
} {
  const filtered = values.filter((v) => typeof v === 'number' && !isNaN(v) && v > 0);
  if (filtered.length === 0) {
    return { mean: 0, sd: 0, cv: 0 };
  }
  const mean = filtered.reduce((acc, curr) => acc + curr, 0) / filtered.length;
  if (filtered.length === 1) {
    return { mean: Math.round(mean), sd: 0, cv: 0 };
  }
  const variance = filtered.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (filtered.length - 1);
  const sd = Math.sqrt(variance);
  const cv = (sd / mean) * 100;
  return {
    mean: Math.round(mean),
    sd: Math.round(sd),
    cv: parseFloat(cv.toFixed(2))
  };
}

/**
 * Get the most frequently occurring brand (mode) among respondents
 */
export function getDominantBrand(respondents: RespondenData[], fallbackDefault: string = 'Standar SNI'): string {
  if (!respondents || respondents.length === 0) return fallbackDefault;
  
  const countMap: Record<string, number> = {};
  respondents.forEach((r) => {
    const brand = (r.merk || '').trim();
    if (brand) {
      countMap[brand] = (countMap[brand] || 0) + 1;
    }
  });

  let maxCount = 0;
  let dominant = fallbackDefault;
  for (const [brand, count] of Object.entries(countMap)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = brand;
    }
  }

  return dominant;
}
