import React from 'react';
import { X, ShieldCheck, Building2, LogIn, Lock, LogOut, ArrowRight, User } from 'lucide-react';
import { UserAuth } from '../types/rekonda';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAuth;
  onOpenLandingLogin: () => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenLandingLogin,
  onLogout
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Status &amp; Hak Akses Akun</h4>
              <p className="text-[11px] text-slate-400">Portal Rekonda IKK Kalbar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Status */}
        <div className="p-5 space-y-4">
          {currentUser.isLoggedIn ? (
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Sedang Masuk Sebagai:
                  </span>
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-bold text-slate-900">{currentUser.name}</strong>
                    {currentUser.role === 'pemilik' || currentUser.isOwner ? (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded border border-rose-300 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-rose-600" /> Admin Provinsi
                      </span>
                    ) : (
                      <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded border border-sky-300 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-sky-600" /> Admin BPS {currentUser.kabupatenNama || currentUser.kabupatenKode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold p-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-600">
                {currentUser.role === 'pemilik' || currentUser.isOwner ? (
                  <p className="text-emerald-700 font-medium">
                    ✓ <strong>Hak Akses Admin Provinsi:</strong> Upload berkas Excel (Tabel 7.1 &amp; IKK Rekonda 2026), monitoring status rekonsiliasi seluruh 14 kabupaten/kota se-Kalbar, dan verifikasi status.
                  </p>
                ) : (
                  <p className="text-sky-800 font-medium">
                    ✓ <strong>Hak Akses Admin Kab/Kota:</strong> Mengakses Tabel Anomali Rekon khusus wilayah [{currentUser.kabupatenKode}] {currentUser.kabupatenNama}, mengisi justifikasi lapangan, dan mengubah status rekon.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Anda saat ini dalam Mode Tamu (Pratinjau)</strong>
                <span className="text-[11px] text-amber-800">
                  Untuk mengunggah berkas atau memperbarui catatan justifikasi dan status anomali rekon di kabupaten/kota Anda, silakan masuk melalui Menu Login.
                </span>
              </div>
            </div>
          )}

          {/* Action to switch account or open landing login */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLandingLogin();
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{currentUser.isLoggedIn ? 'Ganti Peran / Buka Menu Login' : 'Buka Menu Login Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Close */}
          <div className="pt-2 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
