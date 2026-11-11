import React from 'react';
import {
  Database,
  Printer,
  Upload,
  User,
  ShieldCheck,
  AlertTriangle,
  LayoutDashboard,
  SlidersHorizontal,
  Building2,
  LogIn,
  LogOut,
  Lock
} from 'lucide-react';
import { UserAuth } from '../types/rekonda';

interface HeaderNavProps {
  onRefresh: () => void;
  onPrint: () => void;
  isRefreshing?: boolean;
  currentUser: UserAuth;
  onOpenAuth: () => void;
  onOpenLandingLogin: () => void;
  onOpenUpload: () => void;
  onOpenDisplayAdjust: () => void;
  activeView: 'rekon_daerah' | 'anomali_rekon';
  onSelectView: (view: 'rekon_daerah' | 'anomali_rekon') => void;
  anomalyCount: number;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  onRefresh,
  onPrint,
  isRefreshing,
  currentUser,
  onOpenAuth,
  onOpenLandingLogin,
  onOpenUpload,
  onOpenDisplayAdjust,
  activeView,
  onSelectView,
  anomalyCount
}) => {
  const isPemilik = currentUser.role === 'pemilik' || currentUser.isOwner;
  const isKabupaten = currentUser.role === 'kabupaten';

  const handleUploadClick = () => {
    if (!isPemilik) {
      alert('Akses Terbatas: Fitur Upload Dokumen & Template hanya diperuntukkan bagi Admin Provinsi (BPS Kalbar). Akun Admin Kab/Kota berfokus pada verifikasi Tabel Anomali Rekon.');
      return;
    }
    onOpenUpload();
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm print:hidden sticky top-0 z-40">
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-6">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenLandingLogin}
              title="Kembali ke Menu Login / Portal Landing Page"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-rose-600 hover:bg-rose-500 flex items-center justify-center shadow-md transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={onOpenLandingLogin}
                  className="font-bold text-base sm:text-lg tracking-tight text-white hover:text-rose-300 transition-colors cursor-pointer text-left"
                >
                  REKONDA
                </button>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.2 rounded border border-rose-500/30">
                  IKK 2026/2027
                </span>
                {isKabupaten && currentUser.kabupatenKode && (
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-1.5 py-0.2 rounded border border-sky-500/30 hidden md:inline">
                    Admin: [{currentUser.kabupatenKode}] {currentUser.kabupatenNama}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden md:block">
                Rekonsiliasi Data Harga Konsumen Konstruksi (Lintas Tahun)
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop / Tablet view) */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700/80">
            <button
              type="button"
              onClick={() => onSelectView('rekon_daerah')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeView === 'rekon_daerah'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Rekon Daerah</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectView('anomali_rekon')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer relative ${
                activeView === 'anomali_rekon'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>Tabel Anomali Rekon</span>
              {anomalyCount > 0 && (
                <span className="ml-1 bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {anomalyCount}
                </span>
              )}
            </button>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Display Adjuster Button */}
            <button
              type="button"
              onClick={onOpenDisplayAdjust}
              title="Atur Tampilan Layar & Kerapatan (Display Adjuster)"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-md border border-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">Tampilan</span>
            </button>

            {/* Upload Dokumen & Template button (Admin Provinsi Only) */}
            <button
              type="button"
              onClick={handleUploadClick}
              title={
                isPemilik
                  ? 'Upload Dokumen & Unduh Template (Tabel 7.1 & IKK Responden)'
                  : 'Upload Dokumen Khusus Admin Provinsi'
              }
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer border ${
                isPemilik
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-300'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload &amp; Template</span>
              {!isPemilik && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
            </button>

            {/* Print button */}
            <button
              type="button"
              onClick={onPrint}
              title="Cetak Halaman (Print / PDF)"
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-md border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            {/* Menu Login / Akun Selector */}
            {currentUser.isLoggedIn ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-md border transition-colors cursor-pointer ${
                    isPemilik
                      ? 'bg-rose-950/80 text-rose-200 border-rose-800 hover:bg-rose-900'
                      : 'bg-sky-950/80 text-sky-200 border-sky-800 hover:bg-sky-900'
                  }`}
                  title="Lihat Detail Akun"
                >
                  {isPemilik ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span className="max-w-[70px] sm:max-w-[120px] truncate">Admin Provinsi</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-3.5 h-3.5 text-sky-400" />
                      <span className="max-w-[70px] sm:max-w-[110px] truncate">
                        Admin {currentUser.kabupatenNama || currentUser.kabupatenKode}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onOpenLandingLogin}
                  title="Buka Menu Login / Ganti Peran Wilayah"
                  className="px-2 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors cursor-pointer"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLandingLogin}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-md border border-rose-500/60 bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Menu Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile View Switcher Tabs (Shown on small screens) */}
        <div className="sm:hidden pb-2.5 pt-0.5">
          <div className="grid grid-cols-2 gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700/80">
            <button
              type="button"
              onClick={() => onSelectView('rekon_daerah')}
              className={`inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeView === 'rekon_daerah'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Rekon Daerah</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectView('anomali_rekon')}
              className={`inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer relative ${
                activeView === 'anomali_rekon'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>Anomali Rekon</span>
              {anomalyCount > 0 && (
                <span className="ml-1 bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {anomalyCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
