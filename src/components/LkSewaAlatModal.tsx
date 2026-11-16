import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Lock,
  Sparkles,
  ArrowRight,
  Info,
  SkipForward
} from 'lucide-react';
import {
  KabupatenRekon,
  Komoditas,
  LkSewaAlatData,
  RespondenData,
  TipeSewaAlat,
  UserAuth,
  Provinsi
} from '../types/rekonda';
import {
  EquipmentSpec,
  KOEF_BBM_GENSET_SWASTA,
  calculateAlatBeratMurni,
  calculateGensetMurni,
  getEquipmentSpec,
  getSewaAlatKabStatus,
  isSewaAlatKomoditas
} from '../utils/sewaAlatCalculator';
import { formatPercent, formatRupiahCurrency, formatRupiahNumber } from '../utils/formatters';

interface LkSewaAlatModalProps {
  isOpen: boolean;
  onClose: () => void;
  provinsi: Provinsi;
  komoditasList: Komoditas[];
  database: Record<string, KabupatenRekon[]>;
  initialKomoditasKode: string;
  initialKabupatenKode: string;
  initialRespondentId?: string | null;
  currentUser: UserAuth;
  onOpenAuth: () => void;
  onApplyLkResult: (
    dbKey: string,
    kabupatenKode: string,
    respondentId: string | null,
    lkData: LkSewaAlatData,
    appendCatatan: boolean,
    markRekonSelesai: boolean
  ) => void;
  onChangeTipeSewa: (
    dbKey: string,
    kabupatenKode: string,
    respondentId: string | null,
    tipeSewa: TipeSewaAlat
  ) => void;
}

const buildDefaultLkForm = (
  existingLk: LkSewaAlatData | undefined,
  baseHarga: number,
  spec: EquipmentSpec
): LkSewaAlatData => {
  const hargaAwal =
    existingLk?.hargaAwalSebelumLk && existingLk.hargaAwalSebelumLk > 0
      ? existingLk.hargaAwalSebelumLk
      : baseHarga || 0;

  if (existingLk) {
    return {
      ...existingLk,
      hpLapangan: existingLk.hpLapangan || spec.hpStandarPu,
      biayaAllInBulan: existingLk.biayaAllInBulan ?? hargaAwal,
      adjustPajakProfitPct: existingLk.adjustPajakProfitPct ?? 10,
      biayaMobilisasi: existingLk.biayaMobilisasi ?? 0,
      hargaSolar: existingLk.hargaSolar ?? 0,
      hargaPelumas: existingLk.hargaPelumas ?? 0,
      biayaOperatorHari: existingLk.biayaOperatorHari ?? 0,
      includeWorkshop: existingLk.includeWorkshop ?? false,
      kapasitasKva: existingLk.kapasitasKva ?? spec.defaultKva ?? 60,
      tarifAllInGenset: existingLk.tarifAllInGenset ?? hargaAwal,
      jamPerHari: existingLk.jamPerHari ?? 10,
      hariPerBulan: existingLk.hariPerBulan ?? 25,
      pembantuOperatorHari: existingLk.pembantuOperatorHari ?? 0,
      hargaAwalSebelumLk: hargaAwal
    };
  }

  return {
    mode: 'alat_berat',
    hpLapangan: spec.hpStandarPu,
    biayaAllInBulan: hargaAwal,
    adjustPajakProfitPct: 10,
    biayaMobilisasi: 0,
    hargaSolar: 0,
    hargaPelumas: 0,
    biayaOperatorHari: 0,
    includeWorkshop: false,
    kapasitasKva: spec.defaultKva ?? 60,
    tarifAllInGenset: hargaAwal,
    jamPerHari: 10,
    hariPerBulan: 25,
    pembantuOperatorHari: 0,
    hargaAwalSebelumLk: hargaAwal,
    hasilSewaMurniJam: 0,
    hasilSewaMurniBulan: 0
  };
};

const pickDefaultRespondentId = (respondents: RespondenData[]): string | null => {
  if (!respondents || respondents.length === 0) return null;
  const waitingLk = respondents.find(
    (r) => r.tipeSewa === 'all_in' && !(r.lkSewaAlat && r.lkSewaAlat.hasilSewaMurniBulan > 0)
  );
  if (waitingLk) return waitingLk.id;
  const anyAllIn = respondents.find((r) => r.tipeSewa === 'all_in');
  if (anyAllIn) return anyAllIn.id;
  return respondents[0].id;
};

export const LkSewaAlatModal: React.FC<LkSewaAlatModalProps> = ({
  isOpen,
  onClose,
  provinsi,
  komoditasList,
  database,
  initialKomoditasKode,
  initialKabupatenKode,
  initialRespondentId,
  currentUser,
  onOpenAuth,
  onApplyLkResult,
  onChangeTipeSewa
}) => {
  const sewaKomoditasList = useMemo(
    () => komoditasList.filter((k) => isSewaAlatKomoditas(k.kode)),
    [komoditasList]
  );

  const isPemilik = currentUser.role === 'pemilik' || currentUser.isOwner;

  const [selectedKomKode, setSelectedKomKode] = useState<string>(
    initialKomoditasKode && isSewaAlatKomoditas(initialKomoditasKode)
      ? initialKomoditasKode
      : sewaKomoditasList[0]?.kode || '5101'
  );

  const [selectedKabKode, setSelectedKabKode] = useState<string>(initialKabupatenKode || '6101');
  const [selectedRespId, setSelectedRespId] = useState<string | null>(initialRespondentId || null);

  useEffect(() => {
    if (!isOpen) return;
    if (initialKomoditasKode && isSewaAlatKomoditas(initialKomoditasKode)) {
      setSelectedKomKode(initialKomoditasKode);
    } else if (sewaKomoditasList.length > 0 && !isSewaAlatKomoditas(selectedKomKode)) {
      setSelectedKomKode(sewaKomoditasList[0].kode);
    }
    if (initialKabupatenKode) {
      setSelectedKabKode(initialKabupatenKode);
    }
    setSelectedRespId(initialRespondentId || null);
  }, [
    isOpen,
    initialKomoditasKode,
    initialKabupatenKode,
    initialRespondentId,
    sewaKomoditasList,
    selectedKomKode
  ]);

  const dbKey = `${provinsi.kode}_${selectedKomKode}`;
  const currentKomoditas = useMemo(
    () => sewaKomoditasList.find((k) => k.kode === selectedKomKode) || sewaKomoditasList[0],
    [sewaKomoditasList, selectedKomKode]
  );

  const kabList = useMemo(() => database[dbKey] || [], [database, dbKey]);
  const currentKab = useMemo(
    () => kabList.find((k) => k.kode === selectedKabKode) || kabList[0],
    [kabList, selectedKabKode]
  );

  const respondents = useMemo(() => currentKab?.respondents || [], [currentKab]);

  // Ensure valid respondent selection when switching Kab/Kota or Komoditas
  useEffect(() => {
    if (!isOpen) return;
    if (respondents.length === 0) {
      setSelectedRespId(null);
      return;
    }
    const stillExists = respondents.some((r) => r.id === selectedRespId);
    if (!stillExists) {
      setSelectedRespId(pickDefaultRespondentId(respondents));
    }
  }, [isOpen, respondents, selectedRespId]);

  const currentResp = useMemo(
    () => respondents.find((r) => r.id === selectedRespId) || null,
    [respondents, selectedRespId]
  );

  const kabSewaStatus = useMemo(
    () => (currentKab ? getSewaAlatKabStatus(currentKab) : null),
    [currentKab]
  );

  const spec = useMemo(() => getEquipmentSpec(selectedKomKode), [selectedKomKode]);

  const [form, setForm] = useState<LkSewaAlatData>(() =>
    buildDefaultLkForm(
      currentResp?.lkSewaAlat || currentKab?.lkSewaAlat,
      currentResp ? currentResp.harga : currentKab?.harga2027 || 0,
      spec
    )
  );
  const [appendCatatan, setAppendCatatan] = useState<boolean>(true);
  const [markRekonSelesai, setMarkRekonSelesai] = useState<boolean>(false);

  // Reload form when target (komoditas, kab, respondent) changes
  useEffect(() => {
    if (!isOpen) return;
    if (currentResp) {
      setForm(buildDefaultLkForm(currentResp.lkSewaAlat, currentResp.harga, spec));
    } else {
      setForm(buildDefaultLkForm(currentKab?.lkSewaAlat, currentKab?.harga2027 || 0, spec));
    }
  }, [isOpen, selectedKomKode, selectedKabKode, selectedRespId, currentResp, currentKab, spec]);

  const canEdit = currentUser.isLoggedIn && isPemilik;

  // Live calculations
  const alatBeratResult = useMemo(() => calculateAlatBeratMurni(form, spec), [form, spec]);

  const gensetResult = useMemo(() => {
    const mode = form.mode === 'genset_harian' ? 'genset_harian' : 'genset_bulanan';
    return calculateGensetMurni({
      mode,
      kapasitasKva: form.kapasitasKva || spec.defaultKva || 60,
      tarifAllIn: form.tarifAllInGenset || 0,
      adjustPajakProfitPct: form.adjustPajakProfitPct || 0,
      jamPerHari: form.jamPerHari || 10,
      hariPerBulan: form.hariPerBulan || 25,
      hargaSolar: form.hargaSolar || 0,
      biayaOperatorHari: form.biayaOperatorHari || 0,
      pembantuOperatorHari: form.pembantuOperatorHari || 0
    });
  }, [form, spec]);

  const isGensetSwastaMode = Boolean(spec.isGenset) && form.mode !== 'alat_berat';

  const finalSewaMurniBulan = isGensetSwastaMode
    ? gensetResult.tarifMurniBulanan
    : alatBeratResult.finalSewaMurniBulan;
  const finalSewaMurniJam = isGensetSwastaMode
    ? gensetResult.tarifMurniJam
    : alatBeratResult.finalSewaMurniJam;

  const harga2026 = currentKab?.harga2026 || 0;
  const hargaSurveiAllIn =
    form.hargaAwalSebelumLk && form.hargaAwalSebelumLk > 0
      ? form.hargaAwalSebelumLk
      : currentResp
      ? currentResp.harga
      : currentKab?.harga2027 || 0;

  const oldRasio = harga2026 > 0 ? parseFloat(((hargaSurveiAllIn / harga2026) * 100).toFixed(2)) : 0;
  const newRasio =
    harga2026 > 0 && finalSewaMurniBulan > 0
      ? parseFloat(((finalSewaMurniBulan / harga2026) * 100).toFixed(2))
      : 0;
  const isNewRasioAnomaly =
    harga2026 > 0 && finalSewaMurniBulan > 0 && (newRasio < 80 || newRasio > 120);
  const isNegativeResult = finalSewaMurniBulan <= 0;

  // Remaining waiting All-In respondents in this Kab/Kota (other than currently selected)
  const nextWaitingResp = useMemo(() => {
    return respondents.find(
      (r) =>
        r.id !== selectedRespId &&
        r.tipeSewa === 'all_in' &&
        !(r.lkSewaAlat && r.lkSewaAlat.hasilSewaMurniBulan > 0)
    );
  }, [respondents, selectedRespId]);

  const handleNumberChange = (field: keyof LkSewaAlatData, raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, '');
    const parsed = cleaned === '' ? 0 : parseFloat(cleaned);
    setForm((prev) => ({
      ...prev,
      [field]: Number.isFinite(parsed) ? parsed : 0
    }));
  };

  const handleFillCsvReference = () => {
    setForm((prev) => ({
      ...prev,
      hargaSolar: isGensetSwastaMode ? 6800 : 12000,
      hargaPelumas: 33874,
      biayaOperatorHari: prev.mode === 'genset_harian' ? 195000 : 185000
    }));
  };

  const submitApply = (advanceToNext: boolean) => {
    if (!currentUser.isLoggedIn) {
      onOpenAuth();
      return;
    }
    if (!canEdit || !currentKab) return;

    const payload: LkSewaAlatData = {
      ...form,
      hargaAwalSebelumLk:
        form.hargaAwalSebelumLk && form.hargaAwalSebelumLk > 0
          ? form.hargaAwalSebelumLk
          : currentResp
          ? currentResp.harga
          : currentKab.harga2027,
      hasilSewaMurniJam: Math.max(0, Math.round(finalSewaMurniJam)),
      hasilSewaMurniBulan: Math.max(0, Math.round(finalSewaMurniBulan)),
      updatedAt: new Date().toISOString()
    };

    onApplyLkResult(
      dbKey,
      currentKab.kode,
      currentResp ? currentResp.id : null,
      payload,
      appendCatatan,
      markRekonSelesai
    );

    if (advanceToNext && nextWaitingResp) {
      setSelectedRespId(nextWaitingResp.id);
    } else {
      onClose();
    }
  };

  const handleConfirmSewaMurniOnly = () => {
    if (!currentUser.isLoggedIn) {
      onOpenAuth();
      return;
    }
    if (!canEdit || !currentKab) return;
    onChangeTipeSewa(dbKey, currentKab.kode, currentResp ? currentResp.id : null, 'sewa_murni');
    if (nextWaitingResp) {
      setSelectedRespId(nextWaitingResp.id);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  if (!isPemilik) {
    return (
      <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">Akses Khusus Admin Provinsi</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            LK Penghitungan Sewa Alat hanya dapat diakses dan dihitung oleh Admin Provinsi. Admin Kab/Kota cukup mengonfirmasi status{' '}
            <strong>Sewa Murni</strong> atau <strong>All-In</strong> per responden di Detail Rekonda.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-start justify-center p-2 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-4 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
              <Calculator className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                  LK Penghitungan Sewa Alat Murni per Responden
                </h2>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                  PERMENPUPR No. 01/2022
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Hitung biaya Sewa Murni tiap responden All-In &rarr; otomatis terupdate di Detail Responden &amp; Tabel Rekon Utama setelah semua responden siap
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Tutup Modal LK"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selector Bar: Komoditas (5101-5803), Kab/Kota & Responden */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          <div className="md:col-span-4">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Jenis Alat Berat / Genset (5101–5803)
            </label>
            <select
              value={selectedKomKode}
              onChange={(e) => {
                setSelectedKomKode(e.target.value);
                setSelectedRespId(null);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              {sewaKomoditasList.map((k) => (
                <option key={k.kode} value={k.kode}>
                  [{k.kode}] {k.nama} ({k.satuan})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Kabupaten / Kota
            </label>
            <select
              value={selectedKabKode}
              onChange={(e) => {
                setSelectedKabKode(e.target.value);
                setSelectedRespId(null);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              {kabList.map((k) => {
                const st = getSewaAlatKabStatus(k);
                const statusBadge =
                  st.waitingLkCount > 0
                    ? `• ${st.waitingLkCount} Menunggu LK`
                    : st.allPure
                    ? `• Murni (${st.pureCount}/${st.total || 1})`
                    : `• Konf (${st.pureCount}/${st.total || 1})`;
                return (
                  <option key={k.kode} value={k.kode}>
                    [{k.kode}] {k.nama} {statusBadge}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="md:col-span-5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Responden Survei dalam Kab/Kota ({respondents.length} Responden)
            </label>
            {respondents.length > 0 ? (
              <select
                value={selectedRespId || ''}
                onChange={(e) => setSelectedRespId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
              >
                {respondents.map((r) => {
                  const tag =
                    r.tipeSewa === 'all_in'
                      ? r.lkSewaAlat && r.lkSewaAlat.hasilSewaMurniBulan > 0
                        ? '✓ LK Murni'
                        : '⏳ All-In (Menunggu LK)'
                      : r.tipeSewa === 'sewa_murni'
                      ? '✓ Sewa Murni'
                      : '? Belum Konf.';
                  return (
                    <option key={r.id} value={r.id}>
                      [{r.tahun} TW{r.triwulan}] {r.nama} — Rp {formatRupiahNumber(r.harga)} [{tag}]
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="w-full bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500">
                Tidak ada detail responden (Hitung tingkat Kab/Kota)
              </div>
            )}
          </div>
        </div>

        {/* Main Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Instruction & Quick Reference */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs">
            <div className="flex items-start gap-2 text-amber-950">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Petunjuk Entry LK:</span> Kolom berwarna{' '}
                <span className="inline-block px-1.5 py-0.2 bg-amber-200 border border-amber-400 rounded font-bold text-amber-950">
                  Kuning (Entry Data)
                </span>{' '}
                diisi sesuai survei responden terpilih. Setelah seluruh responden di{' '}
                <strong>{currentKab?.nama}</strong> berstatus Sewa Murni/LK, rata-rata Tabel Rekon Daerah utama otomatis dihitung.
              </div>
            </div>

            <button
              type="button"
              onClick={handleFillCsvReference}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg font-bold text-[11px] transition-colors cursor-pointer shrink-0"
              title="Isi Harga Solar & Minyak Pelumas sesuai contoh acuan pada sheet LK CSV"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Isi Acuan Solar &amp; Pelumas LK</span>
            </button>
          </div>

          {/* Genset Mode Switcher */}
          {spec.isGenset && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-700">
                Metode Penghitungan Genset ({currentKomoditas?.kode}):
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'alat_berat', label: 'Standar PU (HP & Pelumas)' },
                  { id: 'genset_bulanan', label: 'Swasta Bulanan (KVA · 200 Jam)' },
                  { id: 'genset_harian', label: 'Swasta Harian (KVA · 10 Jam/Hari)' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        mode: m.id as LkSewaAlatData['mode'],
                        tarifAllInGenset:
                          m.id === 'genset_harian' && (prev.tarifAllInGenset || 0) > 10000000
                            ? Math.round((prev.tarifAllInGenset || 0) / 25)
                            : m.id === 'genset_bulanan'
                            ? prev.biayaAllInBulan || prev.tarifAllInGenset || 0
                            : prev.tarifAllInGenset
                      }))
                    }
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] border transition-colors cursor-pointer ${
                      form.mode === m.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* LEFT: Interactive LK Worksheet */}
            <div className="lg:col-span-7 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-800 text-white px-3.5 py-2 flex items-center justify-between text-xs gap-2">
                <span className="font-bold truncate">
                  {currentResp
                    ? `LK Responden: ${currentResp.nama} (${currentResp.tahun} TW${currentResp.triwulan})`
                    : isGensetSwastaMode
                    ? form.mode === 'genset_harian'
                      ? 'LK GENSET SEWA HARIAN (SWASTA)'
                      : 'LK GENSET SEWA BULANAN (SWASTA)'
                    : `LK ALAT BERAT: ${spec.labelPu}`}
                </span>
                <span className="text-[10px] font-mono text-amber-300 shrink-0">
                  HP PU: {spec.hpStandarPu} · Rasio WS: {spec.rasioWorkshopLabel}
                </span>
              </div>

              {!isGensetSwastaMode ? (
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-2 w-8 text-center">No</th>
                      <th className="py-1.5 px-2.5 text-left">Komponen Biaya</th>
                      <th className="py-1.5 px-2.5 text-right w-48">Nilai / Input</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-slate-50/70 text-slate-500 text-[11px]">
                      <td className="py-1.5 px-2 text-center font-mono">-</td>
                      <td className="py-1.5 px-2.5">Tenaga Alat (HP) standar PU</td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold">
                        {spec.hpStandarPu} HP
                      </td>
                    </tr>

                    {/* 1. HP Lapangan */}
                    <tr className="bg-amber-50/90">
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-amber-900">1</td>
                      <td className="py-1.5 px-2.5 font-semibold text-amber-950">
                        Tenaga Alat (HP) sesuai kondisi lapangan
                      </td>
                      <td className="py-1 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={form.hpLapangan || ''}
                            onChange={(e) => handleNumberChange('hpLapangan', e.target.value)}
                            className="w-28 bg-amber-100 border border-amber-400 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <span className="text-[10px] font-bold text-amber-800 w-7 text-left">HP</span>
                        </div>
                      </td>
                    </tr>

                    {/* 2. Biaya Sewa All In */}
                    <tr className="bg-amber-50/90">
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-amber-900">2</td>
                      <td className="py-1.5 px-2.5 font-semibold text-amber-950">
                        Biaya sewa All-In (per bulan / 200 jam)
                      </td>
                      <td className="py-1 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[10px] font-bold text-amber-800">Rp</span>
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            value={form.biayaAllInBulan || ''}
                            onChange={(e) => handleNumberChange('biayaAllInBulan', e.target.value)}
                            className="w-36 bg-amber-100 border border-amber-400 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* 3. Adjust Tanpa Pajak */}
                    <tr className="bg-sky-50/50">
                      <td className="py-2 px-2 text-center font-mono font-bold text-sky-900 align-top">3</td>
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-slate-800">
                          Biaya tanpa pajak, profit &amp; overhead cost
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          <span className="text-[10px] text-slate-500 font-semibold mr-0.5">Adjust %:</span>
                          {[0, 10, 11, 12, 15].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() =>
                                setForm((prev) => ({ ...prev, adjustPajakProfitPct: pct }))
                              }
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                                form.adjustPajakProfitPct === pct
                                  ? 'bg-sky-600 text-white border-sky-600'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-sky-50'
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                          <div className="inline-flex items-center gap-0.5 ml-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="50"
                              value={form.adjustPajakProfitPct}
                              onChange={(e) =>
                                handleNumberChange('adjustPajakProfitPct', e.target.value)
                              }
                              className="w-14 bg-amber-100 border border-amber-400 rounded px-1.5 py-0.5 text-right font-mono font-bold text-[11px] text-slate-900"
                            />
                            <span className="text-[10px] font-bold text-slate-600">%</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Rumus: Rincian 2 ÷ (1 + {form.adjustPajakProfitPct}%) = ÷{' '}
                          {(1 + (form.adjustPajakProfitPct || 0) / 100).toFixed(2)}
                        </div>
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 align-top">
                        {formatRupiahCurrency(alatBeratResult.biayaTanpaPajak)}
                      </td>
                    </tr>

                    {/* 4. Mobilisasi */}
                    <tr className="bg-amber-50/40">
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600">4</td>
                      <td className="py-1.5 px-2.5 text-slate-700">Biaya mobilisasi alat (jika termasuk)</td>
                      <td className="py-1 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[10px] text-slate-500">Rp</span>
                          <input
                            type="number"
                            step="100000"
                            min="0"
                            value={form.biayaMobilisasi || ''}
                            placeholder="0"
                            onChange={(e) => handleNumberChange('biayaMobilisasi', e.target.value)}
                            className="w-32 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* 5 & 6 */}
                    <tr>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-500">5</td>
                      <td className="py-1.5 px-2.5 text-slate-700">
                        Biaya sewa All-In tanpa mobilisasi (per bulan / 200 jam)
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-slate-800">
                        {formatRupiahCurrency(alatBeratResult.biayaAllInTanpaMobBulan)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/60">
                      <td className="py-1.5 px-2 text-center font-mono text-slate-500">6</td>
                      <td className="py-1.5 px-2.5 text-slate-700">
                        Biaya sewa All-In tanpa mobilisasi (per jam)
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                        {formatRupiahCurrency(alatBeratResult.biayaAllInTanpaMobJam)}
                      </td>
                    </tr>

                    {/* 7 - 10: BBM */}
                    <tr>
                      <td className="py-1 px-2 text-center font-mono text-slate-500">7</td>
                      <td className="py-1 px-2.5 text-slate-600">Koefisien bahan bakar</td>
                      <td className="py-1 px-2.5 text-right font-mono text-slate-700">
                        {spec.koefBbm.toFixed(3)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 text-center font-mono text-slate-500">8</td>
                      <td className="py-1 px-2.5 text-slate-600">
                        Jumlah bahan bakar alat per jam (liter)
                      </td>
                      <td className="py-1 px-2.5 text-right font-mono text-slate-700">
                        {alatBeratResult.jumlahBbmJam.toFixed(2)} L/jam
                      </td>
                    </tr>
                    <tr className="bg-amber-50/90">
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-amber-900">9</td>
                      <td className="py-1.5 px-2.5 font-semibold text-amber-950">Harga solar (per liter)</td>
                      <td className="py-1 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[10px] font-bold text-amber-800">Rp</span>
                          <input
                            type="number"
                            step="100"
                            min="0"
                            value={form.hargaSolar || ''}
                            placeholder="12000"
                            onChange={(e) => handleNumberChange('hargaSolar', e.target.value)}
                            className="w-28 bg-amber-100 border border-amber-400 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-500">10</td>
                      <td className="py-1.5 px-2.5 text-slate-700">Biaya bahan bakar (per jam)</td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-rose-700">
                        - {formatRupiahCurrency(alatBeratResult.biayaBbmJam)}
                      </td>
                    </tr>

                    {/* 11 - 14: Pelumas */}
                    <tr>
                      <td className="py-1 px-2 text-center font-mono text-slate-500">11</td>
                      <td className="py-1 px-2.5 text-slate-600">Koefisien minyak pelumas</td>
                      <td className="py-1 px-2.5 text-right font-mono text-slate-700">
                        {spec.koefPelumas.toFixed(4)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 text-center font-mono text-slate-500">12</td>
                      <td className="py-1 px-2.5 text-slate-600">
                        Jumlah minyak pelumas per jam (liter)
                      </td>
                      <td className="py-1 px-2.5 text-right font-mono text-slate-700">
                        {alatBeratResult.jumlahPelumasJam.toFixed(3)} L/jam
                      </td>
                    </tr>
                    <tr className="bg-amber-50/90">
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-amber-900">13</td>
                      <td className="py-1.5 px-2.5 font-semibold text-amber-950">
                        Harga minyak pelumas (per liter)
                      </td>
                      <td className="py-1 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[10px] font-bold text-amber-800">Rp</span>
                          <input
                            type="number"
                            step="100"
                            min="0"
                            value={form.hargaPelumas || ''}
                            placeholder="33874"
                            onChange={(e) => handleNumberChange('hargaPelumas', e.target.value)}
                            className="w-28 bg-amber-100 border border-amber-400 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-500">14</td>
                      <td className="py-1.5 px-2.5 text-slate-700">Biaya minyak pelumas (per jam)</td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-rose-700">
                        - {formatRupiahCurrency(alatBeratResult.biayaPelumasJam)}
                      </td>
                    </tr>

                    {/* 15 - 16: Operator */}
                    <tr className="bg-amber-50/90">
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-amber-900">15</td>
                      <td className="py-1.5 px-2.5 font-semibold text-amber-950">
                        Biaya operator dan pembantu per hari (8 jam/hari)
                      </td>
                      <td className="py-1 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[10px] font-bold text-amber-800">Rp</span>
                          <input
                            type="number"
                            step="5000"
                            min="0"
                            value={form.biayaOperatorHari || ''}
                            placeholder="185000"
                            onChange={(e) => handleNumberChange('biayaOperatorHari', e.target.value)}
                            className="w-28 bg-amber-100 border border-amber-400 rounded px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-500">16</td>
                      <td className="py-1.5 px-2.5 text-slate-700">Biaya operator per jam (÷ 8 jam)</td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-rose-700">
                        - {formatRupiahCurrency(alatBeratResult.biayaOperatorJam)}
                      </td>
                    </tr>

                    {/* 17 - 18a */}
                    <tr className={!form.includeWorkshop ? 'bg-emerald-50/70' : ''}>
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-700">17</td>
                      <td className="py-1.5 px-2.5 font-semibold text-slate-800">
                        Biaya sewa alat murni (per jam)
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                        {formatRupiahCurrency(alatBeratResult.sewaMurniJamA)}
                      </td>
                    </tr>
                    <tr className={!form.includeWorkshop ? 'bg-emerald-100/70' : 'bg-slate-50'}>
                      <td className="py-2 px-2 text-center font-mono font-bold text-emerald-900">18.a</td>
                      <td className="py-2 px-2.5 font-bold text-emerald-950">
                        Biaya sewa alat murni (per bulan / 200 jam)
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-extrabold text-emerald-800">
                        {formatRupiahCurrency(alatBeratResult.sewaMurniBulanA)}
                      </td>
                    </tr>

                    {/* 19 - 20b Workshop */}
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-600">19</td>
                      <td className="py-2 px-2.5">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.includeWorkshop}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, includeWorkshop: e.target.checked }))
                            }
                            className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-slate-800">
                              All-In termasuk Workshop &amp; Perbaikan/Perawatan
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Jika dicentang, rincian 18.a dibagi rasio workshop PU ({spec.rasioWorkshopLabel})
                            </div>
                          </div>
                        </label>
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-700">
                        ÷ {spec.rasioWorkshopLabel}
                      </td>
                    </tr>
                    <tr className={form.includeWorkshop ? 'bg-emerald-100/80' : 'bg-slate-50/50 text-slate-400'}>
                      <td className="py-2 px-2 text-center font-mono font-bold">20.b</td>
                      <td className="py-2 px-2.5 font-bold">
                        Biaya sewa alat murni incl. potongan workshop (200 jam)
                        <div className="text-[10px] font-normal">
                          Per jam: {formatRupiahCurrency(alatBeratResult.sewaMurniJamB)}
                        </div>
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-extrabold">
                        {formatRupiahCurrency(alatBeratResult.sewaMurniBulanB)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-2.5 text-left">Informasi Detail Genset Swasta</th>
                      <th className="py-1.5 px-2.5 text-right w-48">Nilai / Input</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-amber-50/90">
                      <td className="py-1.5 px-2.5 font-semibold text-amber-950">Kapasitas (KVA)</td>
                      <td className="py-1 px-2 text-right">
                        <input
                          type="number"
                          min="1"
                          value={form.kapasitasKva || ''}
                          onChange={(e) => handleNumberChange('kapasitasKva', e.target.value)}
                          className="w-28 bg-amber-100 border border-amber-400 rounded px-2 py-1 text-right font-mono font-bold text-slate-900"
                        />
                      </td>
                    </tr>

                    <tr className="bg-amber-50/90">
                      <td className="py-1.5 px-2.5 font-semibold text-amber-950">
                        {form.mode === 'genset_harian'
                          ? 'Tarif sewa harian All-In (Rp/hari)'
                          : 'Tarif sewa bulanan All-In (Rp/bulan)'}
                      </td>
                      <td className="py-1 px-2 text-right">
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={form.tarifAllInGenset || ''}
                          onChange={(e) => handleNumberChange('tarifAllInGenset', e.target.value)}
                          className="w-36 bg-amber-100 border border-amber-400 rounded px-2 py-1 text-right font-mono font-bold text-slate-900"
                        />
                      </td>
                    </tr>

                    <tr className="bg-sky-50/50">
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-slate-800">
                          Adjust biaya tanpa pajak / profit &amp; overhead (%)
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[0, 10, 12, 15].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() =>
                                setForm((prev) => ({ ...prev, adjustPajakProfitPct: pct }))
                              }
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer ${
                                form.adjustPajakProfitPct === pct
                                  ? 'bg-sky-600 text-white border-sky-600'
                                  : 'bg-white text-slate-700 border-slate-300'
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="50"
                            value={form.adjustPajakProfitPct}
                            onChange={(e) =>
                              handleNumberChange('adjustPajakProfitPct', e.target.value)
                            }
                            className="w-14 bg-amber-100 border border-amber-400 rounded px-1.5 py-0.5 text-right font-mono font-bold text-[11px]"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                        {formatRupiahCurrency(gensetResult.biayaTanpaPajak)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-1.5 px-2.5 text-slate-600">Koef. bahan bakar Genset</td>
                      <td className="py-1.5 px-2.5 text-right font-mono">
                        {KOEF_BBM_GENSET_SWASTA}
                      </td>
                    </tr>

                    {form.mode === 'genset_harian' && (
                      <tr className="bg-amber-50/60">
                        <td className="py-1.5 px-2.5 font-medium text-slate-800">
                          Jumlah jam pemakaian per hari
                        </td>
                        <td className="py-1 px-2 text-right">
                          <input
                            type="number"
                            min="1"
                            max="24"
                            value={form.jamPerHari || 10}
                            onChange={(e) => handleNumberChange('jamPerHari', e.target.value)}
                            className="w-20 bg-amber-100 border border-amber-400 rounded px-2 py-1 text-right font-mono font-bold"
                          />
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td className="py-1.5 px-2.5 text-slate-600">
                        Konsumsi bahan bakar ({form.mode === 'genset_harian' ? 'per hari' : '200 jam'})
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono">
                        {gensetResult.konsumsiBbmLiter.toFixed(1)} liter
                      </td>
                    </tr>

                    <tr className="bg-amber-50/90">
                      <td className="py-1.5 px-2.5 font-semibold text-amber-950">Harga solar (per liter)</td>
                      <td className="py-1 px-2 text-right">
                        <input
                          type="number"
                          step="100"
                          min="0"
                          value={form.hargaSolar || ''}
                          placeholder="6800"
                          onChange={(e) => handleNumberChange('hargaSolar', e.target.value)}
                          className="w-28 bg-amber-100 border border-amber-400 rounded px-2 py-1 text-right font-mono font-bold"
                        />
                      </td>
                    </tr>

                    <tr>
                      <td className="py-1.5 px-2.5 text-slate-700">
                        Biaya solar ({form.mode === 'genset_harian' ? 'per hari' : 'per bulan'})
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-rose-700">
                        - {formatRupiahCurrency(gensetResult.biayaSolarTotal)}
                      </td>
                    </tr>

                    <tr className="bg-amber-50/90">
                      <td className="py-1.5 px-2.5 font-semibold text-amber-950">
                        Operator genset per hari
                      </td>
                      <td className="py-1 px-2 text-right">
                        <input
                          type="number"
                          step="5000"
                          min="0"
                          value={form.biayaOperatorHari || ''}
                          placeholder="185000"
                          onChange={(e) => handleNumberChange('biayaOperatorHari', e.target.value)}
                          className="w-28 bg-amber-100 border border-amber-400 rounded px-2 py-1 text-right font-mono font-bold"
                        />
                      </td>
                    </tr>

                    <tr className="bg-amber-50/50">
                      <td className="py-1.5 px-2.5 text-slate-700">
                        Pembantu operator per hari (jika ada)
                      </td>
                      <td className="py-1 px-2 text-right">
                        <input
                          type="number"
                          step="5000"
                          min="0"
                          value={form.pembantuOperatorHari || ''}
                          placeholder="0"
                          onChange={(e) => handleNumberChange('pembantuOperatorHari', e.target.value)}
                          className="w-28 bg-amber-100 border border-amber-400 rounded px-2 py-1 text-right font-mono font-bold"
                        />
                      </td>
                    </tr>

                    {form.mode === 'genset_harian' && (
                      <tr className="bg-emerald-50/70">
                        <td className="py-1.5 px-2.5 font-bold text-emerald-900">
                          Tarif sewa harian murni (1 hari)
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-800">
                          {formatRupiahCurrency(gensetResult.tarifMurniPeriode)}
                        </td>
                      </tr>
                    )}

                    <tr className="bg-emerald-100/80">
                      <td className="py-2 px-2.5 font-extrabold text-emerald-950">
                        Tarif sewa bulanan murni (25 hari / 200 jam)
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-extrabold text-emerald-800">
                        {formatRupiahCurrency(gensetResult.tarifMurniBulanan)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* RIGHT: Comparison & Integration Panel */}
            <div className="lg:col-span-5 space-y-3">
              {/* Final Result Card */}
              <div
                className={`rounded-xl border p-4 shadow-xs ${
                  isNegativeResult
                    ? 'bg-rose-50 border-rose-300'
                    : 'bg-emerald-50 border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                    Hasil Sewa Alat Murni {currentResp ? 'Responden Ini' : 'Kab/Kota'}
                  </span>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-700">
                    {currentKomoditas?.satuan || '200 JAM'}
                  </span>
                </div>
                <div
                  className={`text-2xl font-mono font-extrabold tracking-tight ${
                    isNegativeResult ? 'text-rose-700' : 'text-emerald-800'
                  }`}
                >
                  {formatRupiahCurrency(finalSewaMurniBulan)}
                </div>
                <div className="text-xs text-slate-600 font-mono mt-0.5">
                  Setara per jam: <strong>{formatRupiahCurrency(finalSewaMurniJam)} / jam</strong>
                </div>

                {isNegativeResult && (
                  <div className="mt-2.5 bg-rose-100 border border-rose-300 rounded-lg p-2 text-[11px] text-rose-900 flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      Hasil negatif atau nol: total biaya BBM, pelumas, dan operator melebihi biaya sewa All-In tanpa pajak. Periksa kembali input HP, tarif All-In, atau harga solar/pelumas.
                    </span>
                  </div>
                )}
              </div>

              {/* District Readiness & Comparison Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-2xs text-xs">
                <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span>Progres Responden ({currentKab?.nama})</span>
                  <span className="font-mono text-[10px] text-slate-500">[{currentKab?.kode}]</span>
                </div>

                {kabSewaStatus && kabSewaStatus.total > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-semibold">Status Keseluruhan Kab/Kota:</span>
                      <span className="font-mono font-extrabold text-slate-900">
                        {kabSewaStatus.pureCount} / {kabSewaStatus.total} Siap Murni
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                        Murni: {kabSewaStatus.murniCount}
                      </span>
                      <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                        All-In (LK): {kabSewaStatus.allInComputedCount}
                      </span>
                      <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                        Menunggu LK: {kabSewaStatus.waitingLkCount}
                      </span>
                      <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                        Belum Konf: {kabSewaStatus.belumKonfCount}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                    <div className="text-slate-500">Harga Survei Awal (All-In)</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">
                      {formatRupiahNumber(hargaSurveiAllIn)}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                    <div className="text-slate-500">Harga 2026 (Sewa Murni)</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">
                      {harga2026 > 0 ? formatRupiahNumber(harga2026) : '- (Belum ada)'}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold">
                      Simulasi Rasio Harga Ini vs 2026
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 font-mono">
                      <span className="text-slate-500 line-through">
                        {harga2026 > 0 ? `${formatPercent(oldRasio)}%` : '-'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span
                        className={`font-extrabold text-sm ${
                          harga2026 <= 0
                            ? 'text-slate-500'
                            : isNewRasioAnomaly
                            ? 'text-rose-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {harga2026 > 0 && finalSewaMurniBulan > 0
                          ? `${formatPercent(newRasio)}%`
                          : '-'}
                      </span>
                    </div>
                  </div>
                  {harga2026 > 0 && finalSewaMurniBulan > 0 && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-1 rounded border ${
                        isNewRasioAnomaly
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {isNewRasioAnomaly ? 'Anomali (<80 / >120)' : 'Normal (80–120%)'}
                    </span>
                  )}
                </div>

                {/* Options on apply */}
                <div className="space-y-1.5 pt-1 text-[11px] text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appendCatatan}
                      onChange={(e) => setAppendCatatan(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 cursor-pointer"
                    />
                    <span>Catat ringkasan LK ke kolom Catatan Rekon</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={markRekonSelesai}
                      onChange={(e) => setMarkRekonSelesai(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 cursor-pointer"
                    />
                    <span>Sekaligus tandai status rekon &quot;Rekon Selesai&quot;</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {nextWaitingResp && (
                  <button
                    type="button"
                    disabled={!canEdit || isNegativeResult}
                    onClick={() => submitApply(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>Simpan &amp; Lanjut ke Responden All-In Berikutnya</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={!canEdit || isNegativeResult}
                  onClick={() => submitApply(false)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {currentResp
                      ? 'Terapkan Sewa Murni ke Detail Responden & Tutup'
                      : 'Terapkan Hasil Sewa Murni ke Tabel Rekon'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={handleConfirmSewaMurniOnly}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 disabled:opacity-50 disabled:cursor-not-allowed text-sky-900 border border-sky-300 font-bold text-xs transition-colors cursor-pointer"
                  title="Tandai responden ini sudah merupakan Sewa Murni (tanpa potongan LK)"
                >
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  <span>Tandai Responden Ini Sudah Sewa Murni</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setForm(buildDefaultLkForm(undefined, hargaSurveiAllIn, spec))
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Input LK ke Harga Survei Awal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
