import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  Lock,
  Layers,
  FileUp,
  ClipboardPaste,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { KabupatenRekon, Komoditas, UserAuth } from '../types/rekonda';
import { formatRupiahNumber, formatPercent } from '../utils/formatters';
import {
  downloadTemplateTabel71,
  downloadTemplateIKKResponden,
  downloadTemplateIKKWebentry
} from '../utils/templateGenerators';
import {
  parseFileToRows,
  processTabel71Upload,
  processIKKRespondenUpload,
  processIKKWebentryUpload,
  detectTemplateType,
  processDual2026Merge,
  ParseResult
} from '../utils/templateParsers';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAuth;
  onOpenAuth: () => void;
  currentData: KabupatenRekon[];
  onApplyData: (updatedList: KabupatenRekon[], sheetType: 'rekonda26' | 'tabel71') => void;
  selectedKomoditas: Komoditas;
  onQuickLoginAsOwner?: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  currentData,
  onApplyData,
  selectedKomoditas,
  onQuickLoginAsOwner
}) => {
  // Tab: 'tabel71' (Tahun Berjalan -> Harga 2027) | 'rekonda26' (Tahun Sebelumnya -> Harga 2026)
  const [activeTab, setActiveTab] = useState<'tabel71' | 'rekonda26'>('tabel71');

  // Sub-source for 2026: 'auto_merge' | 'rekonnas' | 'webentry'
  const [source2026, setSource2026] = useState<'auto_merge' | 'rekonnas' | 'webentry'>('auto_merge');

  // Input method: 'upload' | 'paste'
  const [inputMethod, setInputMethod] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string>('');
  const [successInfo, setSuccessInfo] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedCommodityFilter, setSelectedCommodityFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  // Process rows with selected tab and sub-type
  const runParser = (
    rows: any[],
    tab: 'tabel71' | 'rekonda26',
    subSource: 'auto_merge' | 'rekonnas' | 'webentry' = source2026,
    filterComm: string = selectedCommodityFilter
  ) => {
    try {
      if (tab === 'tabel71') {
        const result = processTabel71Upload(rows, currentData, filterComm);
        setParseResult(result);
        if (result.affectedKabCount === 0) {
          setParseError('Tidak ditemukan kode kabupaten/kota yang cocok. Pastikan berkas memuat kolom Kode Kabupaten (6101-6172).');
        } else {
          setSuccessInfo(`Berhasil memproses ${result.totalRows.toLocaleString('id-ID')} baris data. Menemukan ${result.affectedKabCount} kabupaten/kota untuk diperbarui ke kolom Harga 2027.`);
          setParseError('');
        }
      } else {
        // Tab rekonda26 (Tahun sebelumnya / Harga 2026)
        const detected = detectTemplateType(rows);

        let result: ParseResult;
        if (subSource === 'webentry' || (subSource === 'auto_merge' && detected === 'rekonda_webentry')) {
          result = processIKKWebentryUpload(rows, currentData, filterComm);
        } else {
          result = processIKKRespondenUpload(rows, currentData, filterComm);
        }

        setParseResult(result);
        if (result.affectedKabCount === 0) {
          setParseError('Tidak ditemukan wilayah yang cocok dalam berkas. Pastikan kolom memuat nama atau kode kabupaten.');
        } else {
          setSuccessInfo(`Berhasil memproses data tahun sebelumnya (${result.affectedKabCount} kabupaten/kota). Diperbarui ke kolom Harga 2026.`);
          setParseError('');
        }
      }
    } catch (err: any) {
      setParseError(`Gagal memproses berkas: ${err.message || 'Format tidak sesuai'}`);
      setParseResult(null);
    }
  };

  // Handle local File selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFileName(selectedFile.name);
    setParseError('');
    setSuccessInfo('');
    setIsProcessing(true);

    try {
      const rows = await parseFileToRows(selectedFile);
      if (!rows || rows.length === 0) {
        setParseError('Berkas Excel / CSV kosong.');
        setParseResult(null);
        setIsProcessing(false);
        return;
      }

      runParser(rows, activeTab, source2026, selectedCommodityFilter);
    } catch (err: any) {
      setParseError(`Gagal membaca berkas: ${err.message || 'Format berkas tidak didukung'}`);
      setParseResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Pasted Text processing
  const handleProcessPastedText = async () => {
    if (!pastedText || pastedText.trim().length === 0) {
      setParseError('Silakan tempel teks tabel terlebih dahulu.');
      return;
    }

    setIsProcessing(true);
    setParseError('');
    setSuccessInfo('');
    setFileName('Teks Tempel (Clipboard)');

    try {
      const rows = await parseFileToRows(pastedText.trim());
      if (!rows || rows.length === 0) {
        setParseError('Teks yang ditempel tidak dapat dikenali sebagai tabel baris & kolom.');
        setParseResult(null);
        setIsProcessing(false);
        return;
      }
      runParser(rows, activeTab, source2026, selectedCommodityFilter);
    } catch (err: any) {
      setParseError(`Gagal membaca teks: ${err.message}`);
      setParseResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Load Built-in Template Sample
  const handleLoadSample = async (type: 'tabel71' | 'rekonnas' | 'webentry' | 'auto_merge') => {
    setIsProcessing(true);
    setParseError('');
    setSuccessInfo('');

    try {
      if (type === 'tabel71') {
        setActiveTab('tabel71');
        setFileName('database_tabel_7.1.csv (Tahun Berjalan 2026/2027)');
        const res = await fetch('/assets/aistudio/database_tabel_7.1_0a44d253.csv');
        const text = await res.text();
        const rows = await parseFileToRows(text);
        runParser(rows, 'tabel71', 'rekonnas', selectedCommodityFilter);
      } else if (type === 'rekonnas') {
        setActiveTab('rekonda26');
        setSource2026('rekonnas');
        setFileName('IKK_REKONDA_responden_2026.csv (Rekonnas Final)');
        const res = await fetch('/assets/aistudio/IKK_REKONDA_responden_2026_3d99b638.csv');
        const text = await res.text();
        const rows = await parseFileToRows(text);
        runParser(rows, 'rekonda26', 'rekonnas', selectedCommodityFilter);
      } else if (type === 'webentry') {
        setActiveTab('rekonda26');
        setSource2026('webentry');
        setFileName('database_IKK_2026_webentry.csv (Webentry Lengkap)');
        const res = await fetch('/assets/aistudio/database_IKK_2026_webentry.csv');
        const text = await res.text();
        const rows = await parseFileToRows(text);
        runParser(rows, 'rekonda26', 'webentry', selectedCommodityFilter);
      } else if (type === 'auto_merge') {
        // Dual Merge Rule: Rekonnas where present, Webentry fallback
        setActiveTab('rekonda26');
        setSource2026('auto_merge');
        setFileName('Sinkronisasi Gabungan: Rekonnas + Fallback Webentry');
        const [resRekon, resWeb] = await Promise.all([
          fetch('/assets/aistudio/IKK_REKONDA_responden_2026_3d99b638.csv'),
          fetch('/assets/aistudio/database_IKK_2026_webentry.csv')
        ]);
        const textRekon = await resRekon.text();
        const textWeb = await resWeb.text();
        const rowsRekon = await parseFileToRows(textRekon);
        const rowsWeb = await parseFileToRows(textWeb);

        const mergedResult = processDual2026Merge(
          rowsRekon,
          rowsWeb,
          currentData,
          selectedKomoditas.kode
        );
        setParseResult(mergedResult);
        setSuccessInfo(`Sinkronisasi Ganda Berhasil: Menggunakan Rekonnas final untuk kualitas yang tersedia dan Webentry untuk kualitas pelengkap.`);
      }
    } catch (err: any) {
      setParseError(`Gagal memuat data: ${err.message}`);
      setParseResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit & Apply
  const handleProcessUpload = () => {
    if (!currentUser.isOwner && !onQuickLoginAsOwner) {
      alert('Akses ditolak: Hanya Admin Provinsi yang dapat memperbarui data master.');
      return;
    }
    if (!parseResult || parseResult.updatedList.length === 0) {
      setParseError('Silakan pilih berkas atau data yang valid terlebih dahulu.');
      return;
    }

    onApplyData(parseResult.updatedList, activeTab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Upload & Template Rekonda Lintas Tahun
                </h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  IKK 2026/2027
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sinkronisasi data tahun berjalan (Harga 2027) dan tahun sebelumnya (Harga 2026)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Notice */}
        {!currentUser.isOwner && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex items-center justify-between gap-2 text-xs text-amber-900 shrink-0">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Mode Terbatas: Anda dapat melihat pratinjau. Masuk sebagai Admin Provinsi untuk menyimpan permanen.</span>
            </div>
            {onQuickLoginAsOwner ? (
              <button
                type="button"
                onClick={onQuickLoginAsOwner}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-md shadow-2xs whitespace-nowrap cursor-pointer"
              >
                Masuk sebagai Admin Provinsi
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-md shadow-2xs whitespace-nowrap cursor-pointer"
              >
                Masuk
              </button>
            )}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Main 2-Tab Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            {/* Tab 1: Database Tabel 7.1 (Tahun Berjalan -> Harga 2027) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('tabel71');
                setFileName('');
                setParseResult(null);
                setParseError('');
                setSuccessInfo('');
              }}
              className={`p-3 rounded-lg text-left transition-all cursor-pointer ${
                activeTab === 'tabel71'
                  ? 'bg-white shadow-sm border border-slate-200'
                  : 'hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  1. Template Database Tabel 7.1
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Harga 2027
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Data <strong>Tahun Berjalan</strong> (TW III & IV 2026, TW I & II 2027 dimasukkan ke kolom <strong>Harga 2027</strong>).
              </p>
            </button>

            {/* Tab 2: Data Tahun Sebelumnya -> Harga 2026 */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('rekonda26');
                setFileName('');
                setParseResult(null);
                setParseError('');
                setSuccessInfo('');
              }}
              className={`p-3 rounded-lg text-left transition-all cursor-pointer ${
                activeTab === 'rekonda26'
                  ? 'bg-white shadow-sm border border-slate-200'
                  : 'hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                  2. Template Harga Tahun Sebelumnya
                </span>
                <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                  Harga 2026
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Data <strong>Tahun Sebelumnya</strong> (Rekonnas Responden & Webentry dimasukkan ke kolom <strong>Harga 2026</strong>).
              </p>
            </button>
          </div>

          {/* Sub-selector for 2026 Sources */}
          {activeTab === 'rekonda26' && (
            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-600" />
                  Pilih Format Template Data 2026:
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {source2026 === 'auto_merge'
                    ? 'Gabungan Rekonnas + Webentry'
                    : source2026 === 'rekonnas'
                    ? 'IKK Rekonda Responden (Final)'
                    : 'Database Webentry (Lengkap)'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSource2026('auto_merge')}
                  className={`p-2 rounded-lg text-left text-xs transition-colors cursor-pointer border ${
                    source2026 === 'auto_merge'
                      ? 'bg-white border-sky-500 text-sky-900 font-bold shadow-2xs'
                      : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Otomatis Gabung</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Rekonnas untuk kode ada, Webentry untuk kode belum ada
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSource2026('rekonnas')}
                  className={`p-2 rounded-lg text-left text-xs transition-colors cursor-pointer border ${
                    source2026 === 'rekonnas'
                      ? 'bg-white border-sky-500 text-sky-900 font-bold shadow-2xs'
                      : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>IKK Rekonda Responden</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Format mikrodata responden hasil Rekonnas final
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSource2026('webentry')}
                  className={`p-2 rounded-lg text-left text-xs transition-colors cursor-pointer border ${
                    source2026 === 'webentry'
                      ? 'bg-white border-sky-500 text-sky-900 font-bold shadow-2xs'
                      : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Database Webentry</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Format tarikan Webentry dengan kode kualitas lengkap
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Clean Template Download Strip */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {activeTab === 'tabel71'
                    ? 'Template Database Tabel 7.1'
                    : source2026 === 'webentry'
                    ? 'Template Database IKK 2026 Webentry'
                    : 'Template IKK Rekonda Responden 2026'}
                </span>
                <span className="text-[11px] text-slate-600 font-medium">
                  (Komoditas: {selectedKomoditas.nama})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'tabel71') {
                    downloadTemplateTabel71(currentData, selectedKomoditas, 'xlsx');
                  } else if (source2026 === 'webentry') {
                    downloadTemplateIKKWebentry(currentData, selectedKomoditas, 'xlsx');
                  } else {
                    downloadTemplateIKKResponden(currentData, selectedKomoditas, 'xlsx');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unduh Template (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'tabel71') {
                    downloadTemplateTabel71(currentData, selectedKomoditas, 'csv');
                  } else if (source2026 === 'webentry') {
                    downloadTemplateIKKWebentry(currentData, selectedKomoditas, 'csv');
                  } else {
                    downloadTemplateIKKResponden(currentData, selectedKomoditas, 'csv');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>Unduh Template (.csv)</span>
              </button>
            </div>
          </div>

          {/* Quick Load Official Files Strip */}
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700">
              Data Resmi Tersedia di Sistem:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {activeTab === 'tabel71' ? (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleLoadSample('tabel71')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>Muat Database Tabel 7.1 (Tahun Berjalan)</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleLoadSample('auto_merge')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-sky-900 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-md shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sinkron Gabungan (Rekonnas + Webentry)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleLoadSample('rekonnas')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span>IKK Rekonda Responden</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleLoadSample('webentry')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span>IKK Webentry</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Input Method Switcher */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
            <button
              type="button"
              onClick={() => setInputMethod('upload')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                inputMethod === 'upload'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload Berkas (.xlsx, .csv)</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMethod('paste')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                inputMethod === 'paste'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Tempel Teks (Paste dari Excel)</span>
            </button>
          </div>

          {/* Mode 1: File Upload */}
          {inputMethod === 'upload' ? (
            <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-5 text-center bg-slate-50/50 transition-colors">
              <input
                id="file-upload-input"
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="file-upload-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {fileName ? (
                    <span className="text-emerald-700">{fileName}</span>
                  ) : (
                    <span>Pilih berkas Excel (.xlsx, .xls) atau CSV (.csv) dari perangkat Anda</span>
                  )}
                </div>
              </label>
            </div>
          ) : (
            /* Mode 2: Direct Paste */
            <div className="space-y-2">
              <textarea
                rows={4}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Salin baris tabel dari Excel lalu tempel (Ctrl+V) di sini..."
                className="w-full font-mono text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50 text-slate-800"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!pastedText.trim() || isProcessing}
                  onClick={handleProcessPastedText}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-md shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>Proses Teks Ditempel</span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback Notices */}
          {parseError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Peringatan:</span>
                <p>{parseError}</p>
              </div>
            </div>
          )}

          {successInfo && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* SINGLE Preview Comparison Table (No duplicate table!) */}
          {parseResult && parseResult.comparison.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Pratinjau Hasil Perubahan: Kolom {activeTab === 'tabel71' ? 'Harga 2027 (Tahun Berjalan)' : 'Harga 2026 (Tahun Lalu)'}
                  </span>
                </h5>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  {parseResult.affectedKabCount} Kabupaten/Kota Terdampak
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2">Kode</th>
                      <th className="p-2">Kabupaten / Kota</th>
                      <th className="p-2 text-right">
                        {activeTab === 'tabel71' ? 'Harga 2027 Lama' : 'Harga 2026 Lama'}
                      </th>
                      <th className="p-2 text-right bg-emerald-50 text-emerald-900">
                        {activeTab === 'tabel71' ? 'Harga 2027 Baru' : 'Harga 2026 Baru'}
                      </th>
                      <th className="p-2 text-right">Selisih</th>
                      <th className="p-2 text-right">Rasio Baru</th>
                      <th className="p-2">Rincian Triwulan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {parseResult.comparison.map((item) => (
                      <tr key={item.kode} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-600">{item.kode}</td>
                        <td className="p-2 font-sans font-semibold text-slate-900">{item.nama}</td>
                        <td className="p-2 text-right text-slate-500">
                          Rp {formatRupiahNumber(item.oldValue)}
                        </td>
                        <td className="p-2 text-right font-bold text-emerald-700 bg-emerald-50/50">
                          Rp {formatRupiahNumber(item.newValue)}
                        </td>
                        <td className="p-2 text-right">
                          <span
                            className={
                              item.diff > 0
                                ? 'text-rose-600 font-bold'
                                : item.diff < 0
                                ? 'text-sky-600 font-bold'
                                : 'text-slate-400'
                            }
                          >
                            {item.diff > 0 ? '+' : ''}
                            {formatRupiahNumber(item.diff)} ({item.percentDiff > 0 ? '+' : ''}
                            {formatPercent(item.percentDiff)}%)
                          </span>
                        </td>
                        <td className="p-2 text-right font-bold text-slate-800">
                          {formatPercent(item.newRasio)}%
                        </td>
                        <td className="p-2 font-sans text-[10px] text-slate-500 truncate max-w-[220px]" title={item.quartersDetail}>
                          {item.quartersDetail}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Target Kolom: <strong>{activeTab === 'tabel71' ? 'Harga 2027 (Tahun Berjalan)' : 'Harga 2026 (Basis IKK)'}</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Tutup / Batal
            </button>
            <button
              type="button"
              disabled={!parseResult || parseResult.affectedKabCount === 0 || isProcessing}
              onClick={handleProcessUpload}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>
                {activeTab === 'tabel71'
                  ? 'Terapkan ke Kolom Harga 2027'
                  : 'Terapkan ke Kolom Harga 2026'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
