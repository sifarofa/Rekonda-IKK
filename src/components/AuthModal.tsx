import React, { useState } from 'react';
import { X, ShieldCheck, UserCheck, LogIn, Lock, LogOut } from 'lucide-react';
import { UserAuth } from '../types/rekonda';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAuth;
  onLogin: (email: string, name: string) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [activeTab, setActiveTab] = useState<'quick' | 'custom'>('quick');

  if (!isOpen) return null;

  const handleQuickLoginOwner = () => {
    onLogin('harga6100@gmail.com', 'Pemilik Akun (Admin Rekonda)');
    onClose();
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    onLogin(customEmail.trim().toLowerCase(), customName.trim() || customEmail.split('@')[0]);
    onClose();
  };

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
              <h4 className="text-sm font-bold text-white">Autentikasi & Hak Akses Akun</h4>
              <p className="text-[11px] text-slate-400">Google Account Sign-In</p>
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
        <div className="p-5">
          {currentUser.isLoggedIn ? (
            <div className="mb-5 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Sedang Masuk Sebagai:
                  </span>
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-bold text-slate-900">{currentUser.name}</strong>
                    {currentUser.isOwner ? (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-amber-600" /> Pemilik Akun
                      </span>
                    ) : (
                      <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded border border-sky-300">
                        Pengguna (Akses Catatan)
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
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold p-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-600">
                {currentUser.isOwner ? (
                  <p className="text-emerald-700 font-medium">
                    ✓ Anda memiliki akses penuh: Upload berkas Excel (rekonda26 & tabel 7.1), edit data responden, kelola status anomali rekon, dan edit catatan.
                  </p>
                ) : (
                  <p className="text-sky-700 font-medium">
                    ✓ Anda memiliki akses untuk menulis dan memperbarui Catatan Rekonda. Akses upload dokumen hanya diperuntukkan bagi pemilik akun.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Anda saat ini belum masuk (Tamu)</strong>
                <span className="text-[11px] text-amber-800">
                  Secara default, publik dapat melihat dashboard & grafik. Masuk dengan akun Google untuk menulis catatan, atau masuk sebagai pemilik untuk akses upload berkas.
                </span>
              </div>
            </div>
          )}

          {/* Login Options */}
          {!currentUser.isLoggedIn && (
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('quick')}
                  className={`flex-1 py-1.5 rounded-md transition-all ${
                    activeTab === 'quick' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Masuk sebagai Pemilik
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('custom')}
                  className={`flex-1 py-1.5 rounded-md transition-all ${
                    activeTab === 'custom' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Akun Google Lain
                </button>
              </div>

              {activeTab === 'quick' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Akun Resmi Pemilik (Verified)
                    </span>
                    <p className="font-mono font-bold text-slate-800 text-sm">
                      harga6100@gmail.com
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Membuka semua hak istimewa (Upload dokumen rekonda26, tabel 7.1, verifikasi status anomali).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickLoginOwner}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Masuk sebagai Pemilik (harga6100@gmail.com)</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCustomLogin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Petugas / Pengguna
                    </label>
                    <input
                      type="text"
                      required
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Contoh: Petugas BPS / Staf PUPR"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Akun Google
                    </label>
                    <input
                      type="email"
                      required
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="contoh@gmail.com"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Masuk dengan Google (Akses Catatan)</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Close */}
          <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
