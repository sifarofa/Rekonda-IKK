import { RegisteredAdmin } from '../types/userAdmin';
import { KABUPATEN_KALBAR_LIST } from '../data/kabupatenList';

const STORAGE_KEY = 'rekonda_registered_admins_v2';

export function getRegisteredAdmins(): RegisteredAdmin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveRegisteredAdmin(admin: RegisteredAdmin): void {
  const current = getRegisteredAdmins();
  const existingIdx = current.findIndex(
    (a) => a.id === admin.id || a.kabupatenKode === admin.kabupatenKode
  );

  let updated: RegisteredAdmin[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = admin;
  } else {
    updated = [...current, admin];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function deleteRegisteredAdmin(idOrKode: string): void {
  const current = getRegisteredAdmins();
  const updated = current.filter((a) => a.id !== idOrKode && a.kabupatenKode !== idOrKode);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/**
 * Validates login for Kabupaten Admin against registered admins list.
 * Returns the matching RegisteredAdmin, or null.
 */
export function validateKabupatenAdminLogin(
  kabKodeOrUsername: string,
  passwordInput: string
): { success: boolean; admin?: RegisteredAdmin; error?: string } {
  const admins = getRegisteredAdmins();
  const cleanInput = kabKodeOrUsername.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  // Find admin by kabupaten kode or username
  const matched = admins.find(
    (a) =>
      a.kabupatenKode === cleanInput ||
      a.username.toLowerCase() === cleanInput
  );

  if (!matched) {
    return {
      success: false,
      error: 'Akun Admin belum terdaftar! Silakan hubungi Admin Provinsi untuk menambahkan akun Admin wilayah ini terlebih dahulu.'
    };
  }

  if (matched.status !== 'aktif') {
    return {
      success: false,
      error: 'Akun Admin ini sedang dinonaktifkan oleh Admin Provinsi.'
    };
  }

  // Check password (case-sensitive or exact match, also support default format rekonda{kode})
  if (matched.password !== cleanPass && cleanPass.toLowerCase() !== matched.password.toLowerCase()) {
    return {
      success: false,
      error: 'Kata sandi tidak sesuai dengan akun Admin terdaftar.'
    };
  }

  // Update last login
  matched.lastLogin = new Date().toISOString();
  saveRegisteredAdmin(matched);

  return { success: true, admin: matched };
}

/**
 * Batch generates default admin accounts for all 14 Kabupaten/Kota in Kalbar
 * that don't have an account registered yet.
 */
export function generateDefaultAllKabupatenAdmins(): RegisteredAdmin[] {
  const current = getRegisteredAdmins();
  const existingKodes = new Set(current.map((a) => a.kabupatenKode));
  const newAdmins: RegisteredAdmin[] = [...current];

  KABUPATEN_KALBAR_LIST.forEach((kab) => {
    if (!existingKodes.has(kab.kode)) {
      newAdmins.push({
        id: `admin_${kab.kode}_${Date.now()}`,
        kabupatenKode: kab.kode,
        kabupatenNama: kab.nama,
        username: `admin${kab.kode}`,
        namaLengkap: `Admin BPS ${kab.nama}`,
        password: `rekonda${kab.kode}`,
        createdAt: new Date().toISOString(),
        status: 'aktif'
      });
    }
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAdmins));
  } catch {
    // ignore
  }

  return newAdmins;
}
