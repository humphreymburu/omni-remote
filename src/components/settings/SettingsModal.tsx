import React from 'react';
import {
  Settings,
  Palette,
  Volume2,
  Vibrate,
  Sliders,
  X,
  Sparkles,
  SunMedium,
  Moon,
  Zap,
} from 'lucide-react';
import { AppTheme, TouchGestureSettings } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  gestureSettings: TouchGestureSettings;
  onUpdateGestureSettings: (settings: TouchGestureSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onChangeTheme,
  gestureSettings,
  onUpdateGestureSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Remote Preferences & Theme</h2>
              <p className="text-xs text-slate-400">Tactile haptics, themes, and audio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Selector */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-indigo-400" /> Remote Color Aesthetic
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            {[
              { id: 'oled_black', label: 'OLED True Black', desc: 'Eye-safe high contrast', bg: 'bg-black text-white' },
              { id: 'cyber_neon', label: 'Cyber Neon Dark', desc: 'Vibrant indigo glow', bg: 'bg-slate-950 text-indigo-400' },
              { id: 'titanium_slate', label: 'Titanium Slate', desc: 'Modern metallic grey', bg: 'bg-slate-800 text-slate-100' },
              { id: 'classic_ir', label: 'Classic IR Remote', desc: 'Retro black hardware', bg: 'bg-neutral-900 text-amber-400' },
              { id: 'minimal_light', label: 'Ergonomic Light', desc: 'Bright daylight mode', bg: 'bg-slate-200 text-slate-900' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => onChangeTheme(t.id as AppTheme)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  theme === t.id
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                    : 'border-slate-800 hover:border-slate-700'
                } ${t.bg}`}
              >
                <span className="font-bold text-xs">{t.label}</span>
                <span className="text-[10px] opacity-75">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Audio & Haptic Toggles */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Vibrate className="w-4 h-4 text-indigo-400" />
              <div>
                <h4 className="text-xs font-bold text-white">Haptic Vibration Feedback</h4>
                <p className="text-[10px] text-slate-400">Vibrate phone on button touch</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={gestureSettings.vibrationFeedback}
              onChange={(e) =>
                onUpdateGestureSettings({
                  ...gestureSettings,
                  vibrationFeedback: e.target.checked,
                })
              }
              className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold text-white">Synthesized Click Audio</h4>
                <p className="text-[10px] text-slate-400">Tactile Web Audio clicks</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={gestureSettings.soundEffects}
              onChange={(e) =>
                onUpdateGestureSettings({
                  ...gestureSettings,
                  soundEffects: e.target.checked,
                })
              }
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
