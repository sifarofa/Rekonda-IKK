export interface KabupatenKalbarItem {
  kode: string;
  nama: string;
  ibukota: string;
  defaultPassword?: string;
}

export const KABUPATEN_KALBAR_LIST: KabupatenKalbarItem[] = [
  { kode: '6101', nama: 'SAMBAS', ibukota: 'Sambas' },
  { kode: '6102', nama: 'BENGKAYANG', ibukota: 'Bengkayang' },
  { kode: '6103', nama: 'LANDAK', ibukota: 'Ngabang' },
  { kode: '6104', nama: 'MEMPAWAH', ibukota: 'Mempawah' },
  { kode: '6105', nama: 'SANGGAU', ibukota: 'Sanggau' },
  { kode: '6106', nama: 'KETAPANG', ibukota: 'Ketapang' },
  { kode: '6107', nama: 'SINTANG', ibukota: 'Sintang' },
  { kode: '6108', nama: 'KAPUAS HULU', ibukota: 'Putussibau' },
  { kode: '6109', nama: 'SEKADAU', ibukota: 'Sekadau' },
  { kode: '6110', nama: 'MELAWI', ibukota: 'Nanga Pinoh' },
  { kode: '6111', nama: 'KAYONG UTARA', ibukota: 'Sukadana' },
  { kode: '6112', nama: 'KUBU RAYA', ibukota: 'Sungai Raya' },
  { kode: '6171', nama: 'KOTA PONTIANAK', ibukota: 'Pontianak' },
  { kode: '6172', nama: 'KOTA SINGKAWANG', ibukota: 'Singkawang' }
];

export const PEMILIK_EMAIL = 'harga6100@gmail.com';
export const PEMILIK_NAME = 'Admin Provinsi (BPS Kalbar)';
