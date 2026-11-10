import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  FileSpreadsheet,
  Users,
  Building2,
  TrendingUp,
  BarChart2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Komoditas, Provinsi, KabupatenRekon } from '../types/rekonda';
import { formatRupiahCurrency, formatPercent } from '../utils/formatters';

interface FilterSectionProps {
  provinsiList: Provinsi[];
  selectedProvinsi: Provinsi;
  onSelectProvinsi: (prov: Provinsi) => void;
  komoditasList: Komoditas[];
  selectedKomoditas: Komoditas;
  onSelectKomoditas: (kom: Komoditas) => void;
  currentIndex: number;
  totalKomoditas: number;
  onPrevKomoditas: () => void;
  onNextKomoditas: () => void;
  onTampilkan: () => void;
  isLoading: boolean;
  onDownloadSeluruhKualitas: () => void;
  onDownloadSeluruhResponden: () => void;
  data: KabupatenRekon[];
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  provinsiList,
  selectedProvinsi,
  onSelectProvinsi,
  komoditasList,
  selectedKomoditas,
  onSelectKomoditas,
  currentIndex,
  totalKomoditas,
  onPrevKomoditas,
  onNextKomoditas,
  onTampilkan,
  isLoading,
  onDownloadSeluruhKualitas,
  onDownloadSeluruhResponden,
  data
}) => {
  // Summary calculations for 2026/2027
  const validPrices2027 = data.map((d) => d.harga2027).filter((p) => p > 0);
  const avgPrice2027 =
    validPrices2027.length > 0 ? Math.round(validPrices2027.reduce((a, b) => a + b, 0) / validPrices2027.length) : 0;
  
  const minPrice = validPrices2027.length > 0 ? Math.min(...validPrices2027) : 0;
  const maxPrice = validPrices2027.length > 0 ? Math.max(...validPrices2027) : 0;
  const verifiedCount = data.filter((d) => d.statusRekon === 'rekon_selesai' || d.isVerified).length;
  const anomalyCount = data.filter((d) => d.koefisienVariasi > 10 || d.rasio > 106 || d.rasio < 95).length;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden mb-5 w-full">
      {/* Banner Header Title (Iconic Crimson Header) */}
      <div className="bg-gradient-to-r from-[#c02652] via-[#b91c47] to-[#9f1239] px-5 py-3 text-white flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-5 bg-white/40 rounded-full" />
          <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-xs">
            Rekon Daerah
          </h1>
          <span className="text-[11px] bg-white/20 text-white font-semibold px-2 py-0.5 rounded-full ml-1">
            IKK Periode: TW III/IV 2026 s/d TW I/II 2027
          </span>
        </div>

        <div className="text-xs text-rose-100 hidden md:flex items-center gap-3">
          <span>
            Provinsi: <strong className="text-white">[{selectedProvinsi.kode}] {selectedProvinsi.nama}</strong>
          </span>
          <span>·</span>
          <span>
            Komoditas: <strong className="text-white">[{selectedKomoditas.kode}] {selectedKomoditas.nama}</strong>
          </span>
        </div>
      </div>

      {/* Control Bar (Auto-fit layout) */}
      <div className="p-4 bg-white border-b border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Provinsi Selector */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Pilih Provinsi
            </label>
            <div className="relative">
              <select
                value={selectedProvinsi.kode}
                onChange={(e) => {
                  const found = provinsiList.find((p) => p.kode === e.target.value);
                  if (found) onSelectProvinsi(found);
                }}
                className="w-full appearance-none bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all cursor-pointer shadow-2xs"
              >
                {provinsiList.map((p) => (
                  <option key={p.kode} value={p.kode}>
                    [{p.kode}] {p.nama}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Komoditas Selector & Stepper */}
          <div className="md:col-span-5">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Kualitas / Komoditas Rekon
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
              <div className="relative flex-1">
                <select
                  value={selectedKomoditas.kode}
                  onChange={(e) => {
                    const found = komoditasList.find((k) => k.kode === e.target.value);
                    if (found) onSelectKomoditas(found);
                  }}
                  className="w-full appearance-none bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all cursor-pointer shadow-2xs truncate pr-7"
                >
                  {komoditasList.map((k) => (
                    <option key={k.kode} value={k.kode}>
                      [{k.kode}] {k.nama} {k.satuan ? `(${k.satuan})` : ''}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Stepper Buttons (Yellow Buttons from screenshot) */}
              <div className="flex items-center gap-1 shrink-0 self-center sm:self-auto">
                <button
                  type="button"
                  onClick={onPrevKomoditas}
                  title="Komoditas Sebelumnya"
                  className="inline-flex items-center gap-0.5 px-2.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg shadow-2xs border border-amber-500/40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <div className="px-2 py-1.5 text-xs font-mono font-bold text-slate-700 bg-slate-100 rounded-lg border border-slate-200 tabular-nums">
                  {currentIndex + 1}/{totalKomoditas}
                </div>

                <button
                  type="button"
                  onClick={onNextKomoditas}
                  title="Komoditas Selanjutnya"
                  className="inline-flex items-center gap-0.5 px-2.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg shadow-2xs border border-amber-500/40 transition-colors cursor-pointer"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-4 flex flex-col gap-1.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
              <button
                type="button"
                onClick={onTampilkan}
                disabled={isLoading}
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Search className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Memuat...' : 'Tampilkan'}</span>
              </button>

              <button
                type="button"
                onClick={onDownloadSeluruhKualitas}
                title="Download Excel Seluruh Kualitas untuk Provinsi ini"
                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-2xs transition-all cursor-pointer truncate"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Unduh excel Seluruh Kualitas</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onDownloadSeluruhResponden}
              title="Download Excel Seluruh Responden untuk Provinsi ini"
              className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Unduh excel Seluruh Responden</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-50/70 divide-x divide-y md:divide-y-0 divide-slate-200">
        <div className="p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-0.5">
            <Building2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Kabupaten Terdata</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {data.length}
            </span>
            <span className="text-[11px] text-slate-500">wilayah</span>
          </div>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-0.5">
            <BarChart2 className="w-3.5 h-3.5 text-sky-600" />
            <span>Rata-Rata Harga 2027 (Berjalan)</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {formatRupiahCurrency(avgPrice2027)}
            </span>
            <span className="text-[11px] text-slate-500">/{selectedKomoditas.satuan}</span>
          </div>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-0.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span>Rentang Harga (Min - Max)</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">
              {formatRupiahCurrency(minPrice)}
            </span>
            <span className="text-[10px] text-slate-400">s/d</span>
            <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
              {formatRupiahCurrency(maxPrice)}
            </span>
          </div>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-0.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Status Verifikasi & Anomali</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-mono text-emerald-700 tabular-nums">
              {verifiedCount} / {data.length}
            </span>
            {anomalyCount > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" /> {anomalyCount} Anomali
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
