export interface RegisteredAdmin {
  id: string;
  kabupatenKode: string; // e.g. '6101'
  kabupatenNama: string; // e.g. 'Sambas'
  username: string; // e.g. 'admin6101' or 'admin.sambas'
  namaLengkap: string; // e.g. 'Budi Santoso'
  nip?: string;
  password: string; // plain for demo/local storage
  createdAt: string;
  status: 'aktif' | 'nonaktif';
  lastLogin?: string;
}
