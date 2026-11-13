import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Users,
  ShieldCheck,
  Building2,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { KABUPATEN_KALBAR_LIST } from '../data/kabupatenList';
import { RegisteredAdmin } from '../types/userAdmin';
import { UserAuth } from '../types/rekonda';
import {
  getRegisteredAdmins,
  saveRegisteredAdmin,
  deleteRegisteredAdmin,
  generateDefaultAllKabupatenAdmins
} from '../utils/userAdminStorage';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
  currentUser: UserAuth;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
  currentUser
}) => {
  const isPemilik = currentUser.role === 'pemilik' || currentUser.isOwner;
  const isKabupaten = currentUser.role === 'kabupaten';

  const [admins, setAdmins] = useState<RegisteredAdmin[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Form state
  const [formKabKode, setFormKabKode] = useState<string>(
    isKabupaten ? currentUser.kabupatenKode || '6101' : '6101'
  );
  const [formNamaLengkap, setFormNamaLengkap] = useState<string>('');
  const [formUsername, setFormUsername] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formNip, setFormNip] = useState<string>('');
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAdmins = () => {
    setAdmins(getRegisteredAdmins());
  };

  useEffect(() => {
    if (isOpen) {
      loadAdmins();
      setShowForm(false);
      setEditingAdminId(null);
      setErrorMessage(null);
      if (isKabupaten && currentUser.kabupatenKode) {
        setFormKabKode(currentUser.kabupatenKode);
      }
    }
  }, [isOpen, isKabupaten, currentUser.kabupatenKode]);

  if (!isOpen) return null;

  const targetKabList = isPemilik
    ? KABUPATEN_KALBAR_LIST
    : KABUPATEN_KALBAR_LIST.filter((k) => k.kode === currentUser.kabupatenKode);

  const handleOpenAddForm = (defaultKabKode?: string) => {
    const targetKode = isKabupaten
      ? (currentUser.kabupatenKode || '6101')
      : (defaultKabKode || '6101');
    const foundKab = KABUPATEN_KALBAR_LIST.find((k) => k.kode === targetKode);
    setFormKabKode(targetKode);
    setFormUsername(`admin${targetKode}`);
    setFormNamaLengkap(`Petugas BPS ${foundKab?.nama || ''}`);
    setFormPassword(`rekonda${targetKode}`);
    setFormNip('');
    setEditingAdminId(null);
    setErrorMessage(null);
    setShowForm(true);
  };

  const handleOpenEditForm = (admin: RegisteredAdmin) => {
    // If kabupaten admin, only allow editing their own account
    if (isKabupaten && admin.kabupatenKode !== currentUser.kabupatenKode) {
      alert('Akses Ditolak: Anda hanya berhak mengelola akun untuk wilayah Anda sendiri.');
      return;
    }

    setFormKabKode(admin.kabupatenKode);
    setFormUsername(admin.username);
    setFormNamaLengkap(admin.namaLengkap);
    setFormPassword(admin.password);
    setFormNip(admin.nip || '');
    setEditingAdminId(admin.id);
    setErrorMessage(null);
    setShowForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const actualKode = isKabupaten ? (currentUser.kabupatenKode || formKabKode) : formKabKode;
    const foundKab = KABUPATEN_KALBAR_LIST.find((k) => k.kode === actualKode);
    if (!foundKab) {
      setErrorMessage('Pilih Kabupaten/Kota yang valid.');
      return;
    }

    if (!formUsername.trim()) {
      setErrorMessage('Username/ID Pengguna wajib diisi.');
      return;
    }

    if (!formPassword.trim()) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }

    // Check duplicate username if adding new
    const existing = admins.find(
      (a) => a.username.toLowerCase() === formUsername.trim().toLowerCase() && a.id !== editingAdminId
    );
    if (existing) {
      setErrorMessage(`Username "${formUsername}" sudah digunakan oleh wilayah [${existing.kabupatenKode}] ${existing.kabupatenNama}.`);
      return;
    }

    const newAdminObj: RegisteredAdmin = {
      id: editingAdminId || `admin_${actualKode}_${Date.now()}`,
      kabupatenKode: actualKode,
      kabupatenNama: foundKab.nama,
      username: formUsername.trim(),
      namaLengkap: formNamaLengkap.trim() || `Admin BPS ${foundKab.nama}`,
      nip: formNip.trim() || undefined,
      password: formPassword.trim(),
      createdAt: editingAdminId
        ? admins.find((a) => a.id === editingAdminId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      status: 'aktif'
    };

    saveRegisteredAdmin(newAdminObj);
    loadAdmins();
    setShowForm(false);
    if (onSuccessToast) {
      onSuccessToast(
        editingAdminId
          ? `Akun Admin [${actualKode}] ${foundKab.nama} berhasil diperbarui.`
          : `Akun Admin [${actualKode}] ${foundKab.nama} berhasil didaftarkan!`
      );
    }
  };

  const handleDelete = (admin: RegisteredAdmin) => {
    if (isKabupaten && admin.kabupatenKode !== currentUser.kabupatenKode) {
      alert('Akses Ditolak: Anda hanya berhak menghapus akun wilayah Anda sendiri.');
      return;
    }

    if (confirm(`Yakin ingin menghapus akun Admin untuk [${admin.kabupatenKode}] ${admin.kabupatenNama}? Setelah dihapus, admin wilayah ini tidak dapat masuk sampai didaftarkan kembali.`)) {
      deleteRegisteredAdmin(admin.id);
      loadAdmins();
      if (onSuccessToast) {
        onSuccessToast(`Akun Admin [${admin.kabupatenKode}] ${admin.kabupatenNama} telah dihapus.`);
      }
    }
  };

  const handleBatchGenerate = () => {
    if (!isPemilik) {
      alert('Akses Terbatas: Inisialisasi otomatis seluruh 14 kabupaten/kota hanya diperuntukkan bagi Admin Provinsi.');
      return;
    }

    if (confirm('Buat otomatis akun Admin untuk seluruh 14 Kabupaten/Kota yang belum terdaftar? Akun akan dibuat dengan username standar (admin61xx) dan password (rekonda61xx).')) {
      const updated = generateDefaultAllKabupatenAdmins();
      setAdmins(updated);
      if (onSuccessToast) {
        onSuccessToast('Berhasil mendaftarkan akun Admin untuk seluruh 14 Kabupaten/Kota!');
      }
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const registeredCount = admins.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header Modal */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-md">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>
                  {isPemilik
                    ? 'Manajemen User Admin Kab/Kota (14 Wilayah)'
                    : `Kelola Akun Admin [${currentUser.kabupatenKode}] ${currentUser.kabupatenNama}`}
                </span>
                <span className="text-[11px] bg-rose-500/20 text-rose-300 font-semibold px-2 py-0.5 rounded border border-rose-500/30">
                  {isPemilik
                    ? `${registeredCount} / 14 Wilayah Terdaftar`
                    : `Wilayah: ${currentUser.kabupatenNama || currentUser.kabupatenKode}`}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isPemilik
                  ? 'Admin Provinsi memiliki hak penuh untuk mengelola, menambah, dan mereset kredensial admin 14 Kabupaten/Kota'
                  : `Anda hanya memiliki hak akses untuk mengelola akun admin wilayah [${currentUser.kabupatenKode}] ${currentUser.kabupatenNama}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-600">
            {isPemilik ? (
              registeredCount < 14 ? (
                <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Masih ada {14 - registeredCount} Kabupaten/Kota yang belum memiliki akun admin.
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Seluruh 14 Kabupaten/Kota telah memiliki akun admin terdaftar.
                </span>
              )
            ) : (
              <span className="flex items-center gap-1.5 text-sky-800 font-semibold">
                <Building2 className="w-4 h-4 text-sky-600" />
                Khusus Akun Admin BPS Kabupaten/Kota [{currentUser.kabupatenKode}] {currentUser.kabupatenNama}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isPemilik && (
              <button
                type="button"
                onClick={handleBatchGenerate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 border border-amber-500/40 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Inisialisasi Otomatis 14 Kab/Kota</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenAddForm(isKabupaten ? currentUser.kabupatenKode || undefined : undefined)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isKabupaten ? 'Ubah / Daftarkan Akun' : 'Tambah User Admin'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {/* Add / Edit Form Modal Sub-panel */}
          {showForm && (
            <div className="mb-5 bg-rose-50/40 border border-rose-200 rounded-xl p-4 shadow-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-rose-200/80 pb-2.5 mb-3">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-rose-600" />
                  <span>{editingAdminId ? 'Edit Akun Admin Kab/Kota' : 'Form Pendaftaran User Admin Baru'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
              </div>

              {errorMessage && (
                <div className="mb-3 p-2.5 bg-rose-100 border border-rose-300 rounded text-xs text-rose-800 font-medium">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Kabupaten */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kabupaten / Kota:
                  </label>
                  <select
                    value={formKabKode}
                    onChange={(e) => {
                      setFormKabKode(e.target.value);
                      if (!editingAdminId) {
                        setFormUsername(`admin${e.target.value}`);
                        setFormPassword(`rekonda${e.target.value}`);
                        const k = targetKabList.find((item) => item.kode === e.target.value);
                        setFormNamaLengkap(`Petugas BPS ${k?.nama || ''}`);
                      }
                    }}
                    disabled={Boolean(editingAdminId) || isKabupaten}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {targetKabList.map((k) => (
                      <option key={k.kode} value={k.kode}>
                        [{k.kode}] {k.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nama Petugas */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Petugas / PIC:
                  </label>
                  <input
                    type="text"
                    value={formNamaLengkap}
                    onChange={(e) => setFormNamaLengkap(e.target.value)}
                    placeholder="Nama Petugas Rekon"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Username / ID Login:
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Contoh: admin6101"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kata Sandi Login:
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Kata Sandi Akun"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                {/* NIP (Opsional) */}
                <div className="sm:col-span-2 flex items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-slate-500">
                    * Catat atau bagikan kredensial di atas kepada petugas Admin Kabupaten/Kota bersangkutan.
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {editingAdminId ? 'Simpan Perubahan' : 'Daftarkan User Admin'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table List of 14 Kab/Kota */}
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none">
                  <th className="py-2.5 px-3 w-12 text-center">No</th>
                  <th className="py-2.5 px-3">Kabupaten / Kota</th>
                  <th className="py-2.5 px-3">Nama Petugas</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Kata Sandi</th>
                  <th className="py-2.5 px-3 text-center">Status Akun</th>
                  <th className="py-2.5 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {targetKabList.map((kab, idx) => {
                  const regAdmin = admins.find((a) => a.kabupatenKode === kab.kode);
                  const isRegistered = Boolean(regAdmin);
                  const isPassVisible = regAdmin ? Boolean(showPasswords[regAdmin.id]) : false;

                  return (
                    <tr
                      key={kab.kode}
                      className={`hover:bg-slate-50 transition-colors ${
                        isRegistered ? 'bg-white' : 'bg-slate-50/40 text-slate-400'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <span className="font-mono text-slate-500 text-[10px]">[{kab.kode}]</span>
                          <span>{kab.nama}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-slate-700">
                        {isRegistered ? regAdmin?.namaLengkap : <span className="text-slate-400 italic">Belum didaftarkan</span>}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                        {isRegistered ? (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {regAdmin?.username}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-mono">
                        {isRegistered && regAdmin ? (
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-slate-800">
                              {isPassVisible ? regAdmin.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(regAdmin.id)}
                              title={isPassVisible ? 'Sembunyikan' : 'Lihat Sandi'}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {isRegistered ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            Belum Ada
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {isRegistered && regAdmin ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditForm(regAdmin)}
                              title="Edit Kredensial"
                              className="p-1.5 rounded text-amber-700 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(regAdmin)}
                              title="Hapus Akun"
                              className="p-1.5 rounded text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenAddForm(kab.kode)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded transition-colors cursor-pointer"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Daftarkan</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500">
          <div>
            Kredensial disimpan secara aman di sistem. Admin Kabupaten/Kota dapat login menggunakan username atau pilihan wilayah & kata sandi terdaftar.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
