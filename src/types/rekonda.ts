export interface RespondenData {
  id: string;
  tahun: number;      // 2026, 2027 (atau 2025 untuk data tahun lalu)
  triwulan: number;   // 1, 2, 3, 4
  nama: string;       // Nama toko / distributor
  merk: string;       // Merek / kualitas spesifik
  harga: number;      // Harga riil transaksi
}

export type StatusRekon =
  | 'belum_rekon'
  | 'konfirmasi_lapangan'
  | 'anomali_terjustifikasi'
  | 'rekon_selesai';

export interface KabupatenRekon {
  id: string;
  kode: string;
  nama: string;
  
  // Data Tahun Berjalan (IKK 2027: TW III 2026 s/d TW II 2027)
  harga2027: number;        // Rata-rata tahun berjalan (dari TW yang tersedia)
  hargaTw3_2026: number;
  hargaTw4_2026: number;
  hargaTw1_2027: number;
  hargaTw2_2027: number;
  
  // Variasi & Merek
  koefisienVariasi: number; // CV variasi harga antar responden di kab/kota (tahun berjalan)
  namaKualitas: string;    // Merek yang paling banyak muncul (mode)
  
  // Data Tahun Lalu (Base: TW III 2025, TW IV 2025, TW I 2026, TW II 2026 dari rekonda26)
  harga2026: number;        // Rata-rata tahun lalu (sheet rekonda26)
  hargaTw3_2025: number;
  hargaTw4_2025: number;
  hargaTw1_2026: number;
  hargaTw2_2026: number;
  
  // Rasio & Catatan
  rasio: number;            // (Harga 2027 / Harga 2026) * 100
  catatan: string;          // Catatan lapangan / justifikasi
  
  // Anomali & Rekon
  statusRekon: StatusRekon;
  aksiRekon?: string;       // Tindak lanjut / konfirmasi yang dilakukan
  isVerified?: boolean;
  
  // Responden mikro
  respondents: RespondenData[];
}

export interface Komoditas {
  kode: string;
  nama: string;
  satuan: string;
  kategori: string;
}

export interface Provinsi {
  kode: string;
  nama: string;
  kabupatenList: string[];
}

export type UserRole = 'pemilik' | 'kabupaten' | 'tamu';

export interface UserAuth {
  isLoggedIn: boolean;
  email: string | null;
  name: string | null;
  isOwner: boolean; // true if role === 'pemilik' or email === 'harga6100@gmail.com'
  role: UserRole;
  kabupatenKode?: string | null; // e.g. '6101', '6106'
  kabupatenNama?: string | null; // e.g. 'SAMBAS', 'KETAPANG'
}


export type DisplayDensity = 'compact' | 'normal' | 'comfortable';
export type DisplayScale = 'small' | 'normal' | 'large';
export type DisplayWidth = 'contained' | 'full';

export interface DisplaySettings {
  density: DisplayDensity;
  scale: DisplayScale;
  width: DisplayWidth;
}

