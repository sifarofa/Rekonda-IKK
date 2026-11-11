import React, { useState, useMemo, useEffect } from 'react';
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
  Check,
  ShieldCheck,
  Building2,
  Lock,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { KabupatenRekon, StatusRekon, UserAuth, Komoditas, Provinsi, DisplayDensity } from '../types/rekonda';
import { formatRupiahNumber, formatRupiahCurrency, formatPercent } from '../utils/formatters';
import { KABUPATEN_KALBAR_LIST } from '../data/kabupatenList';

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
  density?: DisplayDensity;
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
  onOpenDetail,
  density = 'normal'
}) => {
  // Determine role isolation
  const isKabupatenRole = currentUser.role === 'kabupaten' && !!currentUser.kabupatenKode;
  const isPemilik = currentUser.role === 'pemilik' || currentUser.isOwner;

  // Filters
  const [selectedKomoditasFilter, setSelectedKomoditasFilter] = useState<string>('all');
  const [selectedKabupatenFilter, setSelectedKabupatenFilter] = useState<string>(
    isKabupatenRole && currentUser.kabupatenKode ? currentUser.kabupatenKode : 'all'
  );
  const [anomalyTypeFilter, setAnomalyTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Monitoring panel state for Pemilik
  const [showMonitoringPanel, setShowMonitoringPanel] = useState<boolean>(false);

  // Sync kabupaten filter if role is kabupaten
  useEffect(() => {
    if (isKabupatenRole && currentUser.kabupatenKode) {
      setSelectedKabupatenFilter(currentUser.kabupatenKode);
    }
  }, [isKabupatenRole, currentUser.kabupatenKode]);

  // Pagination & Sorting
  const [entriesPerPage, setEntriesPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<SortField>('komoditasKode');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

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

  // Total anomalies across Kalbar
  const totalAnomaliesCount = allAnomalies.length;

  // Anomalies for current kabupaten role (if locked)
  const userKabupatenAnomaliesCount = useMemo(() => {
    if (!isKabupatenRole || !currentUser.kabupatenKode) return 0;
    return allAnomalies.filter((item) => item.kabupaten.kode === currentUser.kabupatenKode).length;
  }, [allAnomalies, isKabupatenRole, currentUser.kabupatenKode]);

  // Monitoring status per kabupaten for Pemilik (14 Kab/Kota)
  const kabStatusSummary = useMemo(() => {
    return KABUPATEN_KALBAR_LIST.map((k) => {
      const items = allAnomalies.filter((a) => a.kabupaten.kode === k.kode);
      const total = items.length;
      const selesai = items.filter((a) => a.kabupaten.statusRekon === 'rekon_selesai').length;
      const terjustifikasi = items.filter((a) => a.kabupaten.statusRekon === 'anomali_terjustifikasi').length;
      const konfirmasi = items.filter((a) => a.kabupaten.statusRekon === 'konfirmasi_lapangan').length;
      const belum = items.filter((a) => !a.kabupaten.statusRekon || a.kabupaten.statusRekon === 'belum_rekon').length;
      const progressPct = total > 0 ? Math.round(((selesai + terjustifikasi) / total) * 100) : 100;

      return {
        ...k,
        total,
        selesai,
        terjustifikasi,
        konfirmasi,
        belum,
        progressPct
      };
    });
  }, [allAnomalies]);

  // Overall completed count across Kalbar
  const totalSelesaiKalbar = useMemo(() => {
    return allAnomalies.filter(
      (a) => a.kabupaten.statusRekon === 'rekon_selesai' || a.kabupaten.statusRekon === 'anomali_terjustifikasi'
    ).length;
  }, [allAnomalies]);

  // Filtered and Sorted Anomalies
  const filteredAndSortedData = useMemo(() => {
    let result = [...allAnomalies];

    // Role-based Kabupaten isolation
    if (isKabupatenRole && currentUser.kabupatenKode) {
      result = result.filter((item) => item.kabupaten.kode === currentUser.kabupatenKode);
    } else if (selectedKabupatenFilter !== 'all') {
      result = result.filter((item) => item.kabupaten.kode === selectedKabupatenFilter);
    }

    // Filter Komoditas
    if (selectedKomoditasFilter !== 'all') {
      result = result.filter((item) => item.komoditas.kode === selectedKomoditasFilter);
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
        case 'komoditasKode': {
          const numA = parseInt(a.komoditas.kode, 10);
          const numB = parseInt(b.komoditas.kode, 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            aVal = numA;
            bVal = numB;
          } else {
            aVal = a.komoditas.kode;
            bVal = b.komoditas.kode;
          }
          break;
        }
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
          aVal = a.kabupaten.statusRekon || 'belum_rekon';
          bVal = b.kabupaten.statusRekon || 'belum_rekon';
          break;
        default:
          aVal = a.komoditas.kode;
          bVal = b.komoditas.kode;
      }

      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [
    allAnomalies,
    isKabupatenRole,
    currentUser.kabupatenKode,
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

  // Check if a row can be edited by current user
  const canEditRow = (kabKode: string) => {
    if (!currentUser.isLoggedIn) return false;
    if (isPemilik) return true;
    if (isKabupatenRole && currentUser.kabupatenKode === kabKode) return true;
    return false;
  };

  // Save changes to single anomaly row
  const handleSaveRow = (item: AnomaliItem) => {
    if (!currentUser.isLoggedIn) {
      onOpenAuth();
      return;
    }

    if (!canEditRow(item.kabupaten.kode)) {
      alert(`Akses ditolak: Anda hanya berhak mengubah data wilayah Anda sendiri ([${currentUser.kabupatenKode}] ${currentUser.kabupatenNama}).`);
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

    const filePrefix = isKabupatenRole
      ? `Rekap_Anomali_BPS_${currentUser.kabupatenKode}_${currentUser.kabupatenNama || 'Kab'}`
      : `Rekap_Anomali_Rekon_Seluruh_Kalbar`;

    XLSX.writeFile(
      wb,
      `${filePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-4">
      {/* Role-Specific Banner */}
      {isKabupatenRole ? (
        <div className="bg-sky-50 border border-sky-300 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-sky-200 text-sky-800 font-extrabold px-1.5 py-0.2 rounded border border-sky-300">
                  SESI ADMIN KAB/KOTA
                </span>
                <strong className="text-xs sm:text-sm font-bold text-sky-950">
                  [{currentUser.kabupatenKode}] {currentUser.kabupatenNama}
                </strong>
              </div>
              <p className="text-[11px] text-sky-800 mt-0.5">
                Tabel terkunci khusus anomali harga wilayah Anda ({userKabupatenAnomaliesCount} komoditas terdeteksi). Silakan isi catatan justifikasi dan perbarui status rekon.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-sky-900 bg-white px-2.5 py-1 rounded-md border border-sky-200 font-mono">
              {userKabupatenAnomaliesCount} Anomali Terfilter
            </span>
          </div>
        </div>
      ) : isPemilik ? (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-rose-200 text-rose-900 font-extrabold px-1.5 py-0.2 rounded border border-rose-300">
                  HAK AKSES ADMIN PROVINSI
                </span>
                <strong className="text-xs sm:text-sm font-bold text-rose-950">
                  BPS Provinsi Kalimantan Barat
                </strong>
              </div>
              <p className="text-[11px] text-rose-800 mt-0.5">
                Memantau anomali di seluruh 14 kabupaten/kota se-Kalbar. Terselesaikan: {totalSelesaiKalbar} dari {totalAnomaliesCount} kasus.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMonitoringPanel(!showMonitoringPanel)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{showMonitoringPanel ? 'Tutup Monitoring' : 'Lihat Status 14 Kab/Kota'}</span>
              {showMonitoringPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Mode Tamu: Anda dapat melihat seluruh anomali 14 kab/kota. Untuk mengisi justifikasi atau mengunggah data, silakan masuk dengan akun resmi.</span>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-2.5 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-md shrink-0 cursor-pointer"
          >
            Masuk / Login
          </button>
        </div>
      )}

      {/* Monitoring Panel for Pemilik (14 Kab/Kota Status Matrix) */}
      {isPemilik && showMonitoringPanel && (
        <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white">
                Status Rekonsiliasi & Penyelesaian Anomali Seluruh 14 Kab/Kota
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Total Kalbar: {totalAnomaliesCount} Anomali
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {kabStatusSummary.map((k) => {
              const isSelected = selectedKabupatenFilter === k.kode;
              return (
                <div
                  key={k.kode}
                  onClick={() => {
                    setSelectedKabupatenFilter(isSelected ? 'all' : k.kode);
                    setCurrentPage(1);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500/30'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                  }`}
                  title="Klik untuk memfilter tabel ke wilayah ini"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-slate-400">[{k.kode}]</span>
                    <span
                      className={`text-[9px] font-extrabold px-1 rounded ${
                        k.progressPct === 100 && k.total > 0
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : k.progressPct > 50
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {k.progressPct}%
                    </span>
                  </div>
                  <h4 className="text-[11px] font-bold text-white truncate">{k.nama}</h4>
                  <div className="mt-1 text-[10px] text-slate-300 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Anomali:</span>
                      <strong className="font-mono text-rose-300">{k.total}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Selesai/Just:</span>
                      <strong className="font-mono text-emerald-300">{k.selesai + k.terjustifikasi}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 w-full overflow-hidden">
        {/* Header & Controls Toolbar */}
        <div className="border-b border-slate-200 pb-3 mb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>
                  {isKabupatenRole
                    ? `Daftar Anomali Harga: [${currentUser.kabupatenKode}] ${currentUser.kabupatenNama}`
                    : 'Daftar Anomali CV & Rasio per Jenis Kualitas / Komoditas Rekon'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isKabupatenRole
                  ? 'Menampilkan anomali Koefisien Variasi (> 10%) dan Rasio harga (> 106% / < 95%) khusus untuk wilayah Anda.'
                  : 'Menampilkan seluruh kabupaten/kota yang mengalami anomali Koefisien Variasi (> 10%) dan Rasio perbandingan harga (> 106% / < 95%) lintas 89 komoditas.'}
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
                <option value="all">Semua Kualitas Rekon</option>
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
              {isKabupatenRole ? (
                <div className="w-full bg-sky-100/70 border border-sky-300 rounded px-2 py-1 text-xs font-bold text-sky-900 flex items-center justify-between">
                  <span className="truncate">[{currentUser.kabupatenKode}] {currentUser.kabupatenNama}</span>
                  <Lock className="w-3 h-3 text-sky-700 shrink-0 ml-1" />
                </div>
              ) : (
                <select
                  value={selectedKabupatenFilter}
                  onChange={(e) => {
                    setSelectedKabupatenFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="all">Semua Kabupaten (14 Wilayah)</option>
                  {KABUPATEN_KALBAR_LIST.map((k) => (
                    <option key={k.kode} value={k.kode}>
                      [{k.kode}] {k.nama}
                    </option>
                  ))}
                </select>
              )}
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
                <option value="both">Ganda (CV &amp; Rasio)</option>
                <option value="cv_only">Hanya CV</option>
                <option value="rasio_only">Hanya Rasio</option>
              </select>
            </div>

            {/* Filter Status Rekon */}
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
                <option value="belum_rekon">Belum Rekon</option>
                <option value="konfirmasi_lapangan">Konfirmasi Lapangan</option>
                <option value="anomali_terjustifikasi">Anomali Terjustifikasi</option>
                <option value="rekon_selesai">Rekon Selesai</option>
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

        {/* Mobile Horizontal Scroll Indicator */}
        <div className="sm:hidden text-[10px] text-slate-500 flex items-center justify-between pb-1 px-1">
          <span>* Tabel anomali</span>
          <span className="font-medium text-sky-700">Geser ke kanan &rarr;</span>
        </div>

        {/* Table Viewport */}
        <div className="w-full overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
          <table className={`w-full min-w-[960px] lg:min-w-full table-fixed ${density === 'compact' ? 'text-[10.5px]' : density === 'comfortable' ? 'text-xs' : 'text-[11px]'} leading-tight border-collapse`}>
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none text-center">
                <th className={`${density === 'compact' ? 'py-1.5' : density === 'comfortable' ? 'py-3' : 'py-2.5'} px-1.5 w-[4%] text-center`}>No</th>
                
                {/* Komoditas / Kualitas Rekon */}
                <th
                  onClick={() => handleSort('komoditasKode')}
                  className="py-2.5 px-2 text-left cursor-pointer hover:bg-slate-200 transition-colors w-[21%] group"
                  title="Klik untuk sortir Kualitas Rekon"
                >
                  <div className="flex items-center gap-0.5 truncate">
                    <span>Kualitas / Komoditas Rekon</span>
                    {renderSortIcon('komoditasKode')}
                  </div>
                </th>

                {/* Kabupaten */}
                <th
                  onClick={() => handleSort('kabupatenKode')}
                  className="py-2.5 px-2 text-left cursor-pointer hover:bg-slate-200 transition-colors w-[12%] group"
                  title="Klik untuk sortir Kode Kabupaten"
                >
                  <div className="flex items-center gap-0.5 truncate">
                    <span>Kabupaten / Kota</span>
                    {renderSortIcon('kabupatenKode')}
                  </div>
                </th>

                {/* Harga 2027 */}
                <th
                  onClick={() => handleSort('harga2027')}
                  className="py-2.5 px-2 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[10%] group"
                >
                  <div className="flex items-center justify-end gap-0.5 truncate">
                    <span>Harga 2027</span>
                    {renderSortIcon('harga2027')}
                  </div>
                </th>

                {/* Harga 2026 */}
                <th
                  onClick={() => handleSort('harga2026')}
                  className="py-2.5 px-2 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[10%] group"
                >
                  <div className="flex items-center justify-end gap-0.5 truncate">
                    <span>Harga 2026</span>
                    {renderSortIcon('harga2026')}
                  </div>
                </th>

                {/* Rasio */}
                <th
                  onClick={() => handleSort('rasio')}
                  className="py-2.5 px-1 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[7%] group"
                >
                  <div className="flex items-center justify-end gap-0.5 truncate">
                    <span>Rasio</span>
                    {renderSortIcon('rasio')}
                  </div>
                </th>

                {/* Koefisien Variasi */}
                <th
                  onClick={() => handleSort('koefisienVariasi')}
                  className="py-2.5 px-1 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[7%] group"
                >
                  <div className="flex items-center justify-end gap-0.5 truncate">
                    <span>CV (%)</span>
                    {renderSortIcon('koefisienVariasi')}
                  </div>
                </th>

                {/* Status Rekon */}
                <th
                  onClick={() => handleSort('statusRekon')}
                  className="py-2.5 px-1 text-center cursor-pointer hover:bg-slate-200 transition-colors w-[12%] group"
                >
                  <div className="flex items-center justify-center gap-0.5 truncate">
                    <span>Status Rekon</span>
                    {renderSortIcon('statusRekon')}
                  </div>
                </th>

                {/* Catatan & Justifikasi */}
                <th className="py-2.5 px-2 text-left w-[14%]">
                  Catatan &amp; Justifikasi
                </th>

                {/* Aksi */}
                <th className="py-2.5 px-1 text-center w-[3%]">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada anomali yang sesuai dengan filter.
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
                    status: item.kabupaten.statusRekon || 'belum_rekon',
                    catatan: displayCatatan
                  };

                  const isSaved = savedRowId === item.id;
                  const isHighCV = item.kabupaten.koefisienVariasi > 10;
                  const isExtremeRasio = item.kabupaten.rasio > 106 || item.kabupaten.rasio < 95;
                  const userCanEdit = canEditRow(item.kabupaten.kode);

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
                          disabled={!userCanEdit}
                          value={currentEdit.status}
                          onChange={(e) => handleFieldChange(item.id, 'status', e.target.value)}
                          className={`w-full text-[10px] font-bold rounded px-1.5 py-1 border transition-colors ${
                            !userCanEdit
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'cursor-pointer'
                          } ${
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
                            disabled={!userCanEdit}
                            value={currentEdit.catatan}
                            onChange={(e) => handleFieldChange(item.id, 'catatan', e.target.value)}
                            placeholder={userCanEdit ? "Tulis justifikasi harga..." : "Hanya admin wilayah ini..."}
                            className={`flex-1 border rounded px-2 py-0.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                              !userCanEdit ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400' : 'bg-white border-slate-200'
                            }`}
                          />
                          {userCanEdit ? (
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
                          ) : (
                            <span title="Akses edit hanya untuk admin kabupaten terkait" className="p-1 text-slate-300">
                              <Lock className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Aksi / View Detail */}
                      <td className="py-2 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(item.kabupaten, item.komoditas)}
                          title="Lihat Detail Responden & Rekon"
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-slate-600 select-none border-t border-slate-100 mt-2">
          <div>
            Menampilkan <strong className="font-mono text-slate-900">{totalEntries === 0 ? 0 : startIndex + 1}</strong> s/d{' '}
            <strong className="font-mono text-slate-900">{endIndex}</strong> dari{' '}
            <strong className="font-mono text-slate-900">{totalEntries}</strong> anomali
          </div>

          <div className="flex items-center gap-4">
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
