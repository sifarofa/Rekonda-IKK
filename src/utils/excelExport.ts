import * as XLSX from 'xlsx';
import { KabupatenRekon, Komoditas, Provinsi } from '../types/rekonda';
export { downloadTemplateTabel71, downloadTemplateIKKResponden } from './templateGenerators';

export function exportCurrentTableToExcel(
  provinsi: Provinsi,
  komoditas: Komoditas,
  data: KabupatenRekon[]
) {
  const rows = data.map((item) => ({
    'Kode Kab': item.kode,
    'Kabupaten / Kota': item.nama,
    'Harga 2027 (Rp)': item.harga2027,
    'Harga TW III 2026 (Rp)': item.hargaTw3_2026,
    'Harga TW IV 2026 (Rp)': item.hargaTw4_2026,
    'Harga TW I 2027 (Rp)': item.hargaTw1_2027,
    'Harga TW II 2027 (Rp)': item.hargaTw2_2027,
    'Koefisien Variasi (%)': item.koefisienVariasi,
    'Merek Paling Banyak Muncul': item.namaKualitas,
    'Harga 2026 (Basis rekonda26)': item.harga2026 > 0 ? item.harga2026 : '-',
    'Rasio (%)': item.harga2026 > 0 ? item.rasio : '-',
    'Catatan Lapangan': item.catatan || '-',
    'Status Rekon': item.statusRekon || 'belum_rekon',
    'Aksi / Tindak Lanjut': item.aksiRekon || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekon Daerah 2026-2027');
  
  const filename = `Rekon_Daerah_${provinsi.kode}_${komoditas.kode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Unduh Excel Seluruh Responden:
 * Mengekspor seluruh data responden mikro dari seluruh 89 kualitas/komoditas
 * di seluruh kabupaten/kota, bukan hanya terpaku pada kualitas yang sedang difilter.
 */
import initialDbRaw from '../data/initialDatabase.json';

const fallbackDb = initialDbRaw as Record<string, KabupatenRekon[]>;

export function exportSeluruhRespondenToExcel(
  provinsi: Provinsi,
  komoditasList: Komoditas[],
  databaseOrData: Record<string, KabupatenRekon[]> | KabupatenRekon[]
) {
  const rows: Array<{
    'No': number;
    'Provinsi': string;
    'Kode Komoditas': string;
    'Nama Komoditas / Kualitas': string;
    'Satuan': string;
    'Kode Kab': string;
    'Kabupaten / Kota': string;
    'Tahun': number;
    'Triwulan': number;
    'Kode Responden': string;
    'Nama Responden': string;
    'Merk / Kualitas': string;
    'Harga (Rp)': number;
  }> = [];

  let counter = 1;

  // Always iterate through all commodities to ensure 100% complete coverage across all 89 qualities
  komoditasList.forEach((kom) => {
    const dbKey = `${provinsi.kode}_${kom.kode}`;
    const activeKabList = (!Array.isArray(databaseOrData) && databaseOrData[dbKey])
      ? databaseOrData[dbKey]
      : [];
    const fallbackKabList = fallbackDb[dbKey] || [];
    const kabList = activeKabList.length > 0 ? activeKabList : fallbackKabList;

    kabList.forEach((kab) => {
      const fallbackKab = fallbackKabList.find((k) => k.kode === kab.kode);
      const respondents = (kab.respondents && kab.respondents.length > 0)
        ? kab.respondents
        : (fallbackKab?.respondents || []);

      respondents.forEach((res) => {
        rows.push({
          'No': counter++,
          'Provinsi': `[${provinsi.kode}] ${provinsi.nama}`,
          'Kode Komoditas': kom.kode,
          'Nama Komoditas / Kualitas': kom.nama,
          'Satuan': kom.satuan || '-',
          'Kode Kab': kab.kode,
          'Kabupaten / Kota': kab.nama,
          'Tahun': res.tahun,
          'Triwulan': res.triwulan,
          'Kode Responden': res.id || '-',
          'Nama Responden': res.nama,
          'Merk / Kualitas': res.merk || '-',
          'Harga (Rp)': res.harga
        });
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Seluruh Responden 89 Kualitas');
  
  const filename = `Seluruh_Responden_89_Kualitas_${provinsi.kode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}


/**
 * Unduh Excel Seluruh Kualitas:
 * Mengekspor seluruh data harga dari seluruh 89 kualitas/komoditas rekon
 * di seluruh kabupaten/kota, bukan hanya terpaku pada kualitas yang sedang difilter.
 */
export function exportSeluruhKualitasToExcel(
  provinsi: Provinsi,
  komoditasList: Komoditas[],
  databaseOrData: Record<string, KabupatenRekon[]> | KabupatenRekon[]
) {
  const rows: Array<{
    'No': number;
    'Provinsi': string;
    'Kode Komoditas': string;
    'Nama Kualitas / Komoditas Rekon': string;
    'Satuan': string;
    'Kode Kab': string;
    'Kabupaten / Kota': string;
    'Harga 2027 (Rp)': number;
    'Harga TW III 2026 (Rp)': number;
    'Harga TW IV 2026 (Rp)': number;
    'Harga TW I 2027 (Rp)': number;
    'Harga TW II 2027 (Rp)': number;
    'Koefisien Variasi (%)': number;
    'Merek Dominan': string;
    'Harga 2026 (Rp)': string | number;
    'Rasio (%)': string | number;
    'Catatan Lapangan': string;
    'Status Rekon': string;
  }> = [];

  let counter = 1;

  if (Array.isArray(databaseOrData)) {
    // Single list fallback
    databaseOrData.forEach((item) => {
      rows.push({
        'No': counter++,
        'Provinsi': `[${provinsi.kode}] ${provinsi.nama}`,
        'Kode Komoditas': komoditasList[0]?.kode || '-',
        'Nama Kualitas / Komoditas Rekon': komoditasList[0]?.nama || 'Semua Kualitas',
        'Satuan': komoditasList[0]?.satuan || '-',
        'Kode Kab': item.kode,
        'Kabupaten / Kota': item.nama,
        'Harga 2027 (Rp)': item.harga2027,
        'Harga TW III 2026 (Rp)': item.hargaTw3_2026 || 0,
        'Harga TW IV 2026 (Rp)': item.hargaTw4_2026 || 0,
        'Harga TW I 2027 (Rp)': item.hargaTw1_2027 || 0,
        'Harga TW II 2027 (Rp)': item.hargaTw2_2027 || 0,
        'Koefisien Variasi (%)': item.koefisienVariasi,
        'Merek Dominan': item.namaKualitas || '-',
        'Harga 2026 (Rp)': item.harga2026 > 0 ? item.harga2026 : '-',
        'Rasio (%)': item.harga2026 > 0 ? item.rasio : '-',
        'Catatan Lapangan': item.catatan || '-',
        'Status Rekon': item.statusRekon || 'belum_rekon'
      });
    });
  } else {
    // Iterate all 89 commodities
    komoditasList.forEach((kom) => {
      const dbKey = `${provinsi.kode}_${kom.kode}`;
      const kabList = databaseOrData[dbKey] || [];

      kabList.forEach((item) => {
        rows.push({
          'No': counter++,
          'Provinsi': `[${provinsi.kode}] ${provinsi.nama}`,
          'Kode Komoditas': kom.kode,
          'Nama Kualitas / Komoditas Rekon': kom.nama,
          'Satuan': kom.satuan || '-',
          'Kode Kab': item.kode,
          'Kabupaten / Kota': item.nama,
          'Harga 2027 (Rp)': item.harga2027,
          'Harga TW III 2026 (Rp)': item.hargaTw3_2026 || 0,
          'Harga TW IV 2026 (Rp)': item.hargaTw4_2026 || 0,
          'Harga TW I 2027 (Rp)': item.hargaTw1_2027 || 0,
          'Harga TW II 2027 (Rp)': item.hargaTw2_2027 || 0,
          'Koefisien Variasi (%)': item.koefisienVariasi,
          'Merek Dominan': item.namaKualitas || '-',
          'Harga 2026 (Rp)': item.harga2026 > 0 ? item.harga2026 : '-',
          'Rasio (%)': item.harga2026 > 0 ? item.rasio : '-',
          'Catatan Lapangan': item.catatan || '-',
          'Status Rekon': item.statusRekon || 'belum_rekon'
        });
      });
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Seluruh_Kualitas_89');
  
  const filename = `Seluruh_Kualitas_Rekon_89_${provinsi.kode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
