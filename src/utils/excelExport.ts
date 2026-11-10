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
    'Harga 2026 (Basis rekonda26)': item.harga2026,
    'Rasio (%)': item.rasio,
    'Catatan Lapangan': item.catatan || '-',
    'Status Rekon': item.statusRekon,
    'Aksi / Tindak Lanjut': item.aksiRekon || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekon Daerah 2026-2027');
  
  const filename = `Rekon_Daerah_${provinsi.kode}_${komoditas.kode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function exportSeluruhRespondenToExcel(
  provinsi: Provinsi,
  komoditas: Komoditas,
  data: KabupatenRekon[]
) {
  const rows: Array<{
    'Kode Kab': string;
    'Kabupaten': string;
    'Tahun': number;
    'Triwulan': number;
    'Nama Responden': string;
    'Merk / Kualitas': string;
    'Harga (Rp)': number;
  }> = [];

  data.forEach((kab) => {
    kab.respondents.forEach((res) => {
      rows.push({
        'Kode Kab': kab.kode,
        'Kabupaten': kab.nama,
        'Tahun': res.tahun,
        'Triwulan': res.triwulan,
        'Nama Responden': res.nama,
        'Merk / Kualitas': res.merk,
        'Harga (Rp)': res.harga
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'tabel 7.1 Responden');
  
  const filename = `Responden_Tabel_7.1_${provinsi.kode}_${komoditas.kode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function exportSeluruhKualitasToExcel(
  provinsi: Provinsi,
  komoditasList: Komoditas[],
  currentData: KabupatenRekon[]
) {
  const rows = currentData.map((item) => ({
    'Provinsi': `[${provinsi.kode}] ${provinsi.nama}`,
    'Kode Kab': item.kode,
    'Kabupaten / Kota': item.nama,
    'Komoditas Terpilih': komoditasList[0]?.nama || 'Semua Kualitas',
    'Harga 2027 (Berjalan)': item.harga2027,
    'Harga 2026 (rekonda26)': item.harga2026,
    'Rasio (%)': item.rasio,
    'Koefisien Variasi (%)': item.koefisienVariasi,
    'Merek Terbanyak': item.namaKualitas,
    'Catatan': item.catatan || '-',
    'Status Rekon': item.statusRekon
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Seluruh Kualitas');
  
  const filename = `Seluruh_Kualitas_${provinsi.kode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
