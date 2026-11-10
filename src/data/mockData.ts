import { KabupatenRekon, Komoditas, Provinsi } from '../types/rekonda';
import komoditasRaw from './komoditasList.json';
import initialDbRaw from './initialDatabase.json';

export const PROVINSI_LIST: Provinsi[] = [
  {
    kode: '61',
    nama: 'KALIMANTAN BARAT',
    kabupatenList: [
      '6101', // SAMBAS
      '6102', // BENGKAYANG
      '6103', // LANDAK
      '6104', // MEMPAWAH
      '6105', // SANGGAU
      '6106', // KETAPANG
      '6107', // SINTANG
      '6108', // KAPUAS HULU
      '6109', // SEKADAU
      '6110', // MELAWI
      '6111', // KAYONG UTARA
      '6112', // KUBU RAYA
      '6171', // KOTA PONTIANAK
      '6172'  // KOTA SINGKAWANG
    ]
  },
  { kode: '35', nama: 'JAWA TIMUR', kabupatenList: ['3501', '3502', '3503', '3578'] },
  { kode: '32', nama: 'JAWA BARAT', kabupatenList: ['3201', '3202', '3273'] },
  { kode: '12', nama: 'SUMATERA UTARA', kabupatenList: ['1201', '1271'] },
  { kode: '73', nama: 'SULAWESI SELATAN', kabupatenList: ['7301', '7371'] },
];

export const KOMODITAS_LIST: Komoditas[] = (komoditasRaw as Komoditas[]).sort((a, b) => {
  const numA = parseInt(a.kode, 10);
  const numB = parseInt(b.kode, 10);
  if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
  return a.kode.localeCompare(b.kode, undefined, { numeric: true });
});

export const INITIAL_KABUPATEN_DATA: Record<string, KabupatenRekon[]> = initialDbRaw as Record<string, KabupatenRekon[]>;
