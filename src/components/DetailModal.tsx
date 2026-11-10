import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Search,
  Check,
  Save,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Lock
} from 'lucide-react';
import { KabupatenRekon, RespondenData, Komoditas, UserAuth } from '../types/rekonda';
import { formatRupiahNumber, formatRupiahCurrency, formatPercent } from '../utils/formatters';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  kabupaten: KabupatenRekon;
  komoditas: Komoditas;
  onUpdateKabupaten: (updated: KabupatenRekon) => void;
  onOpenAddRespondent: (defaultTahun?: number, defaultTw?: number) => void;
  onOpenEditRespondent: (item: RespondenData) => void;
  onDeleteRespondent: (id: string) => void;
  currentUser: UserAuth;
  onOpenAuth: () => void;
}

type RespondentSortField = 'tahun' | 'triwulan' | 'nama' | 'merk' | 'harga';

export const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  kabupaten,
  komoditas,
  onUpdateKabupaten,
  onOpenAddRespondent,
  onOpenEditRespondent,
  onDeleteRespondent,
  currentUser,
  onOpenAuth
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMerk, setSelectedMerk] = useState<string>('all');
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [noteContent, setNoteContent] = useState<string>(kabupaten?.catatan || '');
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  // Sorting inside respondent table
  const [sortField, setSortField] = useState<RespondentSortField>('triwulan');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Extract unique brands for brand filter
  const availableMerks = useMemo(() => {
    const set = new Set<string>();
    (kabupaten?.respondents || []).forEach((r) => {
      if (r.merk && r.merk.trim() !== '' && r.merk.trim() !== '-') {
        set.add(r.merk.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [kabupaten?.respondents]);

  // Sync note and reset brand filter when kabupaten changes
  React.useEffect(() => {
    setNoteContent(kabupaten?.catatan || '');
    setIsEditingNote(false);
    setSelectedMerk('all');
  }, [kabupaten?.id, kabupaten?.catatan]);

  const handleSort = (field: RespondentSortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Filter & Sort respondents
  const sortedAndFilteredRespondents = useMemo(() => {
    let list = [...(kabupaten?.respondents || [])];

    // Filter by Brand / Merek
    if (selectedMerk !== 'all') {
      list = list.filter((r) => (r.merk || '').trim().toLowerCase() === selectedMerk.trim().toLowerCase());
    }

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.nama.toLowerCase().includes(q) ||
          r.merk.toLowerCase().includes(q) ||
          r.tahun.toString().includes(q) ||
          r.triwulan.toString().includes(q) ||
          r.harga.toString().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return list;
  }, [kabupaten?.respondents, selectedMerk, searchTerm, sortField, sortDir]);

  // Pagination
  const totalEntries = sortedAndFilteredRespondents.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);
  const currentRows = sortedAndFilteredRespondents.slice(startIndex, endIndex);

  // Save Note Handler
  const handleSaveNote = () => {
    if (!currentUser.isLoggedIn) {
      onOpenAuth();
      return;
    }
    onUpdateKabupaten({
      ...kabupaten,
      catatan: noteContent
    });
    setIsEditingNote(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  // Toggle Verified
  const handleToggleVerify = () => {
    if (!currentUser.isOwner) {
      alert('Hanya pemilik akun (harga6100@gmail.com) yang dapat mengubah status rekonsiliasi.');
      return;
    }
    onUpdateKabupaten({
      ...kabupaten,
      isVerified: !kabupaten.isVerified,
      statusRekon: !kabupaten.isVerified ? 'rekon_selesai' : 'konfirmasi_lapangan'
    });
  };

  const renderSortIcon = (field: RespondentSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600 inline ml-0.5" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-rose-600 inline ml-0.5" />
    ) : (
      <ArrowDown className="w-3 h-3 text-rose-600 inline ml-0.5" />
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      {/* Modal Dialog Box matching Screenshot 2 */}
      <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-start justify-between border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>Detail Rekonda</span>
              {kabupaten.isVerified && (
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Terverifikasi
                </span>
              )}
            </h3>
            <div className="mt-1 space-y-0.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Kab/Kota :</span>
                <span className="font-semibold text-white font-mono">[{kabupaten.kode}] {kabupaten.nama}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Kualitas Rekon :</span>
                <span className="font-semibold text-rose-300 font-mono">[{komoditas.kode}] {komoditas.nama} ({komoditas.satuan})</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[78vh] overflow-y-auto">
          {/* Quick Summary Pill Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500 block text-[10px]">Harga Rata-Rata (2027 Berjalan):</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatRupiahCurrency(kabupaten.harga2027)}
                </span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-slate-500 block text-[10px]">Koefisien Variasi (Responden):</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatPercent(kabupaten.koefisienVariasi)}%
                </span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-slate-500 block text-[10px]">Merek Terbanyak:</span>
                <span className="font-bold text-slate-800 text-xs">
                  {kabupaten.namaKualitas || 'Standar'}
                </span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-slate-500 block text-[10px]">Rasio ke 2026:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatPercent(kabupaten.rasio)}%
                </span>
              </div>
            </div>

            <div className="text-slate-500 text-[11px] font-mono">
              Total {kabupaten.respondents.length} entri responden survei
            </div>
          </div>

          {/* Table Controls (Tampilkan X entri, Filter Merek & Cari box) */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-slate-600">
              <div className="flex items-center gap-1.5">
                <span>tampilkan</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-300 text-slate-800 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>entri</span>
              </div>

              {/* Filter Merek Dropdown */}
              <div className="flex items-center gap-1.5">
                <label htmlFor="filter-merek" className="font-semibold text-slate-700 whitespace-nowrap">
                  Filter Merek:
                </label>
                <select
                  id="filter-merek"
                  value={selectedMerk}
                  onChange={(e) => {
                    setSelectedMerk(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-300 text-slate-800 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer max-w-[200px] truncate font-medium"
                >
                  <option value="all">Semua Merek ({availableMerks.length > 0 ? availableMerks.length : 'Semua'})</option>
                  {availableMerks.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-[11px] text-slate-400 hidden lg:inline">
                (Klik judul kolom untuk sortir)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="search-modal" className="font-semibold text-slate-700">
                Cari:
              </label>
              <div className="relative">
                <input
                  id="search-modal"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari responden / merek..."
                  className="bg-white border border-slate-300 rounded-md pl-2.5 pr-7 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 w-44"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table Responden (Matching Screenshot 2 + Sorting on every column!) */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg mb-4">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-center select-none">
                  {/* Sortable: Tahun */}
                  <th
                    onClick={() => handleSort('tahun')}
                    className="py-2.5 px-3 text-center whitespace-nowrap cursor-pointer hover:bg-slate-200 transition-colors group"
                  >
                    <span>Tahun</span> {renderSortIcon('tahun')}
                  </th>

                  {/* Sortable: Triwulan */}
                  <th
                    onClick={() => handleSort('triwulan')}
                    className="py-2.5 px-3 text-center whitespace-nowrap cursor-pointer hover:bg-slate-200 transition-colors group"
                  >
                    <span>Triwulan</span> {renderSortIcon('triwulan')}
                  </th>

                  {/* Sortable: Responden */}
                  <th
                    onClick={() => handleSort('nama')}
                    className="py-2.5 px-4 text-left whitespace-nowrap cursor-pointer hover:bg-slate-200 transition-colors group"
                  >
                    <span>Responden</span> {renderSortIcon('nama')}
                  </th>

                  {/* Sortable: Merk */}
                  <th
                    onClick={() => handleSort('merk')}
                    className="py-2.5 px-4 text-left whitespace-nowrap cursor-pointer hover:bg-slate-200 transition-colors group"
                  >
                    <span>Merk</span> {renderSortIcon('merk')}
                  </th>

                  {/* Sortable: Harga */}
                  <th
                    onClick={() => handleSort('harga')}
                    className="py-2.5 px-4 text-right whitespace-nowrap cursor-pointer hover:bg-slate-200 transition-colors group"
                  >
                    <span>Harga (Rp)</span> {renderSortIcon('harga')}
                  </th>

                  {/* Aksi */}
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 font-medium">
                      Belum ada data responden untuk filter ini. Silakan klik tombol tambah di bawah.
                    </td>
                  </tr>
                ) : (
                  currentRows.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <td className="py-2 px-3 text-center font-mono font-medium text-slate-700">
                        {item.tahun}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-medium text-slate-700">
                        TW {item.triwulan}
                      </td>
                      <td className="py-2 px-4 font-semibold text-slate-900">
                        {item.nama}
                      </td>
                      <td className="py-2 px-4 text-slate-600">
                        {item.merk || '-'}
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatRupiahNumber(item.harga)}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Yellow Edit Pencil button from screenshot */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!currentUser.isOwner) {
                                alert('Perubahan data responden hanya dapat dilakukan oleh pemilik akun.');
                                return;
                              }
                              onOpenEditRespondent(item);
                            }}
                            title="Edit Data Responden"
                            className="w-6 h-6 rounded bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-amber-950 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>

                          {/* Red Delete Trash button from screenshot */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!currentUser.isOwner) {
                                alert('Penghapusan responden hanya dapat dilakukan oleh pemilik akun.');
                                return;
                              }
                              if (confirm(`Hapus data responden ${item.nama} (${formatRupiahCurrency(item.harga)})?`)) {
                                onDeleteRespondent(item.id);
                              }
                            }}
                            title="Hapus Data Responden"
                            className="w-6 h-6 rounded bg-red-600 hover:bg-red-700 active:bg-red-800 text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 mb-5">
            <div>
              Menampilkan <strong className="font-mono text-slate-900">{totalEntries === 0 ? 0 : startIndex + 1}</strong> sampai{' '}
              <strong className="font-mono text-slate-900">{endIndex}</strong> dari{' '}
              <strong className="font-mono text-slate-900">{totalEntries}</strong> entri
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
              >
                Sebelumnya
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-6 h-6 rounded font-mono font-semibold transition-colors cursor-pointer ${
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
                className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>

          {/* Catatan Box (Matching Screenshot 2) */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Catatan Lapangan & Rekon</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser.isLoggedIn) {
                      onOpenAuth();
                      return;
                    }
                    setIsEditingNote((prev) => !prev);
                  }}
                  title={isEditingNote ? 'Batal Edit' : 'Edit Catatan'}
                  className="w-6 h-6 rounded bg-amber-400 hover:bg-amber-500 text-amber-950 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>

              {savedFeedback && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Catatan tersimpan ke server!
                </span>
              )}
            </div>

            {isEditingNote ? (
              <div className="space-y-2">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={3}
                  placeholder="Ketik catatan rekonsiliasi atau justifikasi harga di sini..."
                  className="w-full text-xs text-slate-800 p-3 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNoteContent(kabupaten.catatan || '');
                      setIsEditingNote(false);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-2xs transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Catatan</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-700 min-h-[44px] bg-white border border-slate-200/80 rounded-md p-3 whitespace-pre-wrap">
                {kabupaten.catatan ? (
                  kabupaten.catatan
                ) : (
                  <span className="text-slate-400 italic">
                    Belum ada catatan untuk kabupaten ini. Klik tombol pensil kuning di atas untuk menambahkan catatan lapangan atau justifikasi harga.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons Row (Matching the 6 buttons at bottom of Screenshot 2) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
            {/* Left: Yellow Tandai / Verifikasi button */}
            <button
              type="button"
              onClick={handleToggleVerify}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg shadow-2xs border transition-colors cursor-pointer ${
                kabupaten.isVerified
                  ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                  : 'bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-amber-950 border-amber-500/50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{kabupaten.isVerified ? 'Telah Direkon (Batal)' : 'Tandai Rekon Selesai'}</span>
            </button>

            {/* Center/Right: Blue + Tambah buttons for specific Quarters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenAddRespondent(2026, 3)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>tambah 2026/3</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAddRespondent(2026, 4)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>tambah 2026/4</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAddRespondent(2027, 1)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>tambah 2027/1</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAddRespondent(2027, 2)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>tambah 2027/2</span>
              </button>

              {/* Dark Gray Tutup button */}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-bold text-white bg-slate-700 hover:bg-slate-800 active:bg-slate-900 rounded-lg shadow-2xs transition-colors cursor-pointer ml-1"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
