import React, { useState, useEffect } from 'react';
import { X, Save, Building, Tag, DollarSign, Calendar } from 'lucide-react';
import { RespondenData } from '../types/rekonda';
import { formatRupiahNumber } from '../utils/formatters';

interface RespondentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (respondent: Omit<RespondenData, 'id'> & { id?: string }) => void;
  initialData?: RespondenData | null;
  defaultTahun?: number;
  defaultTriwulan?: number;
  kabupatenNama: string;
}

export const RespondentFormModal: React.FC<RespondentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultTahun = 2026,
  defaultTriwulan = 1,
  kabupatenNama
}) => {
  const [tahun, setTahun] = useState<number>(defaultTahun);
  const [triwulan, setTriwulan] = useState<number>(defaultTriwulan);
  const [nama, setNama] = useState<string>('');
  const [merk, setMerk] = useState<string>('Biasa');
  const [harga, setHarga] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setTahun(initialData.tahun);
      setTriwulan(initialData.triwulan);
      setNama(initialData.nama);
      setMerk(initialData.merk);
      setHarga(initialData.harga.toString());
    } else {
      setTahun(defaultTahun);
      setTriwulan(defaultTriwulan);
      setNama('');
      setMerk('Biasa');
      setHarga('');
    }
    setError('');
  }, [initialData, defaultTahun, defaultTriwulan, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setError('Nama responden wajib diisi!');
      return;
    }
    const parsedPrice = parseFloat(harga.replace(/[^0-9]/g, ''));
    if (!parsedPrice || parsedPrice <= 0) {
      setError('Harga harus berupa nominal angka valid lebih besar dari 0!');
      return;
    }

    onSave({
      id: initialData?.id,
      tahun: Number(tahun),
      triwulan: Number(triwulan),
      nama: nama.trim().toUpperCase(),
      merk: merk.trim(),
      harga: Math.round(parsedPrice)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white">
              {initialData ? 'Edit Responden Survei' : 'Tambah Responden Survei Baru'}
            </h4>
            <p className="text-[11px] text-slate-400">
              Kabupaten / Kota: <strong className="text-rose-300">{kabupatenNama}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Tahun & Triwulan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Tahun</span>
              </label>
              <select
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-rose-500 focus:outline-none"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Triwulan
              </label>
              <select
                value={triwulan}
                onChange={(e) => setTriwulan(Number(e.target.value))}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-rose-500 focus:outline-none"
              >
                <option value={1}>TW I</option>
                <option value={2}>TW II</option>
                <option value={3}>TW III</option>
                <option value={4}>TW IV</option>
              </select>
            </div>
          </div>

          {/* Nama Responden */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Nama Responden (Toko / Distributor / CV)</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: TB. TAMBANG JAYA"
              className="w-full text-xs font-semibold uppercase bg-slate-50 border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Merk / Spesifikasi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Merk / Kualitas / Spesifikasi</span>
            </label>
            <input
              type="text"
              value={merk}
              onChange={(e) => setMerk(e.target.value)}
              placeholder="Contoh: Biasa / Super / Galian C"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Harga */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <span>Harga Satuan (Rupiah)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                Rp
              </div>
              <input
                type="text"
                required
                value={harga}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  if (!raw) {
                    setHarga('');
                  } else {
                    const formatted = formatRupiahNumber(Number(raw));
                    setHarga(formatted);
                  }
                }}
                placeholder="0"
                className="w-full text-xs font-mono font-bold pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Masukkan harga transaksi riil di lapangan tanpa tanda titik/koma
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-md shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{initialData ? 'Perbarui Data' : 'Simpan Responden'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
