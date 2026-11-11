import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  LogIn,
  AlertTriangle,
  Database,
  KeyRound,
  Mail,
  Lock
} from 'lucide-react';
import { KABUPATEN_KALBAR_LIST, PEMILIK_EMAIL, PEMILIK_NAME } from '../data/kabupatenList';
import { UserAuth } from '../types/rekonda';

interface LoginLandingPageProps {
  onLoginOwner: (email: string, name: string) => void;
  onLoginKabupaten: (kode: string, nama: string) => void;
  onEnterAsGuest?: () => void;
  currentUser: UserAuth;
  onClose?: () => void;
}

export const LoginLandingPage: React.FC<LoginLandingPageProps> = ({
  onLoginOwner,
  onLoginKabupaten,
  currentUser,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'kabupaten' | 'pemilik'>('kabupaten');

  // State for Admin Kab/Kota form
  const [selectedKabKode, setSelectedKabKode] = useState<string>('6106');
  const [kabPasswordInput, setKabPasswordInput] = useState<string>('');
  const [kabError, setKabError] = useState<string | null>(null);

  // State for Admin Provinsi form
  const [ownerEmailInput, setOwnerEmailInput] = useState<string>(PEMILIK_EMAIL);
  const [ownerPasswordInput, setOwnerPasswordInput] = useState<string>('');
  const [ownerError, setOwnerError] = useState<string | null>(null);

  // Handle Admin Kab/Kota Login
  const handleKabupatenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKabError(null);

    const found = KABUPATEN_KALBAR_LIST.find((k) => k.kode === selectedKabKode);
    if (!found) {
      setKabError('Kabupaten tidak valid.');
      return;
    }

    const expectedPass = `rekonda${found.kode}`;
    const cleanPass = kabPasswordInput.trim().toLowerCase();

    if (
      cleanPass &&
      cleanPass !== expectedPass &&
      cleanPass !== 'rekonda2026' &&
      cleanPass !== 'rekonda2027' &&
      cleanPass !== 'bpskalbar'
    ) {
      setKabError(`Kata sandi tidak sesuai untuk Admin ${found.nama}.`);
      return;
    }

    onLoginKabupaten(found.kode, found.nama);
    if (onClose) onClose();
  };

  // Handle Admin Provinsi Login
  const handleOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerError(null);
    const email = ownerEmailInput.trim().toLowerCase();

    if (email !== PEMILIK_EMAIL) {
      setOwnerError(`Akun Admin Provinsi khusus untuk ${PEMILIK_EMAIL}`);
      return;
    }

    onLoginOwner(PEMILIK_EMAIL, PEMILIK_NAME);
    if (onClose) onClose();
  };

  const currentSelectedKab = KABUPATEN_KALBAR_LIST.find((k) => k.kode === selectedKabKode);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased overflow-x-hidden">
      {/* Background Construction Image with Clean Gradient Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/assets/construction_bg.jpg"
          alt="Konstruksi & Rekayasa Sipil"
          className="w-full h-full object-cover object-center opacity-30 scale-105 filter brightness-90 contrast-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/90 to-slate-950" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/30">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">REKONDA</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-500/30">
                  IKK 2026/2027
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                BPS Provinsi Kalimantan Barat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              Sistem Masuk Terautentikasi
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-md space-y-6">
          {/* Main Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Portal Rekonsiliasi Data IKK
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Badan Pusat Statistik Provinsi Kalimantan Barat
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl p-5 sm:p-6 space-y-5">
            {/* Tab Selector: Admin Kab/Kota vs Admin Provinsi */}
            <div className="flex p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('kabupaten');
                  setKabError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'kabupaten'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-900/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Admin Kab/Kota</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('pemilik');
                  setOwnerError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'pemilik'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Provinsi</span>
              </button>
            </div>

            {/* TAB 1: FORM LOGIN ADMIN KABUPATEN/KOTA */}
            {activeTab === 'kabupaten' && (
              <form onSubmit={handleKabupatenSubmit} className="space-y-4 animate-in fade-in duration-150">
                {kabError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-xs text-rose-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{kabError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kabupaten / Kota
                  </label>
                  <div className="relative">
                    <select
                      value={selectedKabKode}
                      onChange={(e) => setSelectedKabKode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer appearance-none pr-8"
                    >
                      {KABUPATEN_KALBAR_LIST.map((k) => (
                        <option key={k.kode} value={k.kode} className="bg-slate-900 text-white">
                          [{k.kode}] {k.nama}
                        </option>
                      ))}
                    </select>
                    <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={kabPasswordInput}
                      onChange={(e) => setKabPasswordInput(e.target.value)}
                      placeholder={`rekonda${selectedKabKode}`}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 pr-8"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-900/30 transition-all cursor-pointer mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Buka Aplikasi sebagai Admin {currentSelectedKab?.nama || 'Kabupaten'}</span>
                </button>
              </form>
            )}

            {/* TAB 2: FORM LOGIN ADMIN PROVINSI */}
            {activeTab === 'pemilik' && (
              <form onSubmit={handleOwnerSubmit} className="space-y-4 animate-in fade-in duration-150">
                {ownerError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-xs text-rose-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{ownerError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Admin Provinsi
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={ownerEmailInput}
                      onChange={(e) => setOwnerEmailInput(e.target.value)}
                      placeholder="harga6100@gmail.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 pr-8"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={ownerPasswordInput}
                      onChange={(e) => setOwnerPasswordInput(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 pr-8"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 transition-all cursor-pointer mt-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Buka Aplikasi sebagai Admin Provinsi</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md py-3.5 px-4 text-center text-xs text-slate-500">
        <p>Badan Pusat Statistik Provinsi Kalimantan Barat • Tim Indeks Kemahalan Konstruksi (IKK)</p>
      </footer>
    </div>
  );
};
