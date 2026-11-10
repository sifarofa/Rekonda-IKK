import * as XLSX from 'xlsx';
import { KabupatenRekon, RespondenData } from '../types/rekonda';
import { calculateStats, getDominantBrand } from './formatters';

export interface ComparisonItem {
  kode: string;
  nama: string;
  oldValue: number;
  newValue: number;
  diff: number;
  percentDiff: number;
  oldRasio: number;
  newRasio: number;
  quartersDetail: string;
  respondentCount?: number;
}

export interface ParseResult {
  updatedList: KabupatenRekon[];
  comparison: ComparisonItem[];
  totalRows: number;
  affectedKabCount: number;
  detectedCommodities: string[];
  rawRows: any[];
}

/**
 * Robust price parser:
 * Handles numbers and various Indonesian / International string number formats:
 * - 135000
 * - "135,000"
 * - "135.000"
 * - "183,400,312"
 * - "183.400.312"
 * - "Rp 135.000"
 */
export function parsePrice(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);

  let s = String(val).trim();
  if (s === '' || s === '-' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return 0;

  // Remove currency prefix and characters other than digits, dot, comma, minus
  s = s.replace(/[^0-9.,-]/g, '');
  if (!s) return 0;

  // Handle thousand and decimal separators
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    // Determine which is thousand separator
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // Indonesian format: 135.000,00 -> remove dot, replace comma with dot
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 135,000.00 -> remove comma
      s = s.replace(/,/g, '');
    }
  } else if (hasComma && !hasDot) {
    const parts = s.split(',');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      // Thousands separator: 135,000 or 183,400,312
      s = s.replace(/,/g, '');
    } else if (parts.length === 2 && parts[parts.length - 1].length <= 2) {
      // Decimal: 135,5
      s = `${parts[0]}.${parts[1]}`;
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasDot && !hasComma) {
    const parts = s.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      // Thousands separator: 135.000 or 183.400.312
      s = s.replace(/\./g, '');
    }
  }

  const num = parseFloat(s);
  return isNaN(num) ? 0 : Math.round(num);
}

/**
 * Reads an Excel file or CSV and returns an array of objects
 */
export async function parseFileToRows(file: File | ArrayBuffer | Uint8Array | string): Promise<any[]> {
  let workbook: XLSX.WorkBook;

  if (typeof file === 'string') {
    workbook = XLSX.read(file, { type: 'string' });
  } else if (file instanceof ArrayBuffer) {
    workbook = XLSX.read(file, { type: 'array' });
  } else if (ArrayBuffer.isView(file)) {
    // Node.js Buffer or Uint8Array
    workbook = XLSX.read(file as any, { type: 'buffer' });
  } else if (file && typeof (file as any).arrayBuffer === 'function') {
    const buffer = await (file as any).arrayBuffer();
    workbook = XLSX.read(buffer, { type: 'array' });
  } else {
    workbook = XLSX.read(file as any, { type: 'array' });
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  // If SheetJS only returned 1 column because CSV used semicolon or tab
  if (json.length > 0 && Object.keys(json[0]).length === 1) {
    const firstKey = Object.keys(json[0])[0];
    if (firstKey.includes(';') || firstKey.includes('\t')) {
      const delimiter = firstKey.includes(';') ? ';' : '\t';
      // Re-parse with custom delimited CSV
      return parseDelimitedCSV(typeof file === 'string' ? file : await (file as any).text?.() || '', delimiter);
    }
  }

  return json;
}

/**
 * Helper to parse delimited text if SheetJS didn't split columns automatically
 */
function parseDelimitedCSV(text: string, delimiter: string = ';'): any[] {
  if (!text) return [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
    const rowObj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = cols[idx] !== undefined ? cols[idx] : '';
    });
    rows.push(rowObj);
  }
  return rows;
}

/**
 * Finds match in Kabupaten list by code or name
 */
export function findMatchingKabupaten(
  rawCodeOrName: string,
  rawName: string | undefined,
  currentList: KabupatenRekon[]
): KabupatenRekon | undefined {
  const cleanInput = String(rawCodeOrName || '').trim();
  const cleanName = String(rawName || '').trim().toLowerCase();

  // 1. Direct name match if rawName is provided (unambiguous, e.g. "KUBU RAYA", "LANDAK", "PONTIANAK")
  if (cleanName) {
    const normalizeName = (s: string) =>
      s.toLowerCase().replace(/^(kota|kab\.|kabupaten)\s+/, '').replace(/\s+/g, ' ').trim();
    const targetNorm = normalizeName(cleanName);

    const byExactName = currentList.find((k) => normalizeName(k.nama) === targetNorm);
    if (byExactName) return byExactName;

    const byIncludes = currentList.find(
      (k) =>
        targetNorm.includes(normalizeName(k.nama)) ||
        normalizeName(k.nama).includes(targetNorm)
    );
    if (byIncludes) return byIncludes;
  }

  // 2. Direct match by kode (e.g. '6101')
  let match = currentList.find((k) => k.kode === cleanInput);
  if (match) return match;

  // 3. Code substring match (e.g. respondent code '6101032' starts with '6101' or '6101 - SAMBAS')
  const codeDigits = cleanInput.replace(/[^0-9]/g, '');
  if (codeDigits.length >= 4) {
    const prefix4 = codeDigits.slice(0, 4);
    match = currentList.find((k) => k.kode === prefix4);
    if (match) return match;
  }

  // 4. Input string contains kabupaten name (e.g. '6111 - KAYONG UTARA')
  const upper = cleanInput.toUpperCase();
  match = currentList.find((k) => upper.includes(k.nama.toUpperCase()));
  if (match) return match;

  return undefined;
}

/**
 * Process File 1: Database Tabel 7.1
 * Digunakan untuk mengisi HARGA TAHUN BERJALAN (TW 3, 4 2026 dan TW 1, 2 2027)
 * yang dimasukkan ke kolom HARGA 2027 & TW berjalan.
 */
export function processTabel71Upload(
  rows: any[],
  currentList: KabupatenRekon[],
  commodityFilter?: string
): ParseResult {
  const updatedList: KabupatenRekon[] = currentList.map((k) => ({
    ...k,
    respondents: [...k.respondents]
  }));

  const detectedCommoditiesSet = new Set<string>();

  // Group raw rows by target kabupaten
  const groupedRows: Record<string, any[]> = {};

  rows.forEach((row) => {
    // Extract commodity
    const comm = String(row['Nama Komoditas'] || row['Komoditas'] || row['komoditas'] || '').trim();
    if (comm) detectedCommoditiesSet.add(comm);

    // Filter commodity if specified
    if (commodityFilter && commodityFilter !== 'ALL' && comm) {
      if (!comm.toLowerCase().includes(commodityFilter.toLowerCase()) &&
          !commodityFilter.toLowerCase().includes(comm.toLowerCase())) {
        return;
      }
    }

    const rawCode = String(
      row['Kode Kabupaten/Kota'] ??
      row['Kode K'] ??
      row['Kode Kab'] ??
      row['Kode'] ??
      row['kode'] ??
      ''
    ).trim();

    const rawName = String(
      row['Nama Kabupaten/Kota'] ??
      row['Nama K'] ??
      row['Kabupaten'] ??
      row['nama'] ??
      ''
    ).trim();

    const matched = findMatchingKabupaten(rawCode, rawName, updatedList);
    if (matched) {
      if (!groupedRows[matched.kode]) groupedRows[matched.kode] = [];
      groupedRows[matched.kode].push(row);
    }
  });

  const comparison: ComparisonItem[] = [];
  let affectedKabCount = 0;

  // Process each Kabupaten with matching rows
  updatedList.forEach((kab) => {
    const kabRows = groupedRows[kab.kode];
    if (!kabRows || kabRows.length === 0) return;

    affectedKabCount++;

    const tw3Prices: number[] = [];
    const tw4Prices: number[] = [];
    const tw1Prices: number[] = [];
    const tw2Prices: number[] = [];
    const allPrices: number[] = [];
    const newRespondents: RespondenData[] = [];
    const brandCounts: Record<string, number> = {};

    kabRows.forEach((r, idx) => {
      // Find quarter values
      // Support TW 3 2026 (or legacy III-2025 in old file)
      const pTw3 = parsePrice(
        r['III-2026'] ?? r['TW III 2026'] ?? r['tw3_2026'] ?? r['III 2026'] ?? r['III-2025'] ?? r['TW III 2025']
      );
      // TW 4 2026 (or legacy IV-2025)
      const pTw4 = parsePrice(
        r['IV-2026'] ?? r['TW IV 2026'] ?? r['tw4_2026'] ?? r['IV 2026'] ?? r['IV-2025'] ?? r['TW IV 2025']
      );
      // TW 1 2027 (or legacy I-2026)
      const pTw1 = parsePrice(
        r['I-2027'] ?? r['TW I 2027'] ?? r['tw1_2027'] ?? r['I 2027'] ?? r['I-2026'] ?? r['TW I 2026']
      );
      // TW 2 2027 (or legacy II-2026)
      const pTw2 = parsePrice(
        r['II-2027'] ?? r['TW II 2027'] ?? r['tw2_2027'] ?? r['II 2027'] ?? r['II-2026'] ?? r['TW II 2026']
      );

      const resName = String(
        r['Nama Responden'] ?? r['Nama R'] ?? r['Responden'] ?? `Responden ${idx + 1}`
      ).trim().toUpperCase();

      const resMerk = String(
        r['Nama Merek'] ?? r['Nama Kualitas'] ?? r['kualitas rekon'] ?? r['Merek'] ?? 'Standar'
      ).trim();

      if (resMerk) {
        brandCounts[resMerk] = (brandCounts[resMerk] || 0) + 1;
      }

      // Add to quarter collectors
      if (pTw3 > 0) {
        tw3Prices.push(pTw3);
        allPrices.push(pTw3);
        newRespondents.push({
          id: `res_71_${kab.kode}_tw3_${Date.now()}_${idx}`,
          tahun: 2026,
          triwulan: 3,
          nama: resName,
          merk: resMerk,
          harga: pTw3
        });
      }
      if (pTw4 > 0) {
        tw4Prices.push(pTw4);
        allPrices.push(pTw4);
        newRespondents.push({
          id: `res_71_${kab.kode}_tw4_${Date.now()}_${idx}`,
          tahun: 2026,
          triwulan: 4,
          nama: resName,
          merk: resMerk,
          harga: pTw4
        });
      }
      if (pTw1 > 0) {
        tw1Prices.push(pTw1);
        allPrices.push(pTw1);
        newRespondents.push({
          id: `res_71_${kab.kode}_tw1_${Date.now()}_${idx}`,
          tahun: 2027,
          triwulan: 1,
          nama: resName,
          merk: resMerk,
          harga: pTw1
        });
      }
      if (pTw2 > 0) {
        tw2Prices.push(pTw2);
        allPrices.push(pTw2);
        newRespondents.push({
          id: `res_71_${kab.kode}_tw2_${Date.now()}_${idx}`,
          tahun: 2027,
          triwulan: 2,
          nama: resName,
          merk: resMerk,
          harga: pTw2
        });
      }
    });

    // Calculate quarter averages
    const avgTw3 = tw3Prices.length > 0 ? Math.round(tw3Prices.reduce((a, b) => a + b, 0) / tw3Prices.length) : kab.hargaTw3_2026;
    const avgTw4 = tw4Prices.length > 0 ? Math.round(tw4Prices.reduce((a, b) => a + b, 0) / tw4Prices.length) : kab.hargaTw4_2026;
    const avgTw1 = tw1Prices.length > 0 ? Math.round(tw1Prices.reduce((a, b) => a + b, 0) / tw1Prices.length) : kab.hargaTw1_2027;
    const avgTw2 = tw2Prices.length > 0 ? Math.round(tw2Prices.reduce((a, b) => a + b, 0) / tw2Prices.length) : kab.hargaTw2_2027;

    // Available quarters average for Harga 2027
    const validQuarterAvgs = [avgTw3, avgTw4, avgTw1, avgTw2].filter((v) => v > 0);
    const newHarga2027 = validQuarterAvgs.length > 0
      ? Math.round(validQuarterAvgs.reduce((a, b) => a + b, 0) / validQuarterAvgs.length)
      : (allPrices.length > 0 ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length) : kab.harga2027);

    // CV calculation
    const stats = calculateStats(allPrices.length > 0 ? allPrices : [newHarga2027]);
    const fileCV = parsePrice(kabRows[0]['cv'] ?? kabRows[0]['CV']);
    const newCV = stats.cv > 0 ? stats.cv : (fileCV > 0 ? fileCV : kab.koefisienVariasi);

    // Dominant brand
    let dominantBrand = kab.namaKualitas;
    let maxCount = 0;
    for (const [b, c] of Object.entries(brandCounts)) {
      if (c > maxCount) {
        maxCount = c;
        dominantBrand = b;
      }
    }

    const oldHarga2027 = kab.harga2027;
    const oldRasio = kab.rasio;
    const newRasio = kab.harga2026 > 0 ? parseFloat(((newHarga2027 / kab.harga2026) * 100).toFixed(2)) : 100;

    // Update target
    kab.hargaTw3_2026 = avgTw3;
    kab.hargaTw4_2026 = avgTw4;
    kab.hargaTw1_2027 = avgTw1;
    kab.hargaTw2_2027 = avgTw2;
    kab.harga2027 = newHarga2027;
    kab.koefisienVariasi = newCV;
    kab.namaKualitas = dominantBrand || kab.namaKualitas;
    kab.rasio = newRasio;
    if (newRespondents.length > 0) {
      kab.respondents = newRespondents;
    }

    const diff = newHarga2027 - oldHarga2027;
    const percentDiff = oldHarga2027 > 0 ? parseFloat(((diff / oldHarga2027) * 100).toFixed(2)) : 0;

    const quartersDetail = [
      avgTw3 > 0 ? `TW3'26: ${avgTw3.toLocaleString('id-ID')}` : '',
      avgTw4 > 0 ? `TW4'26: ${avgTw4.toLocaleString('id-ID')}` : '',
      avgTw1 > 0 ? `TW1'27: ${avgTw1.toLocaleString('id-ID')}` : '',
      avgTw2 > 0 ? `TW2'27: ${avgTw2.toLocaleString('id-ID')}` : ''
    ].filter(Boolean).join(' | ');

    comparison.push({
      kode: kab.kode,
      nama: kab.nama,
      oldValue: oldHarga2027,
      newValue: newHarga2027,
      diff,
      percentDiff,
      oldRasio,
      newRasio,
      quartersDetail: quartersDetail || 'Semua TW',
      respondentCount: kabRows.length
    });
  });

  return {
    updatedList,
    comparison,
    totalRows: rows.length,
    affectedKabCount,
    detectedCommodities: Array.from(detectedCommoditiesSet),
    rawRows: rows
  };
}

/**
 * Process File 2: IKK Rekonda Responden
 * Digunakan untuk mengisi HARGA TAHUN SEBELUMNYA (TW 3, 4 2025 dan TW 1, 2 2026)
 * yang diinputkan ke kolom HARGA 2026 (Basis IKK 2026) & TW tahun lalu.
 */
export function processIKKRespondenUpload(
  rows: any[],
  currentList: KabupatenRekon[],
  commodityFilter?: string
): ParseResult {
  const updatedList: KabupatenRekon[] = currentList.map((k) => ({
    ...k,
    respondents: [...k.respondents]
  }));

  const detectedCommoditiesSet = new Set<string>();

  // Group microdata rows by matched kabupaten
  const groupedRows: Record<string, any[]> = {};

  rows.forEach((row) => {
    const comm = String(row['Komoditas'] || row['Nama Komoditas'] || '').trim();
    if (comm) detectedCommoditiesSet.add(comm);

    if (commodityFilter && commodityFilter !== 'ALL' && comm) {
      if (!comm.toLowerCase().includes(commodityFilter.toLowerCase()) &&
          !commodityFilter.toLowerCase().includes(comm.toLowerCase())) {
        return;
      }
    }

    const rawKota = String(row['Kota'] || row['Kabupaten'] || row['Kota / Kab'] || '').trim();
    const matched = findMatchingKabupaten(rawKota, rawKota, updatedList);
    if (matched) {
      if (!groupedRows[matched.kode]) groupedRows[matched.kode] = [];
      groupedRows[matched.kode].push(row);
    }
  });

  const comparison: ComparisonItem[] = [];
  let affectedKabCount = 0;

  updatedList.forEach((kab) => {
    const kabRows = groupedRows[kab.kode];
    if (!kabRows || kabRows.length === 0) return;

    affectedKabCount++;

    const tw3_25_prices: number[] = [];
    const tw4_25_prices: number[] = [];
    const tw1_26_prices: number[] = [];
    const tw2_26_prices: number[] = [];
    const allLaluPrices: number[] = [];

    kabRows.forEach((r) => {
      const tahun = Number(r['Tahun'] || r['tahun'] || 0);
      const tw = Number(r['Triwulan'] || r['triwulan'] || r['TW'] || 0);
      const harga = parsePrice(r['Harga'] ?? r['harga'] ?? r['Nilai']);

      if (harga > 0) {
        if (tahun === 2025 && tw === 3) {
          tw3_25_prices.push(harga);
          allLaluPrices.push(harga);
        } else if (tahun === 2025 && tw === 4) {
          tw4_25_prices.push(harga);
          allLaluPrices.push(harga);
        } else if (tahun === 2026 && tw === 1) {
          tw1_26_prices.push(harga);
          allLaluPrices.push(harga);
        } else if (tahun === 2026 && tw === 2) {
          tw2_26_prices.push(harga);
          allLaluPrices.push(harga);
        } else {
          // If quarter not strictly 2025-TW3..2026-TW2, but represents prior year
          allLaluPrices.push(harga);
        }
      }
    });

    const avgTw3_25 = tw3_25_prices.length > 0 ? Math.round(tw3_25_prices.reduce((a, b) => a + b, 0) / tw3_25_prices.length) : kab.hargaTw3_2025;
    const avgTw4_25 = tw4_25_prices.length > 0 ? Math.round(tw4_25_prices.reduce((a, b) => a + b, 0) / tw4_25_prices.length) : kab.hargaTw4_2025;
    const avgTw1_26 = tw1_26_prices.length > 0 ? Math.round(tw1_26_prices.reduce((a, b) => a + b, 0) / tw1_26_prices.length) : kab.hargaTw1_2026;
    const avgTw2_26 = tw2_26_prices.length > 0 ? Math.round(tw2_26_prices.reduce((a, b) => a + b, 0) / tw2_26_prices.length) : kab.hargaTw2_2026;

    const validLaluQuarters = [avgTw3_25, avgTw4_25, avgTw1_26, avgTw2_26].filter((v) => v > 0);
    const newHarga2026 = validLaluQuarters.length > 0
      ? Math.round(validLaluQuarters.reduce((a, b) => a + b, 0) / validLaluQuarters.length)
      : (allLaluPrices.length > 0 ? Math.round(allLaluPrices.reduce((a, b) => a + b, 0) / allLaluPrices.length) : kab.harga2026);

    const oldHarga2026 = kab.harga2026;
    const oldRasio = kab.rasio;
    const newRasio = newHarga2026 > 0 ? parseFloat(((kab.harga2027 / newHarga2026) * 100).toFixed(2)) : 100;

    // Update target
    kab.hargaTw3_2025 = avgTw3_25;
    kab.hargaTw4_2025 = avgTw4_25;
    kab.hargaTw1_2026 = avgTw1_26;
    kab.hargaTw2_2026 = avgTw2_26;
    kab.harga2026 = newHarga2026;
    kab.rasio = newRasio;

    const diff = newHarga2026 - oldHarga2026;
    const percentDiff = oldHarga2026 > 0 ? parseFloat(((diff / oldHarga2026) * 100).toFixed(2)) : 0;

    const quartersDetail = [
      avgTw3_25 > 0 ? `TW3'25: ${avgTw3_25.toLocaleString('id-ID')}` : '',
      avgTw4_25 > 0 ? `TW4'25: ${avgTw4_25.toLocaleString('id-ID')}` : '',
      avgTw1_26 > 0 ? `TW1'26: ${avgTw1_26.toLocaleString('id-ID')}` : '',
      avgTw2_26 > 0 ? `TW2'26: ${avgTw2_26.toLocaleString('id-ID')}` : ''
    ].filter(Boolean).join(' | ');

    comparison.push({
      kode: kab.kode,
      nama: kab.nama,
      oldValue: oldHarga2026,
      newValue: newHarga2026,
      diff,
      percentDiff,
      oldRasio,
      newRasio,
      quartersDetail: quartersDetail || 'Semua TW',
      respondentCount: kabRows.length
    });
  });

  return {
    updatedList,
    comparison,
    totalRows: rows.length,
    affectedKabCount,
    detectedCommodities: Array.from(detectedCommoditiesSet),
    rawRows: rows
  };
}

/**
 * Process File 3: Database IKK 2026 Webentry
 * Digunakan untuk mengisi HARGA 2026 dari tarikan Webentry lengkap
 * (Kabupaten;Harga 2026;Harga TW III 2025;Harga TW IV 2025;Harga TW I 2026;Harga TW II 2026;Koefisien Variasi;Kode Kualitas 1;...)
 */
export function processIKKWebentryUpload(
  rows: any[],
  currentList: KabupatenRekon[],
  commodityFilter?: string
): ParseResult {
  const updatedList: KabupatenRekon[] = currentList.map((k) => ({
    ...k,
    respondents: [...k.respondents]
  }));

  const detectedCommoditiesSet = new Set<string>();
  const groupedRows: Record<string, any[]> = {};

  rows.forEach((row) => {
    const rawQualCode = String(row['Kode Kualitas 1'] || row['Kode Kualitas'] || '').trim();
    const commName = String(row['Nama Komoditas'] || row['Komoditas'] || '').trim();
    const qualDisplay = rawQualCode ? `[${rawQualCode}] ${commName}` : commName;
    if (qualDisplay) detectedCommoditiesSet.add(qualDisplay);

    if (commodityFilter && commodityFilter !== 'ALL') {
      const matchFilter =
        (rawQualCode && rawQualCode.includes(commodityFilter)) ||
        (commName && commName.toLowerCase().includes(commodityFilter.toLowerCase())) ||
        (commodityFilter.includes(rawQualCode));
      if (!matchFilter) return;
    }

    const rawKab = String(row['Kabupaten'] || row['Nama Kabupaten'] || row['Kota'] || '').trim();
    const matched = findMatchingKabupaten(rawKab, rawKab, updatedList);
    if (matched) {
      if (!groupedRows[matched.kode]) groupedRows[matched.kode] = [];
      groupedRows[matched.kode].push(row);
    }
  });

  const comparison: ComparisonItem[] = [];
  let affectedKabCount = 0;

  updatedList.forEach((kab) => {
    const kabRows = groupedRows[kab.kode];
    if (!kabRows || kabRows.length === 0) return;

    affectedKabCount++;
    const row = kabRows[0];

    const tw3_25 = parsePrice(row['Harga TW III 2025'] ?? row['III-2025'] ?? row['TW3_2025']);
    const tw4_25 = parsePrice(row['Harga TW IV 2025'] ?? row['IV-2025'] ?? row['TW4_2025']);
    const tw1_26 = parsePrice(row['Harga TW I 2026'] ?? row['I-2026'] ?? row['TW1_2026']);
    const tw2_26 = parsePrice(row['Harga TW II 2026'] ?? row['II-2026'] ?? row['TW2_2026']);

    const validQuarters = [tw3_25, tw4_25, tw1_26, tw2_26].filter((p) => p > 0);
    const fileHarga2026 = parsePrice(row['Harga 2026'] ?? row['Harga2026'] ?? row['Nilai 2026']);
    const newHarga2026 = fileHarga2026 > 0
      ? fileHarga2026
      : (validQuarters.length > 0
          ? Math.round(validQuarters.reduce((a, b) => a + b, 0) / validQuarters.length)
          : kab.harga2026);

    const oldHarga2026 = kab.harga2026;
    const oldRasio = kab.rasio;
    const newRasio = newHarga2026 > 0 ? parseFloat(((kab.harga2027 / newHarga2026) * 100).toFixed(2)) : 100;

    kab.hargaTw3_2025 = tw3_25 || newHarga2026;
    kab.hargaTw4_2025 = tw4_25 || newHarga2026;
    kab.hargaTw1_2026 = tw1_26 || newHarga2026;
    kab.hargaTw2_2026 = tw2_26 || newHarga2026;
    kab.harga2026 = newHarga2026;
    kab.rasio = newRasio;

    const diff = newHarga2026 - oldHarga2026;
    const percentDiff = oldHarga2026 > 0 ? parseFloat(((diff / oldHarga2026) * 100).toFixed(2)) : 0;

    const quartersDetail = [
      tw3_25 > 0 ? `TW3'25: ${tw3_25.toLocaleString('id-ID')}` : '',
      tw4_25 > 0 ? `TW4'25: ${tw4_25.toLocaleString('id-ID')}` : '',
      tw1_26 > 0 ? `TW1'26: ${tw1_26.toLocaleString('id-ID')}` : '',
      tw2_26 > 0 ? `TW2'26: ${tw2_26.toLocaleString('id-ID')}` : ''
    ].filter(Boolean).join(' | ');

    comparison.push({
      kode: kab.kode,
      nama: kab.nama,
      oldValue: oldHarga2026,
      newValue: newHarga2026,
      diff,
      percentDiff,
      oldRasio,
      newRasio,
      quartersDetail: quartersDetail || `Webentry 2026: ${newHarga2026.toLocaleString('id-ID')}`,
      respondentCount: kabRows.length
    });
  });

  return {
    updatedList,
    comparison,
    totalRows: rows.length,
    affectedKabCount,
    detectedCommodities: Array.from(detectedCommoditiesSet),
    rawRows: rows
  };
}

/**
 * Detect template type from row headers
 */
export function detectTemplateType(rows: any[]): 'tabel71' | 'rekonda_responden' | 'rekonda_webentry' {
  if (!rows || rows.length === 0) return 'tabel71';
  const first = rows[0];
  const keys = Object.keys(first).map((k) => k.toLowerCase());

  if (keys.some((k) => k.includes('kode kualitas 1') || k.includes('kode boq') || k.includes('harga 2026'))) {
    return 'rekonda_webentry';
  }
  if (keys.some((k) => k.includes('responden') && (k.includes('kota') || k.includes('kualitas rekon') || k.includes('flag ganti')))) {
    return 'rekonda_responden';
  }
  return 'tabel71';
}

/**
 * Dual Template 2026 Merge:
 * Sesuai aturan:
 * - Untuk kode kualitas yang ADA di IKK REKONDA responden 2026, gunakan harga dari database tersebut.
 * - Untuk kode kualitas yang TIDAK ADA di IKK REKONDA responden 2026, gunakan harga dari database IKK 2026 webentry.
 */
export function processDual2026Merge(
  rekonnasRows: any[],
  webentryRows: any[],
  currentList: KabupatenRekon[],
  commodityCode: string
): ParseResult {
  // Check if commodityCode is present in rekonnasRows
  const hasInRekonnas = rekonnasRows.some((r) => {
    const raw = String(r['Kualitas Rekon'] || r['Komoditas'] || '').trim();
    return raw.includes(commodityCode);
  });

  if (hasInRekonnas) {
    return processIKKRespondenUpload(rekonnasRows, currentList, commodityCode);
  } else {
    return processIKKWebentryUpload(webentryRows, currentList, commodityCode);
  }
}

