import React from 'react';
import {
  Volume2,
  VolumeX,
  Tv,
  Power,
  Play,
  Pause,
  Radio,
  Cast,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { TVDevice } from '../../types';

interface SimulatedTVScreenProps {
  device: TVDevice;
  onClose?: () => void;
}

export const SimulatedTVScreen: React.FC<SimulatedTVScreenProps> = ({ device, onClose }) => {
  const { state, name, brand } = device;

  // Background artwork based on active app or channel
  const getAppThemeStyle = () => {
    switch (state.activeApp.toLowerCase()) {
      case 'netflix':
        return {
          bg: 'from-red-950 via-neutral-900 to-black',
          accent: 'text-red-500',
          logo: 'NETFLIX',
          subtext: state.mediaTitle || 'Playing Ultra HD Dolby Atmos',
        };
      case 'youtube':
        return {
          bg: 'from-red-900 via-zinc-900 to-slate-950',
          accent: 'text-red-400',
          logo: 'YouTube 4K',
          subtext: state.mediaTitle || 'Recommended Video Stream',
        };
      case 'disney+':
      case 'disney':
        return {
          bg: 'from-blue-950 via-slate-900 to-indigo-950',
          accent: 'text-sky-400',
          logo: 'Disney+',
          subtext: 'Star Wars: The Mandalorian',
        };
      case 'prime video':
      case 'prime':
        return {
          bg: 'from-cyan-950 via-slate-900 to-slate-950',
          accent: 'text-cyan-400',
          logo: 'Prime Video',
          subtext: 'The Rings of Power',
        };
      case 'spotify':
        return {
          bg: 'from-emerald-950 via-slate-900 to-black',
          accent: 'text-emerald-400',
          logo: 'Spotify Music',
          subtext: state.mediaArtist ? `${state.mediaTitle || 'Now Playing'} - ${state.mediaArtist}` : 'Hi-Fi Audio Stream',
        };
      default:
        return {
          bg: 'from-slate-900 via-indigo-950 to-slate-950',
          accent: 'text-indigo-400',
          logo: state.activeApp || 'Live TV',
          subtext: state.channelName || `Channel ${state.channel}`,
        };
    }
  };

  const appInfo = getAppThemeStyle();

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-2 my-1 animate-in fade-in duration-300">
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-4 border-slate-800 shadow-2xl shadow-indigo-950/40">
        {/* TV Bezel Top Bar */}
        <div className="bg-slate-900/90 px-3 py-1.5 flex items-center justify-between border-b border-slate-800/80 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${state.power ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80' : 'bg-red-500'}`} />
            <span className="font-semibold text-slate-200">{name}</span>
            <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">{brand}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>4K HDR</span>
            <span>60Hz</span>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white px-1 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* TV Display Screen */}
        <div
          className={`relative aspect-video w-full flex flex-col justify-between p-4 transition-all duration-500 bg-gradient-to-br ${
            state.power ? appInfo.bg : 'from-black via-slate-950 to-black'
          }`}
        >
          {/* Powered Off Screen */}
          {!state.power ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 bg-slate-950/90">
              <Power className="w-8 h-8 mb-2 opacity-40 text-slate-600" />
              <p className="text-xs font-mono tracking-wider uppercase">TV Standby Mode</p>
              <p className="text-[10px] text-slate-600 mt-1">Press Power to turn on</p>
            </div>
          ) : (
            <>
              {/* Screen Top Status Overlay */}
              <div className="flex items-center justify-between z-10 text-white/90">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-xs font-medium">
                  <span className={`font-bold ${appInfo.accent}`}>{appInfo.logo}</span>
                  <span className="text-white/40">|</span>
                  <span className="text-white/80 text-[11px] truncate max-w-[140px]">{appInfo.subtext}</span>
                </div>

                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 text-xs text-white/80">
                  <Cast className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span className="text-[10px] font-mono">Input: {state.currentInput}</span>
                </div>
              </div>

              {/* Center Content Artwork / Simulated Video Animation */}
              <div className="my-auto flex flex-col items-center justify-center text-center z-10 py-2">
                <div className="relative mb-2">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                    {state.mediaState === 'playing' ? (
                      <div className="flex items-end gap-1 h-7">
                        <span className="w-1.5 bg-indigo-400 rounded-full animate-bounce h-full" />
                        <span className="w-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.15s] h-4" />
                        <span className="w-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.3s] h-6" />
                        <span className="w-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.45s] h-3" />
                      </div>
                    ) : (
                      <Pause className="w-8 h-8 text-white/70" />
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white tracking-wide">{state.activeApp}</h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">{state.channelName}</p>
              </div>

              {/* Bottom On-Screen HUD Overlay (Volume Bar / Mute Notification) */}
              <div className="z-10 flex items-end justify-between gap-3">
                {/* Volume OSD Indicator */}
                <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-white">
                  {state.muted ? (
                    <VolumeX className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <div className="w-24 sm:w-32 bg-slate-800 h-2 rounded-full overflow-hidden border border-white/10">
                    <div
                      className={`h-full transition-all duration-300 ${
                        state.muted ? 'bg-red-500/50' : 'bg-gradient-to-r from-emerald-500 to-indigo-500'
                      }`}
                      style={{ width: `${state.muted ? 0 : state.volume}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold w-6 text-right">
                    {state.muted ? '0' : state.volume}
                  </span>
                </div>

                {/* Live Channel / App Info Badge */}
                <div className="bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs text-slate-200 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>CH {state.channel}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* TV Base Stand Accent */}
        <div className="h-1.5 bg-slate-800 w-full flex justify-center">
          <div className="w-24 h-1 bg-slate-700 rounded-b-md" />
        </div>
      </div>
    </div>
  );
};
