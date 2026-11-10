import React from 'react';
import {
  Database,
  Printer,
  RefreshCw,
  Upload,
  Lock,
  User,
  ShieldCheck,
  AlertTriangle,
  LayoutDashboard
} from 'lucide-react';
import { UserAuth } from '../types/rekonda';

interface HeaderNavProps {
  onRefresh: () => void;
  onPrint: () => void;
  isRefreshing?: boolean;
  currentUser: UserAuth;
  onOpenAuth: () => void;
  onOpenUpload: () => void;
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
  onOpenUpload,
  activeView,
  onSelectView,
  anomalyCount
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm print:hidden sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center shadow-md">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">REKONDA</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-500/30">
                  IKK 2026/2027
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Rekonsiliasi Data Harga Konsumen Konstruksi (Lintas Tahun)
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Rekon Daerah vs Tabel Anomali Rekon) */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700/80">
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
          <div className="flex items-center gap-2 shrink-0">
            {/* Upload Dokumen & Template button */}
            <button
              type="button"
              onClick={onOpenUpload}
              title="Upload Dokumen & Unduh Template (Tabel 7.1 & IKK Responden)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer border bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload & Template</span>
            </button>

            {/* Print button */}
            <button
              type="button"
              onClick={onPrint}
              title="Cetak Halaman (Print / PDF)"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-md border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            {/* User Account / Google Login button */}
            <button
              type="button"
              onClick={onOpenAuth}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md border transition-colors cursor-pointer ${
                currentUser.isLoggedIn
                  ? currentUser.isOwner
                    ? 'bg-rose-950/80 text-rose-200 border-rose-800 hover:bg-rose-900'
                    : 'bg-sky-950/80 text-sky-200 border-sky-800 hover:bg-sky-900'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {currentUser.isLoggedIn ? (
                currentUser.isOwner ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="max-w-[110px] truncate">Pemilik</span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    <span className="max-w-[100px] truncate">{currentUser.name || 'User'}</span>
                  </>
                )
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Masuk Google</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
