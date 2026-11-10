import React from 'react';
import {
  X,
  SlidersHorizontal,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Maximize2,
  Minimize2,
  Check,
  RotateCcw
} from 'lucide-react';
import { DisplaySettings, DisplayDensity, DisplayScale, DisplayWidth } from '../types/rekonda';

interface DisplayAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DisplaySettings;
  onUpdateSettings: (newSettings: DisplaySettings) => void;
  onResetSettings: () => void;
}

export const DisplayAdjustModal: React.FC<DisplayAdjustModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings
}) => {
  if (!isOpen) return null;

  const handleDensityChange = (density: DisplayDensity) => {
    onUpdateSettings({ ...settings, density });
  };

  const handleScaleChange = (scale: DisplayScale) => {
    onUpdateSettings({ ...settings, scale });
  };

  const handleWidthChange = (width: DisplayWidth) => {
    onUpdateSettings({ ...settings, width });
  };

  // Quick Preset Actions
  const applyPreset = (preset: 'mobile' | 'tablet' | 'laptop' | 'ultrawide') => {
    if (preset === 'mobile') {
      onUpdateSettings({ density: 'compact', scale: 'small', width: 'full' });
    } else if (preset === 'tablet') {
      onUpdateSettings({ density: 'comfortable', scale: 'normal', width: 'full' });
    } else if (preset === 'laptop') {
      onUpdateSettings({ density: 'normal', scale: 'normal', width: 'contained' });
    } else if (preset === 'ultrawide') {
      onUpdateSettings({ density: 'compact', scale: 'normal', width: 'full' });
    }
  };

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center shadow-xs">
              <SlidersHorizontal className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Penyesuaian Tampilan (Display Adjuster)
              </h4>
              <p className="text-[11px] text-slate-400">
                Sesuaikan kenyamanan visual sesuai ukuran layar & perangkat Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-xs">
          {/* Quick Presets */}
          <div>
            <label className="block text-slate-800 font-bold mb-1.5">
              Pilihan Cepat Berdasarkan Perangkat:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('mobile')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-slate-700 flex flex-col items-center gap-1 transition-colors cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-sky-600" />
                <span className="font-semibold text-[11px]">Smartphone</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('tablet')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-slate-700 flex flex-col items-center gap-1 transition-colors cursor-pointer"
              >
                <Tablet className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-[11px]">Tablet / iPad</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('laptop')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-slate-700 flex flex-col items-center gap-1 transition-colors cursor-pointer"
              >
                <Laptop className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-[11px]">Laptop</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('ultrawide')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-slate-700 flex flex-col items-center gap-1 transition-colors cursor-pointer"
              >
                <Monitor className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-[11px]">Layar Lebar</span>
              </button>
            </div>
          </div>

          {/* 1. Kerapatan Baris (Density) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 font-bold">
                Kerapatan Data Tabel (Density):
              </label>
              <span className="text-[11px] text-slate-500 font-medium capitalize">
                {settings.density === 'compact' ? 'Ringkas' : settings.density === 'normal' ? 'Standar' : 'Lapang (Touch)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDensityChange('compact')}
                className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                  settings.density === 'compact'
                    ? 'border-sky-600 bg-sky-50/80 text-sky-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold">Ringkas</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Maksimal Data</div>
              </button>

              <button
                type="button"
                onClick={() => handleDensityChange('normal')}
                className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                  settings.density === 'normal'
                    ? 'border-sky-600 bg-sky-50/80 text-sky-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold">Standar</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Proporsional</div>
              </button>

              <button
                type="button"
                onClick={() => handleDensityChange('comfortable')}
                className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                  settings.density === 'comfortable'
                    ? 'border-sky-600 bg-sky-50/80 text-sky-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold">Lapang</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Ramah Sentuh</div>
              </button>
            </div>
          </div>

          {/* 2. Skala Teks / Zoom */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 font-bold">
                Skala Ukuran Teks (Zoom):
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {settings.scale === 'small' ? '90% (Kecil)' : settings.scale === 'normal' ? '100% (Normal)' : '110% (Besar)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleScaleChange('small')}
                className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                  settings.scale === 'small'
                    ? 'border-sky-600 bg-sky-50/80 text-sky-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold">Kecil (90%)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Muat Lebih Banyak</div>
              </button>

              <button
                type="button"
                onClick={() => handleScaleChange('normal')}
                className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                  settings.scale === 'normal'
                    ? 'border-sky-600 bg-sky-50/80 text-sky-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold">Normal (100%)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Ukuran Standar</div>
              </button>

              <button
                type="button"
                onClick={() => handleScaleChange('large')}
                className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                  settings.scale === 'large'
                    ? 'border-sky-600 bg-sky-50/80 text-sky-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold">Besar (110%)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Lebih Terbaca</div>
              </button>
            </div>
          </div>

          {/* 3. Lebar Kontainer (Container Width) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 font-bold">
                Lebar Layar (Container Mode):
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {settings.width === 'full' ? 'Penuh Layar (100%)' : 'Terpusat (1440px)'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleWidthChange('contained')}
                className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  settings.width === 'contained'
                    ? 'border-sky-600 bg-sky-50/80 text-sky-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Terpusat (1440px)</span>
              </button>

              <button
                type="button"
                onClick={() => handleWidthChange('full')}
                className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  settings.width === 'full'
                    ? 'border-sky-600 bg-sky-50/80 text-sky-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Penuh Layar (100%)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onResetSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Atur Ulang (Default)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terapkan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
