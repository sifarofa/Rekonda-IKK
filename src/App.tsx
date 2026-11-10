import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { FilterSection } from './components/FilterSection';
import { RekonTable } from './components/RekonTable';
import { GrafikRekonda } from './components/GrafikRekonda';
import { AnomaliRekonTable } from './components/AnomaliRekonTable';
import { DetailModal } from './components/DetailModal';
import { RespondentFormModal } from './components/RespondentFormModal';
import { NotePreviewModal } from './components/NotePreviewModal';
import { AuthModal } from './components/AuthModal';
import { UploadModal } from './components/UploadModal';
import { DisplayAdjustModal } from './components/DisplayAdjustModal';
import { PROVINSI_LIST, KOMODITAS_LIST, INITIAL_KABUPATEN_DATA } from './data/mockData';
import { KabupatenRekon, RespondenData, Komoditas, Provinsi, UserAuth, StatusRekon, DisplaySettings } from './types/rekonda';
import { calculateStats, getDominantBrand } from './utils/formatters';
import {
  exportCurrentTableToExcel,
  exportSeluruhRespondenToExcel,
  exportSeluruhKualitasToExcel
} from './utils/excelExport';
import { CheckCircle2 } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'rekonda_state_2026_2027_v3';
const AUTH_STORAGE_KEY = 'rekonda_auth_user_v2';

export default function App() {
  // Navigation View: 'rekon_daerah' | 'anomali_rekon'
  const [activeView, setActiveView] = useState<'rekon_daerah' | 'anomali_rekon'>('rekon_daerah');

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAuth>(() => {
    try {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedAuth) {
        return JSON.parse(savedAuth);
      }
    } catch {
      // ignore
    }
    // Default: Not logged in (Guest)
    return {
      isLoggedIn: false,
      email: null,
      name: null,
      isOwner: false
    };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isDisplayAdjustOpen, setIsDisplayAdjustOpen] = useState<boolean>(false);

  // Device & Display Settings (Persisted in localStorage)
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(() => {
    try {
      const saved = localStorage.getItem('rekonda_display_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { density: 'normal', scale: 'normal', width: 'contained' };
  });

  const handleUpdateDisplaySettings = (newSettings: DisplaySettings) => {
    setDisplaySettings(newSettings);
    try {
      localStorage.setItem('rekonda_display_settings', JSON.stringify(newSettings));
    } catch {}
    showToast('Tampilan berhasil disesuaikan.');
  };

  const handleResetDisplaySettings = () => {
    const defaultSettings: DisplaySettings = { density: 'normal', scale: 'normal', width: 'contained' };
    setDisplaySettings(defaultSettings);
    try {
      localStorage.setItem('rekonda_display_settings', JSON.stringify(defaultSettings));
    } catch {}
    showToast('Pengaturan tampilan dikembalikan ke standar.');
  };

  // Selected Province & Commodity
  const [selectedProvinsi, setSelectedProvinsi] = useState<Provinsi>(PROVINSI_LIST[0]);
  const [komoditasIndex, setKomoditasIndex] = useState<number>(0);
  const selectedKomoditas = KOMODITAS_LIST[komoditasIndex] || KOMODITAS_LIST[0];

  // Helper to ensure default template notes are blank
  const sanitizeCatatan = (db: Record<string, KabupatenRekon[]>): Record<string, KabupatenRekon[]> => {
    const cleaned: Record<string, KabupatenRekon[]> = {};
    for (const [key, list] of Object.entries(db)) {
      if (Array.isArray(list)) {
        cleaned[key] = list.map((item) => {
          const c = (item.catatan || '').trim();
          const isAuto =
            c.includes('Variasi harga antar') ||
            c.includes('Perubahan harga antar') ||
            c.includes('Perlu verifikasi') ||
            c.includes('terjustifikasi faktor') ||
            c.includes('Harga stabil') ||
            c.includes('Perubahan harga signifikan');
          return isAuto ? { ...item, catatan: '' } : item;
        });
      }
    }
    return cleaned;
  };

  // Database of all datasets keyed by `${provinsiKode}_${komoditasKode}`
  const [database, setDatabase] = useState<Record<string, KabupatenRekon[]>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const sample = parsed['61_1902'] || parsed['61_0102'];
        const k6106 = sample?.find((k: any) => k.kode === '6106');
        if (k6106 && k6106.nama.toUpperCase().includes('KETAPANG') && Object.keys(parsed).length >= 50) {
          return sanitizeCatatan(parsed);
        }
      }
    } catch {
      // Fallback
    }
    return sanitizeCatatan(INITIAL_KABUPATEN_DATA);
  });

  // Dynamic Chart Data synced with Table sorting
  const [chartSortedData, setChartSortedData] = useState<KabupatenRekon[]>([]);

  // Selected for interactions
  const [selectedKabupatenId, setSelectedKabupatenId] = useState<string | null>(null);
  const [detailModalKab, setDetailModalKab] = useState<KabupatenRekon | null>(null);
  const [noteModalKab, setNoteModalKab] = useState<KabupatenRekon | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Respondent Form Modal State
  const [respondentForm, setRespondentForm] = useState<{
    isOpen: boolean;
    initialData?: RespondenData | null;
    defaultTahun?: number;
    defaultTriwulan?: number;
  }>({
    isOpen: false,
    initialData: null,
    defaultTahun: 2026,
    defaultTriwulan: 3
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Fetch initial data from server on startup
  useEffect(() => {
    fetch('/api/data')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data && Object.keys(res.data).length >= 50) {
          const sample = res.data['61_1902'] || res.data['61_0102'];
          const k6106 = sample?.find((k: any) => k.kode === '6106');
          if (k6106 && k6106.nama.toUpperCase().includes('KETAPANG')) {
            setDatabase(sanitizeCatatan(res.data));
            return;
          }
        }
        // Initialize server with authentic 89-quality database
        fetch('/api/save-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ database: sanitizeCatatan(INITIAL_KABUPATEN_DATA) })
        }).catch(() => {});
        setDatabase(sanitizeCatatan(INITIAL_KABUPATEN_DATA));
      })
      .catch((err) => {
        console.log('Server not responding or local dev mode:', err);
      });
  }, []);

  // Save auth state
  const handleLogin = (email: string, name: string) => {
    const isOwner = email.toLowerCase() === 'harga6100@gmail.com';
    const authObj: UserAuth = {
      isLoggedIn: true,
      email,
      name,
      isOwner
    };
    setCurrentUser(authObj);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authObj));
    showToast(isOwner ? 'Berhasil masuk sebagai Pemilik Akun (Akses Penuh).' : `Berhasil masuk sebagai ${name} (Akses Catatan).`);
  };

  const handleLogout = () => {
    const guestAuth: UserAuth = {
      isLoggedIn: false,
      email: null,
      name: null,
      isOwner: false
    };
    setCurrentUser(guestAuth);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    showToast('Anda telah keluar. Mode publik aktif.');
  };

  // Current Key
  const currentKey = `${selectedProvinsi.kode}_${selectedKomoditas.kode}`;

  // Helper to get or generate data for current combo
  const currentKabupatenData = useMemo(() => {
    if (database[currentKey]) {
      return database[currentKey];
    }
    const baseList = INITIAL_KABUPATEN_DATA['61_0102'] || [];
    const multiplierMap: Record<string, number> = {
      '0101': 1.6,
      '0103': 1.8,
      '0104': 0.7,
      '0201': 0.9,
      '0205': 15.0,
      '0301': 4.5,
      '0401': 1.3,
      '0402': 1.1,
      '0501': 12.0
    };
    const mult = multiplierMap[selectedKomoditas.kode] || 1;

    return baseList.map((item) => {
      const h27 = Math.round(item.harga2027 * mult);
      const h26 = Math.round(item.harga2026 * mult);
      return {
        ...item,
        id: `${selectedProvinsi.kode}_${item.kode}_${selectedKomoditas.kode}`,
        harga2027: h27,
        hargaTw3_2026: Math.round(item.hargaTw3_2026 * mult),
        hargaTw4_2026: Math.round(item.hargaTw4_2026 * mult),
        hargaTw1_2027: Math.round(item.hargaTw1_2027 * mult),
        hargaTw2_2027: Math.round(item.hargaTw2_2027 * mult),
        harga2026: h26,
        rasio: h26 > 0 ? parseFloat(((h27 / h26) * 100).toFixed(2)) : 100,
        namaKualitas: `${selectedKomoditas.nama} Standar`,
        catatan: `Survei berkala untuk ${selectedKomoditas.nama} di wilayah ${item.nama}.`,
        statusRekon: item.statusRekon || 'belum_rekon',
        aksiRekon: item.aksiRekon || '',
        respondents: item.respondents.map((r, i) => ({
          ...r,
          id: `${item.kode}_res_${i}`,
          harga: Math.round(r.harga * mult)
        }))
      };
    });
  }, [database, currentKey, selectedProvinsi.kode, selectedKomoditas]);

  // Recalculate kabupaten metrics according to IKK cross-year 2026/2027 specs
  const recalculateKabupatenMetrics = (kab: KabupatenRekon): KabupatenRekon => {
    const res = kab.respondents;
    
    // Quarters for Current Year (IKK 2027: TW 3 & 4 2026, TW 1 & 2 2027)
    const tw3_26 = res.filter((r) => r.tahun === 2026 && r.triwulan === 3).map((r) => r.harga);
    const tw4_26 = res.filter((r) => r.tahun === 2026 && r.triwulan === 4).map((r) => r.harga);
    const tw1_27 = res.filter((r) => r.tahun === 2027 && r.triwulan === 1).map((r) => r.harga);
    const tw2_27 = res.filter((r) => r.tahun === 2027 && r.triwulan === 2).map((r) => r.harga);

    const statTw3_26 = calculateStats(tw3_26);
    const statTw4_26 = calculateStats(tw4_26);
    const statTw1_27 = calculateStats(tw1_27);
    const statTw2_27 = calculateStats(tw2_27);

    // Calculate available quarters average for Harga 2027
    const availableQuarterMeans = [
      statTw3_26.mean,
      statTw4_26.mean,
      statTw1_27.mean,
      statTw2_27.mean
    ].filter((m) => m > 0);

    const newHarga2027 =
      availableQuarterMeans.length > 0
        ? Math.round(availableQuarterMeans.reduce((a, b) => a + b, 0) / availableQuarterMeans.length)
        : kab.harga2027;

    // Koefisien Variasi: variasi harga antar responden di kab/kota yang sama (tahun berjalan)
    const allCurrentPrices = res
      .filter((r) => (r.tahun === 2026 && (r.triwulan === 3 || r.triwulan === 4)) || (r.tahun === 2027 && (r.triwulan === 1 || r.triwulan === 2)))
      .map((r) => r.harga);
    
    const respondentStats = calculateStats(allCurrentPrices.length > 0 ? allCurrentPrices : [kab.harga2027]);

    // Dominant Brand (Mode)
    const newDominantBrand = getDominantBrand(res, kab.namaKualitas || 'Standar');

    // Rasio: (Harga 2027 / Harga 2026) * 100
    const newRasio =
      kab.harga2026 > 0 ? parseFloat(((newHarga2027 / kab.harga2026) * 100).toFixed(2)) : 100;

    return {
      ...kab,
      hargaTw3_2026: statTw3_26.mean > 0 ? statTw3_26.mean : kab.hargaTw3_2026,
      hargaTw4_2026: statTw4_26.mean > 0 ? statTw4_26.mean : kab.hargaTw4_2026,
      hargaTw1_2027: statTw1_27.mean > 0 ? statTw1_27.mean : kab.hargaTw1_2027,
      hargaTw2_2027: statTw2_27.mean > 0 ? statTw2_27.mean : kab.hargaTw2_2027,
      harga2027: newHarga2027,
      koefisienVariasi: respondentStats.cv,
      namaKualitas: newDominantBrand,
      rasio: newRasio
    };
  };

  // Sync to database and server
  const saveUpdatedList = (updatedList: KabupatenRekon[]) => {
    setDatabase((prev) => {
      const nextDb = {
        ...prev,
        [currentKey]: updatedList
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextDb));
      } catch {}

      // Server sync
      fetch('/api/save-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: nextDb })
      }).catch((err) => console.log('Server sync notice:', err));

      return nextDb;
    });
  };

  // Update a single Kabupaten record
  const handleUpdateKabupaten = (updated: KabupatenRekon) => {
    const recomputed = recalculateKabupatenMetrics(updated);
    const currentList = [...currentKabupatenData];
    const index = currentList.findIndex((item) => item.id === recomputed.id || item.kode === recomputed.kode);
    if (index >= 0) {
      currentList[index] = recomputed;
    } else {
      currentList.push(recomputed);
    }
    saveUpdatedList(currentList);

    // Sync active detail modal
    if (detailModalKab && (detailModalKab.id === recomputed.id || detailModalKab.kode === recomputed.kode)) {
      setDetailModalKab(recomputed);
    }

    // Also persist single update to server
    fetch('/api/kabupaten/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: currentKey, kabupaten: recomputed })
    }).catch(() => {});
  };

  // Update Anomali Row with single Catatan field across any commodity key
  const handleUpdateAnomali = (
    targetKey: string,
    kabupatenId: string,
    status: StatusRekon,
    catatan: string
  ) => {
    setDatabase((prev) => {
      const list = [...(prev[targetKey] || [])];
      const target = list.find((k) => k.id === kabupatenId || k.kode === kabupatenId);
      if (target) {
        target.statusRekon = status;
        target.catatan = catatan;
        target.isVerified = status === 'rekon_selesai';
      }
      const nextDb = { ...prev, [targetKey]: list };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextDb));
      } catch {}

      fetch('/api/anomali/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: targetKey,
          kabupatenId,
          statusRekon: status,
          catatan
        })
      }).catch(() => {});

      return nextDb;
    });

    showToast(`Status Rekon & Catatan berhasil diperbarui.`);
  };

  // Upload Apply Data
  const handleApplyUploadedData = (
    updatedList: KabupatenRekon[],
    sheetType: 'rekonda26' | 'tabel71'
  ) => {
    const recomputed = updatedList.map((item) => {
      const metric = recalculateKabupatenMetrics(item);
      if (sheetType === 'rekonda26') {
        metric.harga2026 = item.harga2026;
        metric.hargaTw3_2025 = item.hargaTw3_2025;
        metric.hargaTw4_2025 = item.hargaTw4_2025;
        metric.hargaTw1_2026 = item.hargaTw1_2026;
        metric.hargaTw2_2026 = item.hargaTw2_2026;
        metric.rasio = item.harga2026 > 0 ? parseFloat(((metric.harga2027 / item.harga2026) * 100).toFixed(2)) : 100;
      }
      return metric;
    });
    saveUpdatedList(recomputed);
    showToast(
      sheetType === 'rekonda26'
        ? 'Data tahun sebelumnya (IKK Rekonda Responden) berhasil disinkronkan ke kolom Harga 2026!'
        : 'Data tahun berjalan (Database Tabel 7.1) berhasil diperbarui ke kolom Harga 2027!'
    );
  };

  // Stepper handlers
  const handlePrevKomoditas = () => {
    setKomoditasIndex((prev) => (prev > 0 ? prev - 1 : KOMODITAS_LIST.length - 1));
  };

  const handleNextKomoditas = () => {
    setKomoditasIndex((prev) => (prev < KOMODITAS_LIST.length - 1 ? prev + 1 : 0));
  };

  const handleTampilkan = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast('Data rekonsiliasi berhasil dimuat dan disinkronkan.');
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  // Add / Edit Respondent handlers
  const handleOpenAddRespondent = (defaultTahun?: number, defaultTw?: number) => {
    if (!currentUser.isOwner) {
      alert('Akses khusus pemilik akun (harga6100@gmail.com).');
      return;
    }
    setRespondentForm({
      isOpen: true,
      initialData: null,
      defaultTahun: defaultTahun || 2026,
      defaultTriwulan: defaultTw || 3
    });
  };

  const handleOpenEditRespondent = (item: RespondenData) => {
    if (!currentUser.isOwner) {
      alert('Akses khusus pemilik akun (harga6100@gmail.com).');
      return;
    }
    setRespondentForm({
      isOpen: true,
      initialData: item,
      defaultTahun: item.tahun,
      defaultTriwulan: item.triwulan
    });
  };

  const handleSaveRespondent = (respData: Omit<RespondenData, 'id'> & { id?: string }) => {
    if (!detailModalKab) return;

    let updatedRespondents: RespondenData[];
    if (respData.id) {
      updatedRespondents = detailModalKab.respondents.map((r) =>
        r.id === respData.id ? ({ ...r, ...respData } as RespondenData) : r
      );
      showToast(`Data responden ${respData.nama} berhasil diperbarui.`);
    } else {
      const newEntry: RespondenData = {
        id: `res_${Date.now()}`,
        ...respData
      };
      updatedRespondents = [...detailModalKab.respondents, newEntry];
      showToast(`Responden ${respData.nama} berhasil ditambahkan.`);
    }

    const updatedKab = {
      ...detailModalKab,
      respondents: updatedRespondents
    };
    handleUpdateKabupaten(updatedKab);
  };

  const handleDeleteRespondent = (id: string) => {
    if (!detailModalKab) return;
    const updatedRespondents = detailModalKab.respondents.filter((r) => r.id !== id);
    const updatedKab = {
      ...detailModalKab,
      respondents: updatedRespondents
    };
    handleUpdateKabupaten(updatedKab);
    showToast('Data responden berhasil dihapus.');
  };

  // Note Modal Save
  const handleSaveNote = (kabupatenId: string, noteText: string) => {
    if (!currentUser.isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    const kab = currentKabupatenData.find((k) => k.id === kabupatenId);
    if (kab) {
      handleUpdateKabupaten({
        ...kab,
        catatan: noteText
      });
      showToast(`Catatan untuk ${kab.nama} berhasil disimpan ke server.`);
    }
  };

  // Excel exports
  const handleExportExcelTable = () => {
    exportCurrentTableToExcel(selectedProvinsi, selectedKomoditas, currentKabupatenData);
    showToast('Tabel berhasil diekspor ke file Excel (.xlsx).');
  };

  const handleExportSeluruhKualitas = () => {
    exportSeluruhKualitasToExcel(selectedProvinsi, KOMODITAS_LIST, currentKabupatenData);
    showToast('Seluruh kualitas berhasil diekspor ke Excel (.xlsx).');
  };

  const handleExportSeluruhResponden = () => {
    exportSeluruhRespondenToExcel(selectedProvinsi, selectedKomoditas, currentKabupatenData);
    showToast('Seluruh data responden berhasil diekspor ke Excel (.xlsx).');
  };

  // Sync active detail modal
  const activeDetailKab = detailModalKab
    ? currentKabupatenData.find((k) => k.id === detailModalKab.id || k.kode === detailModalKab.kode) || detailModalKab
    : null;

  const anomalyCount = currentKabupatenData.filter(
    (d) => d.koefisienVariasi > 10 || d.rasio > 106 || d.rasio < 95
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-80 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <HeaderNav
        onRefresh={handleTampilkan}
        onPrint={handlePrint}
        isRefreshing={isLoading}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenDisplayAdjust={() => setIsDisplayAdjustOpen(true)}
        activeView={activeView}
        onSelectView={(v) => setActiveView(v)}
        anomalyCount={anomalyCount}
      />

      {/* Main Container with responsive scaling and width adjust */}
      <main
        className={`flex-1 w-full ${
          displaySettings.width === 'full' ? 'max-w-none px-2 sm:px-4 lg:px-6' : 'max-w-7xl mx-auto px-2 sm:px-4 lg:px-6'
        } ${
          displaySettings.scale === 'small'
            ? 'text-[92%]'
            : displaySettings.scale === 'large'
            ? 'text-[108%]'
            : 'text-[100%]'
        } py-3 sm:py-4 transition-all duration-150`}
      >
        {/* View Switcher: Rekon Daerah vs Tabel Anomali Rekon */}
        {activeView === 'rekon_daerah' ? (
          <>
            {/* Filter & Banner Section */}
            <FilterSection
              provinsiList={PROVINSI_LIST}
              selectedProvinsi={selectedProvinsi}
              onSelectProvinsi={(prov) => {
                setSelectedProvinsi(prov);
                setSelectedKabupatenId(null);
              }}
              komoditasList={KOMODITAS_LIST}
              selectedKomoditas={selectedKomoditas}
              onSelectKomoditas={(kom) => {
                const idx = KOMODITAS_LIST.findIndex((k) => k.kode === kom.kode);
                if (idx >= 0) setKomoditasIndex(idx);
              }}
              currentIndex={komoditasIndex}
              totalKomoditas={KOMODITAS_LIST.length}
              onPrevKomoditas={handlePrevKomoditas}
              onNextKomoditas={handleNextKomoditas}
              onTampilkan={handleTampilkan}
              isLoading={isLoading}
              onDownloadSeluruhKualitas={handleExportSeluruhKualitas}
              onDownloadSeluruhResponden={handleExportSeluruhResponden}
              data={currentKabupatenData}
            />

            {/* Main Data Table with Responsive Scroll & Density */}
            <RekonTable
              data={currentKabupatenData}
              density={displaySettings.density}
              onOpenDetail={(item) => {
                setDetailModalKab(item);
                setSelectedKabupatenId(item.id);
              }}
              onOpenNote={(item) => {
                if (!currentUser.isLoggedIn) {
                  setIsAuthModalOpen(true);
                  return;
                }
                setNoteModalKab(item);
              }}
              onExportExcel={handleExportExcelTable}
              onPrint={handlePrint}
              selectedId={selectedKabupatenId}
              onSelectRow={(item) => setSelectedKabupatenId(item.id)}
              onSortedDataChange={(sorted) => setChartSortedData(sorted)}
              currentUser={currentUser}
            />

            {/* Dynamic Bar Chart: Exactly synchronized with table sort order */}
            <GrafikRekonda
              data={chartSortedData.length > 0 ? chartSortedData : currentKabupatenData}
              onSelectKabupaten={(item) => {
                setSelectedKabupatenId(item.id);
                setDetailModalKab(item);
              }}
              selectedId={selectedKabupatenId}
            />
          </>
        ) : (
          /* Tabel Anomali Rekon */
          <AnomaliRekonTable
            database={database}
            density={displaySettings.density}
            komoditasList={KOMODITAS_LIST}
            provinsi={selectedProvinsi}
            selectedKomoditas={selectedKomoditas}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onUpdateAnomali={handleUpdateAnomali}
            onOpenDetail={(kab, kom) => {
              const idx = KOMODITAS_LIST.findIndex((k) => k.kode === kom.kode);
              if (idx >= 0) setKomoditasIndex(idx);
              setDetailModalKab(kab);
              setSelectedKabupatenId(kab.id);
            }}
          />
        )}
      </main>


      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-[11px] py-3.5 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>REKONDA 2026/2027 · Sistem Rekonsiliasi Data IKK Lintas Tahun</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Standar Indeks Kemahalan Konstruksi (IKK)</span>
            <span>·</span>
            <span>Server Sync Active</span>
          </div>
        </div>
      </footer>

      {/* Detail Rekonda Modal (Matching Screenshot 2 + Sorting on respondents) */}
      {activeDetailKab && (
        <DetailModal
          isOpen={Boolean(activeDetailKab)}
          onClose={() => setDetailModalKab(null)}
          kabupaten={activeDetailKab}
          komoditas={selectedKomoditas}
          onUpdateKabupaten={handleUpdateKabupaten}
          onOpenAddRespondent={handleOpenAddRespondent}
          onOpenEditRespondent={handleOpenEditRespondent}
          onDeleteRespondent={handleDeleteRespondent}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* Add / Edit Respondent Form Modal */}
      <RespondentFormModal
        isOpen={respondentForm.isOpen}
        onClose={() => setRespondentForm((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleSaveRespondent}
        initialData={respondentForm.initialData}
        defaultTahun={respondentForm.defaultTahun}
        defaultTriwulan={respondentForm.defaultTriwulan}
        kabupatenNama={detailModalKab ? `[${detailModalKab.kode}] ${detailModalKab.nama}` : ''}
      />

      {/* Note Quick Viewer & Editor Modal */}
      {noteModalKab && (
        <NotePreviewModal
          isOpen={Boolean(noteModalKab)}
          onClose={() => setNoteModalKab(null)}
          kabupaten={noteModalKab}
          onSaveNote={handleSaveNote}
        />
      )}

      {/* Auth Modal (Google Login / Owner Verification) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Document Upload Modal (rekonda26 & tabel 7.1) */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        currentData={currentKabupatenData}
        onApplyData={handleApplyUploadedData}
        selectedKomoditas={selectedKomoditas}
        onQuickLoginAsOwner={() => handleLogin('harga6100@gmail.com', 'Admin Rekonda')}
      />

      {/* Display & Device Adjuster Modal */}
      <DisplayAdjustModal
        isOpen={isDisplayAdjustOpen}
        onClose={() => setIsDisplayAdjustOpen(false)}
        settings={displaySettings}
        onUpdateSettings={handleUpdateDisplaySettings}
        onResetSettings={handleResetDisplaySettings}
      />
    </div>
  );
}

