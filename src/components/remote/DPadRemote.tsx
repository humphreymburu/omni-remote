import React from 'react';
import {
  Power,
  VolumeX,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Home,
  Menu,
  Tv,
  Plus,
  Minus,
  Play,
  Pause,
  Square,
  Rewind,
  FastForward,
  Sparkles,
} from 'lucide-react';
import { RemoteCommand, TVDevice } from '../../types';

interface DPadRemoteProps {
  device: TVDevice | null;
  onSendCommand: (command: RemoteCommand) => void;
}

export const DPadRemote: React.FC<DPadRemoteProps> = ({ device, onSendCommand }) => {
  const isPowered = device ? device.state.power : true;

  const handleBtnClick = (type: RemoteCommand['type'], value?: string | number) => {
    onSendCommand({ type, value });
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-6 rounded-[36px] bg-[#111111] border border-white/10 shadow-2xl">
      {/* Top Bar: Power & Mute & Input */}
      <div className="flex items-center justify-between gap-3 px-2">
        {/* Power Button */}
        <button
          onClick={() => handleBtnClick('POWER')}
          title="Power Toggle"
          className={`w-12 h-12 rounded-full transition-all duration-200 active:scale-95 shadow-lg flex items-center justify-center ${
            isPowered
              ? 'bg-red-600/20 text-red-500 border border-red-500/40 hover:bg-red-600 hover:text-white'
              : 'bg-white/5 text-gray-500 border border-white/10'
          }`}
        >
          <Power className="w-5 h-5" />
        </button>

        {/* Input Switcher */}
        <button
          onClick={() => handleBtnClick('INPUT')}
          title="Input Source"
          className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase transition-all active:scale-95"
        >
          <Tv className="w-4 h-4 text-blue-400" />
          <span>INPUT</span>
        </button>

        {/* Mute Button */}
        <button
          onClick={() => handleBtnClick('TOGGLE_MUTE')}
          title="Toggle Mute"
          className={`w-12 h-12 rounded-full transition-all duration-200 active:scale-95 flex items-center justify-center ${
            device?.state.muted
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
          }`}
        >
          <VolumeX className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation D-Pad Cluster */}
      <div className="relative my-2 flex items-center justify-center">
        <div className="relative w-64 h-64 rounded-full bg-[#121212] p-2 border border-white/5 shadow-inner flex items-center justify-center">
          {/* Subtle Ring Overlay */}
          <div className="absolute inset-3 rounded-full border border-white/5 pointer-events-none" />

          {/* D-Pad UP */}
          <button
            onClick={() => handleBtnClick('NAV_UP')}
            aria-label="Navigate Up"
            className="absolute top-3 w-16 h-14 rounded-t-full bg-transparent hover:bg-white/5 text-gray-300 hover:text-blue-400 flex items-center justify-center pt-1 transition-all active:scale-95"
          >
            <ChevronUp className="w-8 h-8" />
          </button>

          {/* D-Pad DOWN */}
          <button
            onClick={() => handleBtnClick('NAV_DOWN')}
            aria-label="Navigate Down"
            className="absolute bottom-3 w-16 h-14 rounded-b-full bg-transparent hover:bg-white/5 text-gray-300 hover:text-blue-400 flex items-center justify-center pb-1 transition-all active:scale-95"
          >
            <ChevronDown className="w-8 h-8" />
          </button>

          {/* D-Pad LEFT */}
          <button
            onClick={() => handleBtnClick('NAV_LEFT')}
            aria-label="Navigate Left"
            className="absolute left-3 w-14 h-16 rounded-l-full bg-transparent hover:bg-white/5 text-gray-300 hover:text-blue-400 flex items-center justify-center pl-1 transition-all active:scale-95"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* D-Pad RIGHT */}
          <button
            onClick={() => handleBtnClick('NAV_RIGHT')}
            aria-label="Navigate Right"
            className="absolute right-3 w-14 h-16 rounded-r-full bg-transparent hover:bg-white/5 text-gray-300 hover:text-blue-400 flex items-center justify-center pr-1 transition-all active:scale-95"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Center OK / Select Button */}
          <button
            onClick={() => handleBtnClick('NAV_SELECT')}
            aria-label="OK Select"
            className="w-28 h-28 rounded-full bg-[#1e1e1e] hover:bg-blue-600 text-blue-400 hover:text-white font-bold text-sm tracking-widest shadow-lg border border-white/10 flex items-center justify-center transition-all active:scale-90"
          >
            OK
          </button>
        </div>
      </div>

      {/* Primary Action Row: Back, Home, Menu */}
      <div className="grid grid-cols-3 gap-3 px-2">
        <button
          onClick={() => handleBtnClick('BACK')}
          className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold tracking-widest uppercase transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4 text-gray-400" />
          <span>BACK</span>
        </button>

        <button
          onClick={() => handleBtnClick('HOME')}
          className="py-3 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold tracking-widest uppercase transition-all active:scale-95"
        >
          <Home className="w-4 h-4 text-blue-400" />
          <span>HOME</span>
        </button>

        <button
          onClick={() => handleBtnClick('MENU')}
          className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold tracking-widest uppercase transition-all active:scale-95"
        >
          <Menu className="w-4 h-4 text-gray-400" />
          <span>MENU</span>
        </button>
      </div>

      {/* Volume Rocker & Channel Rocker Sliders */}
      <div className="grid grid-cols-2 gap-4 px-2">
        {/* Volume Rocker Column */}
        <div className="bg-[#121212] p-3 rounded-3xl border border-white/5 flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            VOL
          </span>
          <button
            onClick={() => handleBtnClick('VOL_UP')}
            className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-200 hover:text-blue-400 font-bold flex items-center justify-center transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
          <span className="text-xs font-mono font-bold text-blue-400 py-1">
            {device?.state.volume ?? 20}
          </span>
          <button
            onClick={() => handleBtnClick('VOL_DOWN')}
            className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-200 hover:text-blue-400 font-bold flex items-center justify-center transition-all active:scale-95"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Rocker Column */}
        <div className="bg-[#121212] p-3 rounded-3xl border border-white/5 flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            CH
          </span>
          <button
            onClick={() => handleBtnClick('CH_UP')}
            className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-200 hover:text-blue-400 font-bold flex items-center justify-center transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
          <span className="text-xs font-mono font-bold text-blue-400 py-1">
            {device?.state.channel ?? 1}
          </span>
          <button
            onClick={() => handleBtnClick('CH_DOWN')}
            className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-200 hover:text-blue-400 font-bold flex items-center justify-center transition-all active:scale-95"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media Playback Controls */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#121212] rounded-2xl border border-white/5">
        <button
          onClick={() => handleBtnClick('REWIND')}
          className="p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-95"
          title="Rewind"
        >
          <Rewind className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleBtnClick('PLAY')}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-95 shadow-md shadow-blue-600/30"
          title="Play"
        >
          <Play className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleBtnClick('PAUSE')}
          className="p-2.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-all active:scale-95"
          title="Pause"
        >
          <Pause className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleBtnClick('STOP')}
          className="p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-95"
          title="Stop"
        >
          <Square className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleBtnClick('FAST_FORWARD')}
          className="p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-95"
          title="Fast Forward"
        >
          <FastForward className="w-4 h-4" />
        </button>
      </div>

      {/* Color Action Buttons Row */}
      <div className="grid grid-cols-4 gap-2 px-2">
        <button
          onClick={() => handleBtnClick('COLOR_RED')}
          className="h-3 rounded-full bg-red-500 hover:bg-red-400 active:scale-95 transition-all opacity-80 hover:opacity-100"
          title="Red Action"
        />
        <button
          onClick={() => handleBtnClick('COLOR_GREEN')}
          className="h-3 rounded-full bg-green-500 hover:bg-green-400 active:scale-95 transition-all opacity-80 hover:opacity-100"
          title="Green Action"
        />
        <button
          onClick={() => handleBtnClick('COLOR_YELLOW')}
          className="h-3 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all opacity-80 hover:opacity-100"
          title="Yellow Action"
        />
        <button
          onClick={() => handleBtnClick('COLOR_BLUE')}
          className="h-3 rounded-full bg-blue-500 hover:bg-blue-400 active:scale-95 transition-all opacity-80 hover:opacity-100"
          title="Blue Action"
        />
      </div>
    </div>
  );
};
