import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Upload,
  FileSpreadsheet,
  SlidersHorizontal,
  LogOut,
  LogIn,
  Database,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Layers,
  FileDown
} from 'lucide-react';
import { UserAuth } from '../types/rekonda';

interface SidebarProps {
  activeView: 'rekon_daerah' | 'anomali_rekon';
  onSelectView: (view: 'rekon_daerah' | 'anomali_rekon') => void;
  anomalyCount: number;
  currentUser: UserAuth;
  onOpenAuth: () => void;
  onOpenLandingLogin: () => void;
  onOpenUpload: () => void;
  onOpenDisplayAdjust: () => void;
  onOpenUserManagement: () => void;
  onDownloadSeluruhKualitas: () => void;
  onDownloadSeluruhResponden: () => void;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  anomalyCount,
  currentUser,
  onOpenAuth,
  onOpenLandingLogin,
  onOpenUpload,
  onOpenDisplayAdjust,
  onOpenUserManagement,
  onDownloadSeluruhKualitas,
  onDownloadSeluruhResponden,
  onLogout,
  isMobileOpen,
  onCloseMobile
}) => {
  const isPemilik = currentUser.role === 'pemilik' || currentUser.isOwner;
  const isKabupaten = currentUser.role === 'kabupaten';

  const handleUploadClick = () => {
    if (!isPemilik) {
      alert('Akses Terbatas: Fitur Upload Dokumen & Template hanya diperuntukkan bagi Admin Provinsi (BPS Kalbar).');
      return;
    }
    onOpenUpload();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-45 lg:hidden animate-in fade-in duration-150"
        />
      )}

      {/* Fixed Uncollapsed Sidebar (Desktop: always visible, Mobile: slide in when toggled) */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 text-white z-50 flex flex-col justify-between shadow-xl select-none transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding Section */}
        <div>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenLandingLogin}
                title="Buka Portal Login / Landing Page"
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-700 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-950/40 shrink-0 cursor-pointer hover:scale-105 transition-transform"
              >
                <Database className="w-5 h-5 text-white" />
              </button>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white font-mono">
                    REKONDA
                  </span>
                  <span className="text-[10px] bg-rose-500/25 text-rose-300 font-bold px-1.5 py-0.2 rounded border border-rose-500/30">
                    2026/2027
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  BPS Prov. Kalimantan Barat
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

        {/* Current Active Account Status */}
        <div className="px-3 py-2.5 bg-slate-950/40 border-b border-slate-800/80 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Hak Akses Aktif
            </span>
            {currentUser.isLoggedIn ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Aktif
              </span>
            ) : (
              <span className="text-[10px] text-amber-400 font-medium">Tamu (Read-only)</span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              {isPemilik ? (
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              ) : isKabupaten ? (
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <Users className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <div className="truncate">
              <div className="font-bold text-slate-200 text-xs truncate">
                {isPemilik
                  ? 'Admin Provinsi (Kalbar)'
                  : isKabupaten
                  ? `Admin [${currentUser.kabupatenKode}]`
                  : 'Pengguna Publik'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {isPemilik
                  ? currentUser.email || 'harga6100@gmail.com'
                  : isKabupaten
                  ? currentUser.kabupatenNama || 'Petugas Kab/Kota'
                  : 'Masuk untuk mengedit'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation Menu (Uncollapsed Fixed Sidebar) */}
        <div className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-280px)]">
          {/* Group 1: Modul Utama */}
          <div>
            <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Menu Utama
            </div>
            <nav className="space-y-1">
              {/* Menu 1: Rekon Daerah */}
              <button
                type="button"
                onClick={() => onSelectView('rekon_daerah')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeView === 'rekon_daerah'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <div className="flex-1 truncate">
                  <div className="font-bold">Rekon Daerah</div>
                  <div className="text-[10px] opacity-80 font-normal truncate">
                    Data 14 Kab/Kota & Grafik
                  </div>
                </div>
              </button>

              {/* Menu 2: Tabel Anomali Rekon */}
              <button
                type="button"
                onClick={() => onSelectView('anomali_rekon')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  activeView === 'anomali_rekon'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
                <div className="flex-1 truncate">
                  <div className="font-bold flex items-center justify-between">
                    <span>Tabel Anomali Rekon</span>
                    {anomalyCount > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs">
                        {anomalyCount}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] opacity-80 font-normal truncate">
                    CV &gt;20% &amp; Rasio &lt;80% / &gt;120%
                  </div>
                </div>
              </button>
            </nav>
          </div>

          {/* Group 2: Administrasi & Akun */}
          <div>
            <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Manajemen Pengguna
            </div>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={onOpenUserManagement}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
              >
                <Users className="w-4 h-4 shrink-0 text-sky-400" />
                <div className="flex-1 truncate">
                  <div className="font-semibold text-slate-200">
                    {isPemilik
                      ? 'Kelola User Admin'
                      : isKabupaten
                      ? `Kelola Akun [${currentUser.kabupatenKode}]`
                      : 'Kelola User Admin'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isPemilik
                      ? 'Tambah / Edit 14 Kab/Kota'
                      : isKabupaten
                      ? currentUser.kabupatenNama || 'Admin Wilayah'
                      : 'Login Admin'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleUploadClick}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                  isPemilik
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <Upload className="w-4 h-4 shrink-0 text-emerald-400" />
                <div className="flex-1 truncate">
                  <div className="font-semibold text-slate-200">Upload Data &amp; Template</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isPemilik ? 'Unggah Excel / CSV' : 'Khusus Admin Provinsi'}
                  </div>
                </div>
              </button>
            </nav>
          </div>

          {/* Group 3: Ekspor Data */}
          <div>
            <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Ekspor Data Seluruh
            </div>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={onDownloadSeluruhKualitas}
                title="Download Excel seluruh 89 kualitas/komoditas rekon"
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span className="truncate">Unduh Seluruh Kualitas</span>
              </button>

              <button
                type="button"
                onClick={onDownloadSeluruhResponden}
                title="Download Excel seluruh 26.395 responden di 89 kualitas/komoditas"
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                <span className="truncate">Unduh Seluruh Responden</span>
              </button>

              <button
                type="button"
                onClick={onOpenDisplayAdjust}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                <span className="truncate">Sesuaikan Tampilan</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom User Action Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
        {currentUser.isLoggedIn ? (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onOpenLandingLogin}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-700"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Ganti Akun</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              title="Keluar dari Akun"
              className="inline-flex items-center justify-center p-1.5 text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenLandingLogin}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk / Buka Portal Login</span>
          </button>
        )}
      </div>
    </aside>
  </>
  );
};
