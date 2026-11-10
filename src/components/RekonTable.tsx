import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Search,
  Eye,
  MessageSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2
} from 'lucide-react';
import { KabupatenRekon, UserAuth } from '../types/rekonda';
import { formatRupiahNumber, formatPercent } from '../utils/formatters';

interface RekonTableProps {
  data: KabupatenRekon[];
  onOpenDetail: (item: KabupatenRekon) => void;
  onOpenNote: (item: KabupatenRekon) => void;
  onExportExcel: () => void;
  onPrint: () => void;
  selectedId?: string | null;
  onSelectRow?: (item: KabupatenRekon) => void;
  onSortedDataChange?: (sortedList: KabupatenRekon[]) => void;
  currentUser: UserAuth;
}

export type SortField =
  | 'kode'
  | 'nama'
  | 'harga2027'
  | 'hargaTw3_2026'
  | 'hargaTw4_2026'
  | 'hargaTw1_2027'
  | 'hargaTw2_2027'
  | 'koefisienVariasi'
  | 'namaKualitas'
  | 'harga2026'
  | 'rasio'
  | 'catatan';

export const RekonTable: React.FC<RekonTableProps> = ({
  data,
  onOpenDetail,
  onOpenNote,
  onExportExcel,
  onPrint,
  selectedId,
  onSelectRow,
  onSortedDataChange,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<SortField>('kode');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter & Sort Data
  const sortedAndFilteredData = useMemo(() => {
    let result = [...data];
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.nama.toLowerCase().includes(q) ||
          item.kode.includes(q) ||
          item.namaKualitas.toLowerCase().includes(q) ||
          (item.catatan && item.catatan.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === 'kode') {
        const aNum = Number(a.kode) || 0;
        const bNum = Number(b.kode) || 0;
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [data, searchTerm, sortField, sortDirection]);

  // Synchronize sorted data to parent for chart dynamic ordering
  useEffect(() => {
    if (onSortedDataChange) {
      onSortedDataChange(sortedAndFilteredData);
    }
  }, [sortedAndFilteredData, onSortedDataChange]);

  // Pagination
  const totalEntries = sortedAndFilteredData.length;
  const totalPages = Math.ceil(totalEntries / (entriesPerPage || 15)) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);
  const currentRows = sortedAndFilteredData.slice(startIndex, endIndex);

  // Render Sort Icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600 inline ml-0.5" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-rose-600 inline ml-0.5" />
    ) : (
      <ArrowDown className="w-3 h-3 text-rose-600 inline ml-0.5" />
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 mb-6 w-full overflow-hidden">
      {/* Table Toolbar (Excel, Cetak, Entries, Search) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3 text-xs">
        {/* Left: Excel & Cetak buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-sky-600" />
            <span>Cetak</span>
          </button>
          <span className="text-[11px] text-slate-500 hidden md:inline ml-1">
            Sortir: <strong className="text-slate-800">{sortField}</strong> ({sortDirection === 'asc' ? 'Naik' : 'Turun'})
          </span>
        </div>

        {/* Center: Entries dropdown */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>tampilkan</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-300 text-slate-800 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entri</span>
        </div>

        {/* Right: Search box */}
        <div className="flex items-center gap-2">
          <label htmlFor="search-table" className="text-xs font-semibold text-slate-700">
            Cari:
          </label>
          <div className="relative">
            <input
              id="search-table"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari kab / merek..."
              className="bg-white border border-slate-300 rounded-md pl-2.5 pr-7 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 w-36 sm:w-48"
            />
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            ) : (
              <Search className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
          </div>
        </div>
      </div>

      {/* Main Table: Auto-fit to screen, NO HORIZONTAL SCROLL! */}
      <div className="w-full border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full table-fixed text-[11px] leading-tight border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none text-center">
              {/* 1. Kabupaten (~14%) */}
              <th
                onClick={() => handleSort('kode')}
                className="py-2.5 px-2 text-left cursor-pointer hover:bg-slate-200 transition-colors w-[14%] group"
                title="Klik untuk sortir Kode Kabupaten"
              >
                <div className="flex items-center gap-0.5 truncate">
                  <span>Kode & Kabupaten</span>
                  {renderSortIcon('kode')}
                </div>
              </th>

              {/* 2. Harga 2027 (~10%) */}
              <th
                onClick={() => handleSort('harga2027')}
                className="py-2.5 px-1.5 text-right cursor-pointer hover:bg-rose-100/70 bg-rose-50/60 transition-colors w-[10%] group"
                title="Rata-rata tahun berjalan (TW III/IV 2026 & TW I/II 2027 yang tersedia)"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span className="text-rose-900 font-extrabold">Harga 2027</span>
                  {renderSortIcon('harga2027')}
                </div>
              </th>

              {/* 3. TW III 2026 (~7.5%) */}
              <th
                onClick={() => handleSort('hargaTw3_2026')}
                className="py-2.5 px-1 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[7.5%] group"
                title="Harga TW III 2026"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>TW III '26</span>
                  {renderSortIcon('hargaTw3_2026')}
                </div>
              </th>

              {/* 4. TW IV 2026 (~7.5%) */}
              <th
                onClick={() => handleSort('hargaTw4_2026')}
                className="py-2.5 px-1 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[7.5%] group"
                title="Harga TW IV 2026"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>TW IV '26</span>
                  {renderSortIcon('hargaTw4_2026')}
                </div>
              </th>

              {/* 5. TW I 2027 (~7.5%) */}
              <th
                onClick={() => handleSort('hargaTw1_2027')}
                className="py-2.5 px-1 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[7.5%] group"
                title="Harga TW I 2027"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>TW I '27</span>
                  {renderSortIcon('hargaTw1_2027')}
                </div>
              </th>

              {/* 6. TW II 2027 (~7.5%) */}
              <th
                onClick={() => handleSort('hargaTw2_2027')}
                className="py-2.5 px-1 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[7.5%] group"
                title="Harga TW II 2027"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>TW II '27</span>
                  {renderSortIcon('hargaTw2_2027')}
                </div>
              </th>

              {/* 7. Koefisien Variasi (~6.5%) */}
              <th
                onClick={() => handleSort('koefisienVariasi')}
                className="py-2.5 px-1 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[6.5%] group"
                title="Koefisien Variasi (%) variasi harga antar responden di kab/kota bersangkutan"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>CV (%)</span>
                  {renderSortIcon('koefisienVariasi')}
                </div>
              </th>

              {/* 8. Nama Kualitas/Merek (Mode) (~12%) */}
              <th
                onClick={() => handleSort('namaKualitas')}
                className="py-2.5 px-2 text-left cursor-pointer hover:bg-slate-200 transition-colors w-[12%] group"
                title="Merek yang paling sering muncul dari responden di kabupaten bersangkutan"
              >
                <div className="flex items-center gap-0.5 truncate">
                  <span>Merek Terbanyak</span>
                  {renderSortIcon('namaKualitas')}
                </div>
              </th>

              {/* 9. Harga 2026 (~8.5%) */}
              <th
                onClick={() => handleSort('harga2026')}
                className="py-2.5 px-1 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[8.5%] group"
                title="Harga Tahun Lalu (Rata-rata dari database sheet rekonda26)"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>Harga 2026</span>
                  {renderSortIcon('harga2026')}
                </div>
              </th>

              {/* 10. Rasio (~6%) */}
              <th
                onClick={() => handleSort('rasio')}
                className="py-2.5 px-1 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[6%] group"
                title="Rasio perbandingan harga 2027 terhadap harga 2026"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>Rasio</span>
                  {renderSortIcon('rasio')}
                </div>
              </th>

              {/* 11. Catatan (Sebelum Kolom Aksi) (~5%) */}
              <th
                onClick={() => handleSort('catatan')}
                className="py-2.5 px-1 text-center cursor-pointer hover:bg-slate-200 transition-colors w-[5%] group"
                title="Catatan Lapangan & Justifikasi"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>Catatan</span>
                  {renderSortIcon('catatan')}
                </div>
              </th>

              {/* 12. Aksi (~7% with View Wilayah + Detail icons) */}
              <th className="py-2.5 px-1 text-center w-[7%]">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-slate-500 font-medium">
                  Tidak ada data yang sesuai dengan pencarian &quot;{searchTerm}&quot;
                </td>
              </tr>
            ) : (
              currentRows.map((row, idx) => {
                const isSelected = selectedId === row.id;
                const isHighCV = row.koefisienVariasi > 10;
                const hasNote = Boolean(row.catatan && row.catatan.trim().length > 0);

                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelectRow && onSelectRow(row)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50/80 hover:bg-rose-100/70'
                        : idx % 2 === 0
                        ? 'bg-white hover:bg-slate-50/80'
                        : 'bg-slate-50/40 hover:bg-slate-100/60'
                    }`}
                  >
                    {/* 1. Kabupaten */}
                    <td className="py-2 px-2 font-medium text-slate-900 truncate">
                      <div className="flex items-center gap-1 truncate" title={`[${row.kode}] ${row.nama}`}>
                        <span className="font-mono text-slate-500 text-[10px]">[{row.kode}]</span>
                        <span className="font-bold text-slate-800 truncate">{row.nama}</span>
                        {row.isVerified && (
                          <span title="Rekon Selesai / Terverifikasi">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 inline shrink-0" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Harga 2027 (Rata-rata berjalan) */}
                    <td className="py-2 px-1.5 text-right font-mono font-bold text-slate-900 bg-rose-50/30 tabular-nums">
                      {formatRupiahNumber(row.harga2027)}
                    </td>

                    {/* 3. TW III 2026 */}
                    <td className="py-2 px-1 text-right font-mono text-slate-700 tabular-nums">
                      {row.hargaTw3_2026 > 0 ? formatRupiahNumber(row.hargaTw3_2026) : '-'}
                    </td>

                    {/* 4. TW IV 2026 */}
                    <td className="py-2 px-1 text-right font-mono text-slate-700 tabular-nums">
                      {row.hargaTw4_2026 > 0 ? formatRupiahNumber(row.hargaTw4_2026) : '-'}
                    </td>

                    {/* 5. TW I 2027 */}
                    <td className="py-2 px-1 text-right font-mono text-slate-600 tabular-nums">
                      {row.hargaTw1_2027 > 0 ? formatRupiahNumber(row.hargaTw1_2027) : '-'}
                    </td>

                    {/* 6. TW II 2027 */}
                    <td className="py-2 px-1 text-right font-mono text-slate-600 tabular-nums">
                      {row.hargaTw2_2027 > 0 ? formatRupiahNumber(row.hargaTw2_2027) : '-'}
                    </td>

                    {/* 7. Koefisien Variasi */}
                    <td className="py-2 px-1 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          isHighCV
                            ? 'text-amber-800 bg-amber-100 px-1 py-0.5 rounded text-[10px]'
                            : row.koefisienVariasi === 0
                            ? 'text-slate-400'
                            : 'text-slate-800'
                        }`}
                        title={`Variasi harga antar responden: ${formatPercent(row.koefisienVariasi)}%`}
                      >
                        {formatPercent(row.koefisienVariasi)}%
                      </span>
                    </td>

                    {/* 8. Nama Kualitas / Merek Dominan */}
                    <td className="py-2 px-2 text-slate-700 truncate" title={`Merek paling banyak muncul: ${row.namaKualitas}`}>
                      <span className="truncate block font-medium text-slate-800">
                        {row.namaKualitas || 'Standar'}
                      </span>
                    </td>

                    {/* 9. Harga 2026 (Tahun Lalu dari sheet rekonda26) */}
                    <td className="py-2 px-1 text-right font-mono text-slate-600 tabular-nums">
                      {formatRupiahNumber(row.harga2026)}
                    </td>

                    {/* 10. Rasio */}
                    <td className="py-2 px-1 text-right font-mono tabular-nums">
                      <span
                        className={`font-bold ${
                          row.rasio > 106
                            ? 'text-rose-700'
                            : row.rasio < 95
                            ? 'text-emerald-700'
                            : 'text-slate-800'
                        }`}
                      >
                        {formatPercent(row.rasio)}%
                      </span>
                    </td>

                    {/* 11. Catatan (Sebelum Kolom Aksi) */}
                    <td className="py-2 px-1 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenNote(row);
                        }}
                        title={row.catatan || 'Klik untuk menulis / mengedit catatan'}
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full transition-all cursor-pointer ${
                          hasNote
                            ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <MessageSquare className="w-2.5 h-2.5" />
                      </button>
                    </td>

                    {/* 12. Aksi: Detail Rekonda Komoditas */}
                    <td className="py-2 px-1 text-center">
                      <div className="flex items-center justify-center">
                        {/* Detail Komoditas Button (View Responden) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetail(row);
                          }}
                          title="Buka Detail Harga Responden Kualitas Ini"
                          className="inline-flex items-center justify-center w-6 h-6 rounded bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white shadow-2xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3 text-xs text-slate-600">
        <div>
          Menampilkan <strong className="font-mono text-slate-900">{totalEntries === 0 ? 0 : startIndex + 1}</strong> s/d{' '}
          <strong className="font-mono text-slate-900">{endIndex}</strong> dari{' '}
          <strong className="font-mono text-slate-900">{totalEntries}</strong> entri
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium transition-colors cursor-pointer"
          >
            Sebelumnya
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => setCurrentPage(pageNum)}
              className={`w-6 h-6 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                currentPage === pageNum
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium transition-colors cursor-pointer"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  );
};
