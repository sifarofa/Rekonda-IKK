import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  AlertTriangle,
  Save,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { KabupatenRekon, StatusRekon, UserAuth, Komoditas, Provinsi } from '../types/rekonda';
import { formatRupiahNumber, formatRupiahCurrency, formatPercent } from '../utils/formatters';

interface AnomaliItem {
  id: string;
  dbKey: string;
  komoditas: Komoditas;
  kabupaten: KabupatenRekon;
  isCVAnomaly: boolean;
  isRasioAnomaly: boolean;
  anomalyType: 'Ganda (CV & Rasio)' | 'CV Tinggi (> 10%)' | 'Rasio Ekstrem (> 106% / < 95%)';
}

interface AnomaliRekonTableProps {
  database: Record<string, KabupatenRekon[]>;
  komoditasList: Komoditas[];
  provinsi: Provinsi;
  selectedKomoditas: Komoditas;
  currentUser: UserAuth;
  onOpenAuth: () => void;
  onUpdateAnomali: (key: string, kabupatenId: string, status: StatusRekon, catatan: string) => void;
  onOpenDetail: (kab: KabupatenRekon, komoditas: Komoditas) => void;
}

type SortField =
  | 'komoditasKode'
  | 'komoditasNama'
  | 'kabupatenKode'
  | 'kabupatenNama'
  | 'harga2027'
  | 'harga2026'
  | 'rasio'
  | 'koefisienVariasi'
  | 'statusRekon';

export const AnomaliRekonTable: React.FC<AnomaliRekonTableProps> = ({
  database,
  komoditasList,
  provinsi,
  selectedKomoditas,
  currentUser,
  onOpenAuth,
  onUpdateAnomali,
  onOpenDetail
}) => {
  // Filters
  const [selectedKomoditasFilter, setSelectedKomoditasFilter] = useState<string>('all');
  const [selectedKabupatenFilter, setSelectedKabupatenFilter] = useState<string>('all');
  const [anomalyTypeFilter, setAnomalyTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination & Sorting
  const [entriesPerPage, setEntriesPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<SortField>('koefisienVariasi');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Editing state for catatan & status
  const [editingRows, setEditingRows] = useState<
    Record<string, { status: StatusRekon; catatan: string }>
  >({});
  const [savedRowId, setSavedRowId] = useState<string | null>(null);

  // Map of komoditas by code
  const komoditasMap = useMemo(() => {
    return new Map<string, Komoditas>(komoditasList.map((k) => [k.kode, k]));
  }, [komoditasList]);

  // Gather ALL anomalies across ALL commodities in the database
  const allAnomalies = useMemo(() => {
    const list: AnomaliItem[] = [];

    komoditasList.forEach((kom) => {
      const dbKey = `${provinsi.kode}_${kom.kode}`;
      const kabList = database[dbKey] || [];

      kabList.forEach((kab) => {
        const isCV = kab.koefisienVariasi > 10;
        const isRasio = kab.rasio > 106 || (kab.rasio < 95 && kab.harga2026 > 0);
        const hasExplicitStatus =
          kab.statusRekon === 'konfirmasi_lapangan' || kab.statusRekon === 'anomali_terjustifikasi';

        if (isCV || isRasio || hasExplicitStatus) {
          let anomalyType: AnomaliItem['anomalyType'] = 'CV Tinggi (> 10%)';
          if (isCV && isRasio) {
            anomalyType = 'Ganda (CV & Rasio)';
          } else if (isRasio) {
            anomalyType = 'Rasio Ekstrem (> 106% / < 95%)';
          }

          list.push({
            id: `${kom.kode}_${kab.kode}`,
            dbKey,
            komoditas: kom,
            kabupaten: kab,
            isCVAnomaly: isCV,
            isRasioAnomaly: isRasio,
            anomalyType
          });
        }
      });
    });

    return list;
  }, [database, komoditasList, provinsi.kode]);

  // Total anomalies across all 89 commodities
  const totalAnomaliesCount = allAnomalies.length;

  // Filtered and Sorted Anomalies
  const filteredAndSortedData = useMemo(() => {
    let result = [...allAnomalies];

    // Filter Komoditas
    if (selectedKomoditasFilter !== 'all') {
      result = result.filter((item) => item.komoditas.kode === selectedKomoditasFilter);
    }

    // Filter Kabupaten
    if (selectedKabupatenFilter !== 'all') {
      result = result.filter((item) => item.kabupaten.kode === selectedKabupatenFilter);
    }

    // Filter Anomaly Type
    if (anomalyTypeFilter === 'cv_only') {
      result = result.filter((item) => item.isCVAnomaly && !item.isRasioAnomaly);
    } else if (anomalyTypeFilter === 'rasio_only') {
      result = result.filter((item) => item.isRasioAnomaly && !item.isCVAnomaly);
    } else if (anomalyTypeFilter === 'both') {
      result = result.filter((item) => item.isCVAnomaly && item.isRasioAnomaly);
    } else if (anomalyTypeFilter === 'any_cv') {
      result = result.filter((item) => item.isCVAnomaly);
    } else if (anomalyTypeFilter === 'any_rasio') {
      result = result.filter((item) => item.isRasioAnomaly);
    }

    // Filter Status
    if (statusFilter !== 'all') {
      result = result.filter((item) => item.kabupaten.statusRekon === statusFilter);
    }

    // Search query
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.komoditas.nama.toLowerCase().includes(q) ||
          item.komoditas.kode.includes(q) ||
          item.kabupaten.nama.toLowerCase().includes(q) ||
          item.kabupaten.kode.includes(q) ||
          (item.kabupaten.catatan && item.kabupaten.catatan.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      let aVal: any = 0;
      let bVal: any = 0;

      switch (sortField) {
        case 'komoditasKode':
          aVal = a.komoditas.kode;
          bVal = b.komoditas.kode;
          break;
        case 'komoditasNama':
          aVal = a.komoditas.nama;
          bVal = b.komoditas.nama;
          break;
        case 'kabupatenKode':
          aVal = Number(a.kabupaten.kode) || 0;
          bVal = Number(b.kabupaten.kode) || 0;
          break;
        case 'kabupatenNama':
          aVal = a.kabupaten.nama;
          bVal = b.kabupaten.nama;
          break;
        case 'harga2027':
          aVal = a.kabupaten.harga2027;
          bVal = b.kabupaten.harga2027;
          break;
        case 'harga2026':
          aVal = a.kabupaten.harga2026;
          bVal = b.kabupaten.harga2026;
          break;
        case 'rasio':
          aVal = a.kabupaten.rasio;
          bVal = b.kabupaten.rasio;
          break;
        case 'koefisienVariasi':
          aVal = a.kabupaten.koefisienVariasi;
          bVal = b.kabupaten.koefisienVariasi;
          break;
        case 'statusRekon':
          aVal = a.kabupaten.statusRekon;
          bVal = b.kabupaten.statusRekon;
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [
    allAnomalies,
    selectedKomoditasFilter,
    selectedKabupatenFilter,
    anomalyTypeFilter,
    statusFilter,
    searchTerm,
    sortField,
    sortDir
  ]);

  // Pagination calculations
  const totalEntries = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);
  const currentRows = filteredAndSortedData.slice(startIndex, endIndex);

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600 inline ml-0.5" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-rose-600 inline ml-0.5" />
    ) : (
      <ArrowDown className="w-3 h-3 text-rose-600 inline ml-0.5" />
    );
  };

  // Field change handler for Status & Catatan
  const handleFieldChange = (rowKey: string, field: 'status' | 'catatan', val: string) => {
    setEditingRows((prev) => ({
      ...prev,
      [rowKey]: {
        status: field === 'status' ? (val as StatusRekon) : prev[rowKey]?.status || 'belum_rekon',
        catatan: field === 'catatan' ? val : prev[rowKey]?.catatan || ''
      }
    }));
  };

  // Save changes to single anomaly row
  const handleSaveRow = (item: AnomaliItem) => {
    if (!currentUser.isLoggedIn) {
      onOpenAuth();
      return;
    }

    const rawCatatan = (item.kabupaten.catatan || '').trim();
    const isAutoText =
      rawCatatan.includes('Variasi harga antar') ||
      rawCatatan.includes('Perubahan harga antar') ||
      rawCatatan.includes('Perlu verifikasi') ||
      rawCatatan.includes('terjustifikasi faktor') ||
      rawCatatan.includes('Harga stabil') ||
      rawCatatan.includes('Perubahan harga signifikan');
    const initialCatatan = isAutoText ? '' : rawCatatan;

    const currentEdit = editingRows[item.id] || {
      status: item.kabupaten.statusRekon,
      catatan: initialCatatan
    };

    onUpdateAnomali(item.dbKey, item.kabupaten.id || item.kabupaten.kode, currentEdit.status, currentEdit.catatan);

    setSavedRowId(item.id);
    setTimeout(() => setSavedRowId(null), 2500);
  };

  // Export filtered anomalies to Excel
  const handleExportExcel = () => {
    const rows = filteredAndSortedData.map((item, idx) => ({
      'No': idx + 1,
      'Kode Komoditas': item.komoditas.kode,
      'Nama Komoditas / Kualitas': item.komoditas.nama,
      'Satuan': item.komoditas.satuan,
      'Kode Kab': item.kabupaten.kode,
      'Kabupaten / Kota': item.kabupaten.nama,
      'Harga 2027 (Rp)': item.kabupaten.harga2027,
      'Harga 2026 (Rp)': item.kabupaten.harga2026,
      'Rasio (%)': item.kabupaten.rasio,
      'CV (%)': item.kabupaten.koefisienVariasi,
      'Tipe Anomali': item.anomalyType,
      'Status Rekon': item.kabupaten.statusRekon,
      'Catatan Lapangan': item.kabupaten.catatan || '',
      'Aksi Rekon': item.kabupaten.aksiRekon || ''
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Anomali');
    XLSX.writeFile(
      wb,
      `Rekap_Anomali_Rekon_Seluruh_Komoditas_${provinsi.kode}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Table Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 w-full overflow-hidden">
        {/* Header & Controls Toolbar */}
        <div className="border-b border-slate-200 pb-3 mb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Daftar Anomali CV & Rasio per Jenis Kualitas / Komoditas Rekon</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Menampilkan seluruh kabupaten/kota yang mengalami anomali Koefisien Variasi (&gt; 10%) dan Rasio perbandingan harga (&gt; 106% / &lt; 95%) lintas 89 komoditas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unduh Excel</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-sky-600" />
                <span>Cetak</span>
              </button>
            </div>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 text-xs">
            {/* Filter Komoditas */}
            <div className="lg:col-span-4">
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Kualitas / Komoditas:
              </label>
              <select
                value={selectedKomoditasFilter}
                onChange={(e) => {
                  setSelectedKomoditasFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer truncate"
              >
                <option value="all">Semua Kualitas Rekon ({totalAnomaliesCount} Anomali)</option>
                {komoditasList.map((k) => (
                  <option key={k.kode} value={k.kode}>
                    [{k.kode}] {k.nama} {k.satuan ? `(${k.satuan})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Kabupaten */}
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Kabupaten / Kota:
              </label>
              <select
                value={selectedKabupatenFilter}
                onChange={(e) => {
                  setSelectedKabupatenFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                <option value="all">Semua Kabupaten</option>
                <option value="6101">[6101] SAMBAS</option>
                <option value="6102">[6102] BENGKAYANG</option>
                <option value="6103">[6103] LANDAK</option>
                <option value="6104">[6104] MEMPAWAH</option>
                <option value="6105">[6105] SANGGAU</option>
                <option value="6106">[6106] KETAPANG</option>
                <option value="6107">[6107] SINTANG</option>
                <option value="6108">[6108] KAPUAS HULU</option>
                <option value="6109">[6109] SEKADAU</option>
                <option value="6110">[6110] MELAWI</option>
                <option value="6111">[6111] KAYONG UTARA</option>
                <option value="6112">[6112] KUBU RAYA</option>
                <option value="6171">[6171] KOTA PONTIANAK</option>
                <option value="6172">[6172] KOTA SINGKAWANG</option>
              </select>
            </div>

            {/* Filter Tipe Anomali */}
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Kriteria Anomali:
              </label>
              <select
                value={anomalyTypeFilter}
                onChange={(e) => {
                  setAnomalyTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                <option value="all">Semua Kriteria</option>
                <option value="any_cv">Anomali CV (&gt; 10%)</option>
                <option value="any_rasio">Anomali Rasio (&gt; 106% / &lt; 95%)</option>
                <option value="both">Anomali Ganda (CV & Rasio)</option>
                <option value="cv_only">Hanya Anomali CV Saja</option>
                <option value="rasio_only">Hanya Anomali Rasio Saja</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Status Rekon:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="konfirmasi_lapangan">Konfirmasi Lapangan</option>
                <option value="anomali_terjustifikasi">Anomali Terjustifikasi</option>
                <option value="rekon_selesai">Rekon Selesai</option>
                <option value="belum_rekon">Belum Rekon</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Pencarian:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari komoditas / kab..."
                  className="w-full bg-white border border-slate-300 rounded pl-2.5 pr-7 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <Search className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Table Viewport */}
        <div className="w-full border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full table-fixed text-[11px] leading-tight border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none text-center">
                <th className="py-2.5 px-1.5 w-[4%] text-center">No</th>
                
                {/* Komoditas / Kualitas Rekon */}
                <th
                  onClick={() => handleSort('komoditasNama')}
                  className="py-2.5 px-2 text-left cursor-pointer hover:bg-slate-200 transition-colors w-[21%] group"
                  title="Klik untuk sortir Kualitas Rekon"
                >
                  <div className="flex items-center gap-0.5 truncate">
                    <span>Kualitas / Komoditas Rekon</span>
                    {renderSortIcon('komoditasNama')}
                  </div>
                </th>

                {/* Kabupaten */}
                <th
                  onClick={() => handleSort('kabupatenKode')}
                  className="py-2.5 px-2 text-left cursor-pointer hover:bg-slate-200 transition-colors w-[12%] group"
                  title="Klik untuk sortir Kode Kabupaten"
                >
                  <div className="flex items-center gap-0.5 truncate">
                    <span>Kabupaten</span>
                    {renderSortIcon('kabupatenKode')}
                  </div>
                </th>

                {/* Harga 2027 */}
                <th
                  onClick={() => handleSort('harga2027')}
                  className="py-2.5 px-1.5 text-right cursor-pointer hover:bg-rose-100/70 bg-rose-50/60 transition-colors w-[9.5%] group"
                  title="Harga Satuan 2027 (Tahun Berjalan)"
                >
                  <div className="flex items-center justify-end gap-0.5">
                    <span className="text-rose-900 font-extrabold">Harga '27</span>
                    {renderSortIcon('harga2027')}
                  </div>
                </th>

                {/* Harga 2026 */}
                <th
                  onClick={() => handleSort('harga2026')}
                  className="py-2.5 px-1 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[9%] group"
                  title="Harga Satuan 2026 (Tahun Lalu)"
                >
                  <div className="flex items-center justify-end gap-0.5">
                    <span>Harga '26</span>
                    {renderSortIcon('harga2026')}
                  </div>
                </th>

                {/* Rasio */}
                <th
                  onClick={() => handleSort('rasio')}
                  className="py-2.5 px-1 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[8%] group"
                  title="Rasio Perbandingan Harga 2027 / 2026 (%)"
                >
                  <div className="flex items-center justify-end gap-0.5">
                    <span>Rasio</span>
                    {renderSortIcon('rasio')}
                  </div>
                </th>

                {/* Koefisien Variasi */}
                <th
                  onClick={() => handleSort('koefisienVariasi')}
                  className="py-2.5 px-1 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[7.5%] group"
                  title="Koefisien Variasi harga antar responden di kab/kota (%)"
                >
                  <div className="flex items-center justify-end gap-0.5">
                    <span>CV (%)</span>
                    {renderSortIcon('koefisienVariasi')}
                  </div>
                </th>

                {/* Status Rekon */}
                <th
                  onClick={() => handleSort('statusRekon')}
                  className="py-2.5 px-1 text-center cursor-pointer hover:bg-slate-200 transition-colors w-[11%] group"
                >
                  <div className="flex items-center justify-center gap-0.5">
                    <span>Status Rekon</span>
                    {renderSortIcon('statusRekon')}
                  </div>
                </th>

                {/* Catatan Lapangan */}
                <th className="py-2.5 px-2 text-left w-[13%]">
                  Catatan & Justifikasi
                </th>

                {/* Aksi */}
                <th className="py-2.5 px-1 text-center w-[5%]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">Tidak ditemukan anomali dengan filter yang dipilih.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Coba ubah opsi filter atau kata kunci pencarian.</p>
                  </td>
                </tr>
              ) : (
                currentRows.map((item, idx) => {
                  const globalIdx = startIndex + idx + 1;
                  const rawCatatan = (item.kabupaten.catatan || '').trim();
                  const isAutoText =
                    rawCatatan.includes('Variasi harga antar') ||
                    rawCatatan.includes('Perubahan harga antar') ||
                    rawCatatan.includes('Perlu verifikasi') ||
                    rawCatatan.includes('terjustifikasi faktor') ||
                    rawCatatan.includes('Harga stabil') ||
                    rawCatatan.includes('Perubahan harga signifikan');
                  const displayCatatan = isAutoText ? '' : rawCatatan;

                  const currentEdit = editingRows[item.id] || {
                    status: item.kabupaten.statusRekon,
                    catatan: displayCatatan
                  };
                  const isSaved = savedRowId === item.id;
                  const isHighCV = item.kabupaten.koefisienVariasi > 10;
                  const isExtremeRasio = item.kabupaten.rasio > 106 || item.kabupaten.rasio < 95;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* No */}
                      <td className="py-2 px-1 text-center font-mono text-slate-400">
                        {globalIdx}
                      </td>

                      {/* Komoditas / Kualitas */}
                      <td className="py-2 px-2">
                        <div className="truncate" title={`[${item.komoditas.kode}] ${item.komoditas.nama}`}>
                          <span className="font-mono text-slate-400 text-[10px]">[{item.komoditas.kode}]</span>{' '}
                          <span className="font-bold text-slate-900">{item.komoditas.nama}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Satuan: {item.komoditas.satuan || 'Satuan'}
                        </div>
                      </td>

                      {/* Kabupaten */}
                      <td className="py-2 px-2 font-medium text-slate-900">
                        <div className="flex items-center gap-1 truncate" title={`[${item.kabupaten.kode}] ${item.kabupaten.nama}`}>
                          <span className="font-mono text-slate-500 text-[10px]">[{item.kabupaten.kode}]</span>
                          <span className="font-bold text-slate-800">{item.kabupaten.nama}</span>
                        </div>
                      </td>

                      {/* Harga 2027 */}
                      <td className="py-2 px-1.5 text-right font-mono font-bold text-slate-900 bg-rose-50/30 tabular-nums">
                        {formatRupiahNumber(item.kabupaten.harga2027)}
                      </td>

                      {/* Harga 2026 */}
                      <td className="py-2 px-1 text-right font-mono text-slate-600 tabular-nums">
                        {formatRupiahNumber(item.kabupaten.harga2026)}
                      </td>

                      {/* Rasio */}
                      <td className="py-2 px-1 text-right font-mono tabular-nums">
                        <span
                          className={`inline-block font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            item.kabupaten.rasio > 106
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : item.kabupaten.rasio < 95
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'text-slate-700'
                          }`}
                        >
                          {formatPercent(item.kabupaten.rasio)}%
                        </span>
                      </td>

                      {/* Koefisien Variasi */}
                      <td className="py-2 px-1 text-right font-mono tabular-nums">
                        <span
                          className={`inline-block font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            isHighCV
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'text-slate-600'
                          }`}
                        >
                          {formatPercent(item.kabupaten.koefisienVariasi)}%
                        </span>
                      </td>

                      {/* Status Rekon Dropdown */}
                      <td className="py-1 px-1 text-center">
                        <select
                          value={currentEdit.status}
                          onChange={(e) => handleFieldChange(item.id, 'status', e.target.value)}
                          className={`w-full text-[10px] font-bold rounded px-1.5 py-1 border transition-colors cursor-pointer ${
                            currentEdit.status === 'rekon_selesai'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : currentEdit.status === 'anomali_terjustifikasi'
                              ? 'bg-sky-50 text-sky-800 border-sky-300'
                              : currentEdit.status === 'konfirmasi_lapangan'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="konfirmasi_lapangan">Konfirmasi Lapangan</option>
                          <option value="anomali_terjustifikasi">Anomali Terjustifikasi</option>
                          <option value="rekon_selesai">Rekon Selesai</option>
                          <option value="belum_rekon">Belum Rekon</option>
                        </select>
                      </td>

                      {/* Catatan Lapangan & Inline Save */}
                      <td className="py-1 px-1.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={currentEdit.catatan}
                            onChange={(e) => handleFieldChange(item.id, 'catatan', e.target.value)}
                            placeholder="Tulis justifikasi harga..."
                            className="flex-1 bg-white border border-slate-200 rounded px-2 py-0.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRow(item)}
                            title="Simpan Catatan & Status Rekon"
                            className={`shrink-0 p-1 rounded transition-colors cursor-pointer ${
                              isSaved
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300'
                            }`}
                          >
                            {isSaved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      {/* Aksi: View Responden */}
                      <td className="py-1 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(item.kabupaten, item.komoditas)}
                          title="Lihat Rincian Responden Kualitas Ini"
                          className="inline-flex items-center justify-center w-6 h-6 rounded bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white shadow-2xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 text-xs text-slate-600">
          <div>
            Menampilkan <strong className="font-mono text-slate-900">{totalEntries === 0 ? 0 : startIndex + 1}</strong> s/d{' '}
            <strong className="font-mono text-slate-900">{endIndex}</strong> dari{' '}
            <strong className="font-mono text-slate-900">{totalEntries}</strong> total kasus anomali
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Baris per halaman:</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 text-xs font-semibold"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 text-xs font-semibold"
              >
                ‹
              </button>
              <span className="px-2 font-mono text-slate-800 text-xs">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 text-xs font-semibold"
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 text-xs font-semibold"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
