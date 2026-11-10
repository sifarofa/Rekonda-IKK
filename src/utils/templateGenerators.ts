import * as XLSX from 'xlsx';
import { KabupatenRekon, Komoditas } from '../types/rekonda';

/**
 * Download Template 1: Database Tabel 7.1
 * Digunakan untuk mengisi harga tahun berjalan (TW 3, 4 2026 dan TW 1, 2 2027)
 * yang dimasukkan ke kolom Harga 2027 & TW berjalan.
 * Sesuai dengan format database_tabel_7.1_0a44d253.csv dan image_6e674ca5.png.
 */
export function downloadTemplateTabel71(
  currentKabupaten: KabupatenRekon[],
  komoditas: Komoditas,
  format: 'xlsx' | 'csv' = 'xlsx',
  quarterHeaders: 'legacy_bps' | 'cycle_2027' = 'legacy_bps'
) {
  // Exact headers matching user's template:
  // Kode Kabupaten/Kota, Nama Kabupaten/Kota, Kode Responden, Nama Responden, Jenis Kuesioner, Nama Komoditas, Nama Kualitas, Nama Merek, kualitas rekon, kode kualitas rekon, Satuan Standar, III-2025, IV-2025, I-2026, II-2026, cv
  const colTw3 = quarterHeaders === 'cycle_2027' ? 'III-2026' : 'III-2025';
  const colTw4 = quarterHeaders === 'cycle_2027' ? 'IV-2026' : 'IV-2025';
  const colTw1 = quarterHeaders === 'cycle_2027' ? 'I-2027' : 'I-2026';
  const colTw2 = quarterHeaders === 'cycle_2027' ? 'II-2027' : 'II-2026';

  const rows: any[] = [];

  currentKabupaten.forEach((kab) => {
    if (kab.respondents && kab.respondents.length > 0) {
      const respondentsByName: Record<string, any> = {};

      kab.respondents.forEach((res, idx) => {
        const key = res.nama || `RESPONDEN_${kab.kode}_${idx + 1}`;
        if (!respondentsByName[key]) {
          respondentsByName[key] = {
            resCode: `${kab.kode}${String(idx + 1).padStart(3, '0')}`,
            nama: res.nama,
            merk: res.merk || kab.namaKualitas || 'Standar',
            tw3_26: 0,
            tw4_26: 0,
            tw1_27: 0,
            tw2_27: 0
          };
        }
        if (res.tahun === 2026 && res.triwulan === 3) respondentsByName[key].tw3_26 = res.harga;
        if (res.tahun === 2026 && res.triwulan === 4) respondentsByName[key].tw4_26 = res.harga;
        if (res.tahun === 2027 && res.triwulan === 1) respondentsByName[key].tw1_27 = res.harga;
        if (res.tahun === 2027 && res.triwulan === 2) respondentsByName[key].tw2_27 = res.harga;
      });

      Object.values(respondentsByName).forEach((r) => {
        const rowObj: Record<string, any> = {
          'Kode Kabupaten/Kota': kab.kode,
          'Nama Kabupaten/Kota': kab.nama,
          'Kode Responden': r.resCode,
          'Nama Responden': r.nama,
          'Jenis Kuesioner': komoditas.kategori || 'Material Pabrikan',
          'Nama Komoditas': komoditas.nama,
          'Nama Kualitas': kab.namaKualitas || `${komoditas.nama} Standar`,
          'Nama Merek': r.merk || 'LAINNYA',
          'kualitas rekon': `${komoditas.nama} ${kab.namaKualitas || 'Standar'}`,
          'kode kualitas rekon': `[${komoditas.kode}] ${komoditas.nama}`,
          'Satuan Standar': komoditas.satuan
        };
        rowObj[colTw3] = r.tw3_26 > 0 ? r.tw3_26 : kab.hargaTw3_2026 || kab.harga2027;
        rowObj[colTw4] = r.tw4_26 > 0 ? r.tw4_26 : kab.hargaTw4_2026 || kab.harga2027;
        rowObj[colTw1] = r.tw1_27 > 0 ? r.tw1_27 : kab.hargaTw1_2027 || kab.harga2027;
        rowObj[colTw2] = r.tw2_27 > 0 ? r.tw2_27 : kab.hargaTw2_2027 || kab.harga2027;
        rowObj['cv'] = kab.koefisienVariasi || 0;
        rows.push(rowObj);
      });
    } else {
      const basePrice = kab.harga2027 > 0 ? kab.harga2027 : 120000;
      const r1: Record<string, any> = {
        'Kode Kabupaten/Kota': kab.kode,
        'Nama Kabupaten/Kota': kab.nama,
        'Kode Responden': `${kab.kode}001`,
        'Nama Responden': `TOKO BANGUNAN ${kab.nama} 1`,
        'Jenis Kuesioner': komoditas.kategori || 'Material Pabrikan',
        'Nama Komoditas': komoditas.nama,
        'Nama Kualitas': kab.namaKualitas || 'Kualitas Standar',
        'Nama Merek': 'Merek Utama',
        'kualitas rekon': `${komoditas.nama} Standar`,
        'kode kualitas rekon': `[${komoditas.kode}] ${komoditas.nama}`,
        'Satuan Standar': komoditas.satuan
      };
      r1[colTw3] = kab.hargaTw3_2026 || Math.round(basePrice * 0.98);
      r1[colTw4] = kab.hargaTw4_2026 || Math.round(basePrice * 1.01);
      r1[colTw1] = kab.hargaTw1_2027 || basePrice;
      r1[colTw2] = kab.hargaTw2_2027 || Math.round(basePrice * 1.02);
      r1['cv'] = kab.koefisienVariasi || 0;

      const r2: Record<string, any> = {
        'Kode Kabupaten/Kota': kab.kode,
        'Nama Kabupaten/Kota': kab.nama,
        'Kode Responden': `${kab.kode}002`,
        'Nama Responden': `CV. DISTRIBUTOR ${kab.nama}`,
        'Jenis Kuesioner': komoditas.kategori || 'Material Pabrikan',
        'Nama Komoditas': komoditas.nama,
        'Nama Kualitas': kab.namaKualitas || 'Kualitas Standar',
        'Nama Merek': 'LAINNYA',
        'kualitas rekon': `${komoditas.nama} Standar`,
        'kode kualitas rekon': `[${komoditas.kode}] ${komoditas.nama}`,
        'Satuan Standar': komoditas.satuan
      };
      r2[colTw3] = kab.hargaTw3_2026 || Math.round(basePrice * 0.99);
      r2[colTw4] = kab.hargaTw4_2026 || basePrice;
      r2[colTw1] = kab.hargaTw1_2027 || Math.round(basePrice * 1.01);
      r2[colTw2] = kab.hargaTw2_2027 || Math.round(basePrice * 1.03);
      r2['cv'] = kab.koefisienVariasi || 0;

      rows.push(r1, r2);
    }
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'tabel 7.1');

  const filename = `Template_Tabel_7.1_Tahun_Berjalan_${komoditas.kode}_${new Date().toISOString().slice(0, 10)}`;
  if (format === 'csv') {
    XLSX.writeFile(wb, `${filename}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}

/**
 * Download Template 2: IKK Rekonda Responden
 * Digunakan untuk mengisi data tahun sebelumnya (TW 3, 4 2025 dan TW 1, 2 2026)
 * yang dimasukkan ke kolom Harga 2026 (Basis IKK 2026).
 * Sesuai dengan format IKK_REKONDA_responden_2026_3d99b638.csv dan image_62883aad.png.
 */
export function downloadTemplateIKKResponden(
  currentKabupaten: KabupatenRekon[],
  komoditas: Komoditas,
  format: 'xlsx' | 'csv' = 'xlsx'
) {
  // Columns exactly matching image_62883aad.png and IKK_REKONDA_responden
  // Kota | Komoditas | Kualitas Rekon | Kualitas Data | Flag Ganti | Tahun | Triwulan | Responden | Nama Responden | Harga
  const rows: any[] = [];

  currentKabupaten.forEach((kab) => {
    const cityName = `${kab.kode} - ${kab.nama}`;
    const baseP = kab.harga2026 > 0 ? kab.harga2026 : 110000;
    const tw3_25 = kab.hargaTw3_2025 > 0 ? kab.hargaTw3_2025 : Math.round(baseP * 0.96);
    const tw4_25 = kab.hargaTw4_2025 > 0 ? kab.hargaTw4_2025 : Math.round(baseP * 0.98);
    const tw1_26 = kab.hargaTw1_2026 > 0 ? kab.hargaTw1_2026 : baseP;
    const tw2_26 = kab.hargaTw2_2026 > 0 ? kab.hargaTw2_2026 : Math.round(baseP * 1.02);

    const quarters = [
      { tahun: 2025, triwulan: 3, harga: tw3_25 },
      { tahun: 2025, triwulan: 4, harga: tw4_25 },
      { tahun: 2026, triwulan: 1, harga: tw1_26 },
      { tahun: 2026, triwulan: 2, harga: tw2_26 }
    ];

    quarters.forEach((q, idx) => {
      rows.push({
        'Kota': cityName,
        'Komoditas': `${komoditas.kode.slice(0, 2)} - ${komoditas.nama}`,
        'Kualitas Rekon': `${komoditas.kode} | ${kab.namaKualitas || 'Standar'} | `,
        'Kualitas Data': `${komoditas.kode} | ${kab.namaKualitas || 'Standar'} | `,
        'Flag Ganti': 0,
        'Tahun': q.tahun,
        'Triwulan': q.triwulan,
        'Responden': `${kab.kode}${String(idx + 1).padStart(3, '0')}`,
        'Nama Responden': `RESPONDEN ${kab.nama} ${idx + 1}`,
        'Harga': q.harga
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'IKK_REKONDA_responden');

  const filename = `Template_IKK_Rekonda_Responden_Tahun_Lalu_${komoditas.kode}_${new Date().toISOString().slice(0, 10)}`;
  if (format === 'csv') {
    XLSX.writeFile(wb, `${filename}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}

/**
 * Download Template 3: Database IKK 2026 Webentry
 * Digunakan untuk mengisi data tahun sebelumnya dari tarikan Webentry lengkap
 * (Kabupaten;Harga 2026;Harga TW III 2025;Harga TW IV 2025;Harga TW I 2026;Harga TW II 2026;Koefisien Variasi;Kode Kualitas 1;...)
 */
export function downloadTemplateIKKWebentry(
  currentKabupaten: KabupatenRekon[],
  komoditas: Komoditas,
  format: 'xlsx' | 'csv' = 'xlsx'
) {
  const rows: any[] = [];

  currentKabupaten.forEach((kab) => {
    const baseP = kab.harga2026 > 0 ? kab.harga2026 : 110000;
    const tw3_25 = kab.hargaTw3_2025 > 0 ? kab.hargaTw3_2025 : Math.round(baseP * 0.96);
    const tw4_25 = kab.hargaTw4_2025 > 0 ? kab.hargaTw4_2025 : Math.round(baseP * 0.98);
    const tw1_26 = kab.hargaTw1_2026 > 0 ? kab.hargaTw1_2026 : baseP;
    const tw2_26 = kab.hargaTw2_2026 > 0 ? kab.hargaTw2_2026 : Math.round(baseP * 1.02);

    rows.push({
      'Kabupaten': `[${kab.kode}] ${kab.nama}`,
      'Harga 2026': baseP,
      'Harga TW III 2025': tw3_25,
      'Harga TW IV 2025': tw4_25,
      'Harga TW I 2026': tw1_26,
      'Harga TW II 2026': tw2_26,
      'Koefisien Variasi': kab.koefisienVariasi || 0,
      'Kode Kualitas 1': komoditas.kode,
      'Kode Kualitas 2': `[${komoditas.kode}] ${komoditas.nama}`,
      'Kode BOQ': `BOQ_${komoditas.kode}`,
      'Nama Komoditas': komoditas.nama,
      'Nama Kualitas': kab.namaKualitas || komoditas.nama,
      'Nama Kualitas/Merk (Alternatif)': kab.namaKualitas || 'Standar',
      'Catatan': '',
      'Harga 2025': Math.round(baseP * 0.95),
      'Kenaikan': parseFloat((((baseP - Math.round(baseP * 0.95)) / Math.round(baseP * 0.95)) * 100).toFixed(2))
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'IKK_Webentry_2026');

  const filename = `Template_IKK_2026_Webentry_${komoditas.kode}_${new Date().toISOString().slice(0, 10)}`;
  if (format === 'csv') {
    XLSX.writeFile(wb, `${filename}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}

