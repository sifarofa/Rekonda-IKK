import { KabupatenRekon, LkSewaAlatData } from '../types/rekonda';

export interface EquipmentSpec {
  kode: string;
  labelPu: string;
  hpStandarPu: number;
  koefBbm: number;
  koefPelumas: number;
  rasioWorkshop: number;
  rasioWorkshopLabel: string;
  isGenset?: boolean;
  defaultKva?: number;
}

const STANDARD_WORKSHOP_RATIO = 1.3842655; // Ditampilkan 1.38 pada LK PERMENPUPR No.01/2022
const FINISHER_WORKSHOP_RATIO = 1.54;

export const SEWA_ALAT_SPECS: Record<string, EquipmentSpec> = {
  '5101': {
    kode: '5101',
    labelPu: 'EXCAVATOR < 80 HP',
    hpStandarPu: 75,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38'
  },
  '5102': {
    kode: '5102',
    labelPu: 'EXCAVATOR 80-140 HP',
    hpStandarPu: 133,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38'
  },
  '5201': {
    kode: '5201',
    labelPu: 'BULLDOZER < 100 HP',
    hpStandarPu: 90,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38'
  },
  '5202': {
    kode: '5202',
    labelPu: 'BULLDOZER 100-150 HP',
    hpStandarPu: 155,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38'
  },
  '5301': {
    kode: '5301',
    labelPu: 'WHEEL LOADER 1.0-1.6 M3',
    hpStandarPu: 96,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38'
  },
  '5302': {
    kode: '5302',
    labelPu: 'TRACK LOADER 75-100 HP',
    hpStandarPu: 70,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38'
  },
  '5401': {
    kode: '5401',
    labelPu: 'TANDEM ROLLER 6-8 TON',
    hpStandarPu: 82,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38'
  },
  '5402': {
    kode: '5402',
    labelPu: 'TANDEM ROLLER 8-10 TON',
    hpStandarPu: 100,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38'
  },
  '5403': {
    kode: '5403',
    labelPu: 'VIBRATORY ROLLER 5-8 TON',
    hpStandarPu: 82,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38'
  },
  '5501': {
    kode: '5501',
    labelPu: 'MOTOR GRADER <= 100 HP',
    hpStandarPu: 100,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38'
  },
  '5502': {
    kode: '5502',
    labelPu: 'MOTOR GRADER > 100 HP',
    hpStandarPu: 135,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38'
  },
  '5601': {
    kode: '5601',
    labelPu: 'ASPHALT FINISHER <= 10 TON',
    hpStandarPu: 72.4,
    koefBbm: 0.1,
    koefPelumas: 0.0025,
    rasioWorkshop: FINISHER_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.54'
  },
  '5602': {
    kode: '5602',
    labelPu: 'ASPHALT FINISHER > 10 TON',
    hpStandarPu: 110,
    koefBbm: 0.1,
    koefPelumas: 0.0025,
    rasioWorkshop: FINISHER_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.54'
  },
  '5701': {
    kode: '5701',
    labelPu: 'DUMP TRUCK 3-4 m3 (4 TON)',
    hpStandarPu: 134,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38'
  },
  '5702': {
    kode: '5702',
    labelPu: 'DUMP TRUCK 6-8 m3',
    hpStandarPu: 190,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38'
  },
  '5801': {
    kode: '5801',
    labelPu: 'GENSET 60 KVA',
    hpStandarPu: 80,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38',
    isGenset: true,
    defaultKva: 60
  },
  '5802': {
    kode: '5802',
    labelPu: 'GENSET 80 KVA',
    hpStandarPu: 108,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38',
    isGenset: true,
    defaultKva: 80
  },
  '5803': {
    kode: '5803',
    labelPu: 'GENSET 135 KVA',
    hpStandarPu: 180,
    koefBbm: 0.12,
    koefPelumas: 0.0035,
    rasioWorkshop: STANDARD_WORKSHOP_RATIO,
    rasioWorkshopLabel: '1.38',
    isGenset: true,
    defaultKva: 135
  }
};

export function isSewaAlatKomoditas(kode: string): boolean {
  const num = parseInt(kode, 10);
  return !isNaN(num) && num >= 5101 && num <= 5803;
}

export function getEquipmentSpec(kode: string): EquipmentSpec {
  return (
    SEWA_ALAT_SPECS[kode] || {
      kode,
      labelPu: 'ALAT BERAT STANDAR PU',
      hpStandarPu: 100,
      koefBbm: 0.12,
      koefPelumas: 0.0035,
      rasioWorkshop: STANDARD_WORKSHOP_RATIO,
      rasioWorkshopLabel: '1.38'
    }
  );
}

export interface AlatBeratCalculationResult {
  biayaTanpaPajak: number;       // 3
  biayaAllInTanpaMobBulan: number; // 5
  biayaAllInTanpaMobJam: number;   // 6
  jumlahBbmJam: number;          // 8 (liter)
  biayaBbmJam: number;           // 10
  jumlahPelumasJam: number;      // 12 (liter)
  biayaPelumasJam: number;       // 14
  biayaOperatorJam: number;      // 16
  sewaMurniJamA: number;         // 17 (tanpa potongan workshop)
  sewaMurniBulanA: number;       // 18.a
  sewaMurniBulanB: number;       // 20.b (dibagi rasio workshop)
  sewaMurniJamB: number;         // per jam incl workshop
  finalSewaMurniJam: number;
  finalSewaMurniBulan: number;
}

/**
 * Rumus sesuai LK Penghitungan Sewa Alat Berat (PERMENPUPR No.01 Tahun 2022)
 */
export function calculateAlatBeratMurni(
  input: Pick<
    LkSewaAlatData,
    | 'hpLapangan'
    | 'biayaAllInBulan'
    | 'adjustPajakProfitPct'
    | 'biayaMobilisasi'
    | 'hargaSolar'
    | 'hargaPelumas'
    | 'biayaOperatorHari'
    | 'includeWorkshop'
  >,
  spec: EquipmentSpec
): AlatBeratCalculationResult {
  const factor = 1 + Math.max(0, input.adjustPajakProfitPct) / 100;
  const biayaTanpaPajak = input.biayaAllInBulan / factor;
  const biayaAllInTanpaMobBulan = biayaTanpaPajak - (input.biayaMobilisasi || 0);
  const biayaAllInTanpaMobJam = biayaAllInTanpaMobBulan / 200;

  const jumlahBbmJam = (input.hpLapangan || 0) * spec.koefBbm;
  const biayaBbmJam = jumlahBbmJam * (input.hargaSolar || 0);

  const jumlahPelumasJam = (input.hpLapangan || 0) * spec.koefPelumas;
  const biayaPelumasJam = jumlahPelumasJam * (input.hargaPelumas || 0);

  // 200 jam / bulan = 25 hari kerja * 8 jam / hari
  const biayaOperatorJam = (input.biayaOperatorHari || 0) / 8;

  const sewaMurniJamA = biayaAllInTanpaMobJam - biayaBbmJam - biayaPelumasJam - biayaOperatorJam;
  const sewaMurniBulanA = sewaMurniJamA * 200;

  const sewaMurniBulanB = sewaMurniBulanA / spec.rasioWorkshop;
  const sewaMurniJamB = sewaMurniBulanB / 200;

  const chosenJam = input.includeWorkshop ? sewaMurniJamB : sewaMurniJamA;
  const chosenBulan = input.includeWorkshop ? sewaMurniBulanB : sewaMurniBulanA;

  return {
    biayaTanpaPajak: Math.round(biayaTanpaPajak),
    biayaAllInTanpaMobBulan: Math.round(biayaAllInTanpaMobBulan),
    biayaAllInTanpaMobJam: Math.round(biayaAllInTanpaMobJam),
    jumlahBbmJam,
    biayaBbmJam: Math.round(biayaBbmJam),
    jumlahPelumasJam,
    biayaPelumasJam: Math.round(biayaPelumasJam),
    biayaOperatorJam: Math.round(biayaOperatorJam),
    sewaMurniJamA: Math.round(sewaMurniJamA),
    sewaMurniBulanA: Math.round(sewaMurniBulanA),
    sewaMurniBulanB: Math.round(sewaMurniBulanB),
    sewaMurniJamB: Math.round(sewaMurniJamB),
    finalSewaMurniJam: Math.round(chosenJam),
    finalSewaMurniBulan: Math.round(chosenBulan)
  };
}

export interface GensetCalculationResult {
  biayaTanpaPajak: number;
  konsumsiBbmLiter: number;
  biayaSolarTotal: number;
  biayaOperatorTotal: number;
  tarifMurniPeriode: number; // Harian atau Bulanan sesuai mode
  tarifMurniBulanan: number; // Selalu setara 200 jam / 25 hari
  tarifMurniJam: number;
}

export const KOEF_BBM_GENSET_SWASTA = 0.21;

export function calculateGensetMurni(input: {
  mode: 'genset_harian' | 'genset_bulanan';
  kapasitasKva: number;
  tarifAllIn: number;
  adjustPajakProfitPct: number;
  jamPerHari: number;
  hariPerBulan: number;
  hargaSolar: number;
  biayaOperatorHari: number;
  pembantuOperatorHari: number;
}): GensetCalculationResult {
  const factor = 1 + Math.max(0, input.adjustPajakProfitPct) / 100;
  const biayaTanpaPajak = input.tarifAllIn / factor;
  const jamPeriode = input.mode === 'genset_harian' ? (input.jamPerHari || 10) : 200;
  const hariBulan = input.hariPerBulan || 25;

  const konsumsiBbmLiter = (input.kapasitasKva || 0) * KOEF_BBM_GENSET_SWASTA * jamPeriode;
  const biayaSolarTotal = konsumsiBbmLiter * (input.hargaSolar || 0);

  const opPerHari = (input.biayaOperatorHari || 0) + (input.pembantuOperatorHari || 0);
  const biayaOperatorTotal = input.mode === 'genset_harian' ? opPerHari : opPerHari * hariBulan;

  const tarifMurniPeriode = biayaTanpaPajak - biayaSolarTotal - biayaOperatorTotal;
  const tarifMurniBulanan =
    input.mode === 'genset_harian' ? tarifMurniPeriode * hariBulan : tarifMurniPeriode;
  const tarifMurniJam = tarifMurniBulanan / 200;

  return {
    biayaTanpaPajak: Math.round(biayaTanpaPajak),
    konsumsiBbmLiter,
    biayaSolarTotal: Math.round(biayaSolarTotal),
    biayaOperatorTotal: Math.round(biayaOperatorTotal),
    tarifMurniPeriode: Math.round(tarifMurniPeriode),
    tarifMurniBulanan: Math.round(tarifMurniBulanan),
    tarifMurniJam: Math.round(tarifMurniJam)
  };
}

export interface SewaAlatKabStatus {
  total: number;
  murniCount: number;
  allInComputedCount: number;
  waitingLkCount: number;
  belumKonfCount: number;
  pureCount: number;
  allPure: boolean;
  hasAnyLk: boolean;
}

export function getSewaAlatKabStatus(kab: KabupatenRekon): SewaAlatKabStatus {
  const res = kab.respondents || [];
  const total = res.length;

  if (total === 0) {
    const isAllInComputed =
      kab.tipeSewa === 'all_in' &&
      Boolean(kab.lkSewaAlat) &&
      (kab.lkSewaAlat?.hasilSewaMurniBulan ?? 0) > 0;
    const isMurni = kab.tipeSewa === 'sewa_murni';
    const isWaitingLk = kab.tipeSewa === 'all_in' && !isAllInComputed;
    const isPure = isMurni || isAllInComputed;

    return {
      total: 0,
      murniCount: isMurni ? 1 : 0,
      allInComputedCount: isAllInComputed ? 1 : 0,
      waitingLkCount: isWaitingLk ? 1 : 0,
      belumKonfCount: !isPure && !isWaitingLk ? 1 : 0,
      pureCount: isPure ? 1 : 0,
      allPure: isPure,
      hasAnyLk: isAllInComputed
    };
  }

  let murniCount = 0;
  let allInComputedCount = 0;
  let waitingLkCount = 0;
  let belumKonfCount = 0;

  for (const r of res) {
    if (r.tipeSewa === 'sewa_murni') {
      murniCount++;
    } else if (r.tipeSewa === 'all_in') {
      if (r.lkSewaAlat && r.lkSewaAlat.hasilSewaMurniBulan > 0) {
        allInComputedCount++;
      } else {
        waitingLkCount++;
      }
    } else {
      belumKonfCount++;
    }
  }

  const pureCount = murniCount + allInComputedCount;
  const allPure = pureCount === total && total > 0;

  return {
    total,
    murniCount,
    allInComputedCount,
    waitingLkCount,
    belumKonfCount,
    pureCount,
    allPure,
    hasAnyLk: allInComputedCount > 0
  };
}

