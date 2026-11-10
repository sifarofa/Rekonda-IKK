import React, { useState, useEffect } from 'react';
import { X, Save, MessageSquare } from 'lucide-react';
import { KabupatenRekon } from '../types/rekonda';

interface NotePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  kabupaten: KabupatenRekon | null;
  onSaveNote: (kabupatenId: string, note: string) => void;
}

export const NotePreviewModal: React.FC<NotePreviewModalProps> = ({
  isOpen,
  onClose,
  kabupaten,
  onSaveNote
}) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (kabupaten) {
      setNote(kabupaten.catatan || '');
    }
  }, [kabupaten]);

  if (!isOpen || !kabupaten) return null;

  const handleSave = () => {
    onSaveNote(kabupaten.id, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <h4 className="text-sm font-bold text-white">
              Catatan Rekonsiliasi: [{kabupaten.kode}] {kabupaten.nama}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            Keterangan Lapangan & Justifikasi Harga
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            placeholder="Tuliskan alasan fluktuasi harga, kondisi cuaca, biaya logistik antar wilayah, atau konfirmasi dinas teknis setempat..."
            className="w-full text-xs text-slate-800 p-3 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Catatan akan tampil di tabel utama dan laporan cetak.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
