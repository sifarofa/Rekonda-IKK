import React, { useState, useMemo } from 'react';
import { KabupatenRekon } from '../types/rekonda';
import { formatRupiahCurrency, formatRupiahNumber, formatPercent } from '../utils/formatters';
import { BarChart3, TrendingUp, Info } from 'lucide-react';

interface GrafikRekondaProps {
  data: KabupatenRekon[];
  onSelectKabupaten: (kab: KabupatenRekon) => void;
  selectedId?: string | null;
}

/**
 * Calculates a dynamic, human-friendly Y-axis scale based on max price value
 */
function getDynamicPriceScale(maxVal: number, tickCount = 5) {
  if (maxVal <= 0) {
    return {
      topScale: 100000,
      yTicks: [0, 20000, 40000, 60000, 80000, 100000]
    };
  }

  // Add 12% headroom so the highest bar doesn't touch the top
  const target = maxVal * 1.12;
  const rawStep = target / tickCount;
  const exponent = Math.floor(Math.log10(rawStep));
  const magnitude = Math.pow(10, exponent);
  const fraction = rawStep / magnitude;

  // Find pleasant step multiplier
  const niceMultipliers = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 10];
  const mult = niceMultipliers.find((m) => m >= fraction) || 10;
  let step = mult * magnitude;
  let topScale = step * tickCount;

  while (topScale < maxVal * 1.05) {
    step = Math.round(step * 1.2);
    topScale = step * tickCount;
  }

  const yTicks: number[] = [];
  for (let i = 0; i <= tickCount; i++) {
    yTicks.push(i * step);
  }

  return { topScale, yTicks };
}

/**
 * Compact currency formatter for Y-axis ticks to avoid crowding
 */
function formatCompactRupiah(val: number): string {
  if (val === 0) return '0';
  if (val >= 1000000000) {
    const formatted = (val / 1000000000).toFixed(val % 1000000000 === 0 ? 0 : 1);
    return `${formatted} M`;
  }
  if (val >= 1000000) {
    const formatted = (val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1);
    return `${formatted} jt`;
  }
  if (val >= 1000) {
    const formatted = (val / 1000).toFixed(val % 1000 === 0 ? 0 : 0);
    return `${formatted} rb`;
  }
  return formatRupiahNumber(val);
}

export const GrafikRekonda: React.FC<GrafikRekondaProps> = ({
  data,
  onSelectKabupaten,
  selectedId
}) => {
  const [hoveredKab, setHoveredKab] = useState<KabupatenRekon | null>(null);

  // Compute provincial average for Harga 2027
  const validPrices2027 = data.map((d) => d.harga2027).filter((p) => p > 0);
  const avgPrice =
    validPrices2027.length > 0
      ? Math.round(validPrices2027.reduce((a, b) => a + b, 0) / validPrices2027.length)
      : 0;

  // Find max price among both 2027 and 2026 for comprehensive scaling
  const maxPriceVal = useMemo(() => {
    const all = data.flatMap((d) => [d.harga2027, d.harga2026 || 0]).filter((p) => p > 0);
    return all.length > 0 ? Math.max(...all) : 10000;
  }, [data]);

  // Dynamic scale calculation based on actual price of this commodity
  const { topScale, yTicks } = useMemo(() => {
    return getDynamicPriceScale(maxPriceVal, 5);
  }, [maxPriceVal]);

  const chartHeight = 250;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 mb-8 w-full overflow-hidden">
      {/* Title & Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-600" />
            <span>Grafik Perbandingan Harga Rekonda per Kab/Kota</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Skala vertikal otomatis menyesuaikan rentang harga komoditas ini. Urutan batang tersinkronisasi dinamis dengan tabel.
          </p>
        </div>

        {/* Dynamic Price Legend */}
        <div className="flex items-center gap-3 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#0284c7]" />
            <span className="font-semibold text-slate-700">Harga 2027 (Berjalan)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-slate-400" />
            <span className="text-slate-500">Harga 2026: Rata-rata</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <span className="w-3 border-b-2 border-dashed border-rose-500" />
            <span className="font-semibold text-rose-700">Rata-rata Prov: {formatRupiahNumber(avgPrice)}</span>
          </div>
        </div>
      </div>

      {/* Main Chart Viewport */}
      <div className="relative pt-6 pb-1 overflow-x-auto">
        {/* Hovered Info Tooltip Box */}
        {hoveredKab && (
          <div className="absolute top-0 left-1 right-1 sm:left-auto sm:right-4 z-20 bg-slate-900 text-white text-[11px] sm:text-xs px-3 py-2 rounded-lg shadow-xl flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 animate-in fade-in duration-150 border border-slate-700">
            <div>
              <span className="font-mono text-rose-300 font-bold">[{hoveredKab.kode}]</span>{' '}
              <strong className="font-bold">{hoveredKab.nama}</strong>
            </div>
            <div className="border-l border-slate-700 pl-2 sm:pl-3 font-mono">
              <span className="text-slate-400 text-[10px] block">Harga 2027:</span>
              <strong className="text-sky-300 text-xs sm:text-sm">{formatRupiahCurrency(hoveredKab.harga2027)}</strong>
            </div>
            {hoveredKab.harga2026 > 0 && (
              <div className="border-l border-slate-700 pl-2 sm:pl-3 font-mono">
                <span className="text-slate-400 text-[10px] block">Harga 2026:</span>
                <span className="text-slate-200">{formatRupiahNumber(hoveredKab.harga2026)}</span>
              </div>
            )}
            <div className="border-l border-slate-700 pl-2 sm:pl-3 font-mono">
              <span className="text-slate-400 text-[10px] block">Rasio / CV:</span>
              <span
                className={`font-bold ${
                  hoveredKab.rasio > 106 ? 'text-rose-400' : hoveredKab.rasio < 95 ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                {formatPercent(hoveredKab.rasio)}%
              </span>{' '}
              <span className="text-slate-400">· CV {formatPercent(hoveredKab.koefisienVariasi)}%</span>
            </div>
            <div className="text-[10px] text-slate-400 border-l border-slate-700 pl-2 sm:pl-3 hidden sm:block">
              Merek: <span className="text-slate-200">{hoveredKab.namaKualitas || 'Standar'}</span>
            </div>
          </div>
        )}

        <div className="flex">
          {/* Dynamic Y-Axis Labels */}
          <div
            className="flex flex-col justify-between items-end pr-1.5 sm:pr-2 text-[9px] sm:text-[10px] font-mono text-slate-500 shrink-0 select-none w-14 sm:w-20"
            style={{ height: `${chartHeight}px` }}
          >

            {yTicks
              .slice()
              .reverse()
              .map((tick) => (
                <span key={tick} className="tabular-nums font-semibold" title={`Rp ${formatRupiahNumber(tick)}`}>
                  {formatCompactRupiah(tick)}
                </span>
              ))}
          </div>

          {/* Chart Bars Area */}
          <div className="relative flex-1" style={{ height: `${chartHeight}px` }}>
            {/* Horizontal Gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {yTicks.map((tick) => (
                <div key={tick} className="border-b border-slate-100 w-full h-0" />
              ))}
            </div>

            {/* Provincial Average Benchmark Line */}
            {avgPrice > 0 && (
              <div
                className="absolute left-0 right-0 border-b-2 border-dashed border-rose-500 z-10 pointer-events-none transition-all"
                style={{
                  bottom: `${Math.min(100, (avgPrice / topScale) * 100)}%`
                }}
              >
                <span className="absolute -top-3.5 right-2 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 shadow-2xs">
                  Rata-rata: {formatRupiahNumber(avgPrice)}
                </span>
              </div>
            )}

            {/* Bars Container */}
            <div className="absolute inset-0 flex items-end justify-between gap-1 sm:gap-2 px-1 sm:px-2">
              {data.map((item) => {
                const val27 = item.harga2027;
                const val26 = item.harga2026 || 0;
                const heightPercent27 = Math.min(100, Math.max(2, (val27 / topScale) * 100));
                const heightPercent26 = Math.min(100, Math.max(0, (val26 / topScale) * 100));
                const isSelected = selectedId === item.id;
                const isHovered = hoveredKab?.id === item.id;

                return (
                  <div
                    key={item.id}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                    onMouseEnter={() => setHoveredKab(item)}
                    onMouseLeave={() => setHoveredKab(null)}
                    onClick={() => onSelectKabupaten(item)}
                  >
                    {/* Value Badge above bar */}
                    {val27 > 0 && (
                      <div
                        className={`text-[9px] font-mono font-bold mb-1 transition-opacity whitespace-nowrap hidden lg:block ${
                          isSelected
                            ? 'text-rose-700 font-extrabold'
                            : isHovered
                            ? 'text-sky-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {formatCompactRupiah(val27)}
                      </div>
                    )}

                    {/* Bars Display */}
                    <div className="w-full flex items-end justify-center h-full relative">
                      {/* Harga 2026 Background Reference Ghost Marker */}
                      {val26 > 0 && (
                        <div
                          className="absolute w-full max-w-[42px] border-t-2 border-slate-400/80 z-0 pointer-events-none"
                          style={{ bottom: `${heightPercent26}%` }}
                          title={`Harga 2026: ${formatRupiahNumber(val26)}`}
                        />
                      )}

                      {/* Main Bar: Harga 2027 */}
                      <div
                        className={`w-full max-w-[36px] rounded-t-xs transition-all duration-200 shadow-2xs ${
                          isSelected
                            ? 'bg-gradient-to-t from-rose-700 to-rose-500 ring-2 ring-rose-400 ring-offset-1'
                            : isHovered
                            ? 'bg-gradient-to-t from-sky-600 to-sky-400 scale-y-105 shadow-sm'
                            : 'bg-gradient-to-t from-[#0284c7] to-[#38bdf8] hover:from-[#0369a1] hover:to-[#0ea5e9]'
                        }`}
                        style={{ height: `${heightPercent27}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* X-Axis Labels (Kabupaten Codes in exact sorted order) */}
        <div className="flex ml-14 sm:ml-20 pr-1 sm:pr-2 justify-between gap-1 sm:gap-2 pt-2 border-t border-slate-200">
          {data.map((item) => {
            const isSelected = selectedId === item.id;
            const isHovered = hoveredKab?.id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => onSelectKabupaten(item)}
                className="flex-1 text-center cursor-pointer group"
              >
                <span
                  className={`block font-mono text-[9px] sm:text-[10px] transition-colors ${
                    isSelected
                      ? 'font-bold text-rose-600 underline'
                      : isHovered
                      ? 'font-bold text-sky-600'
                      : 'text-slate-700 group-hover:text-slate-900 font-semibold'
                  }`}
                  title={`${item.nama} (${item.kode})`}
                >
                  {item.kode}
                </span>
                <span className="hidden xl:block text-[8px] text-slate-400 truncate max-w-[42px] mx-auto">
                  {item.nama}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart Footer Info */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-xs bg-[#0284c7]" />
          <span>Harga Satuan Riil 2027</span>
          <span className="text-slate-300">·</span>
          <span className="inline-block w-3 border-b-2 border-dashed border-rose-500" />
          <span>Garis Rata-rata Provinsi ({formatRupiahCurrency(avgPrice)})</span>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <Info className="w-3.5 h-3.5" />
          <span>Klik batang untuk membuka detail responden wilayah</span>
        </div>
      </div>
    </div>
  );
};
