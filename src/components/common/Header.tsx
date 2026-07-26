import React from 'react';
import {
  Tv,
  Wifi,
  WifiOff,
  Bluetooth,
  Mic,
  Settings,
  FolderDown,
  Cloud,
  MonitorPlay,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { TVDevice, AppTheme } from '../../types';

interface HeaderProps {
  activeDevice: TVDevice | null;
  isOnline: boolean;
  theme: AppTheme;
  showSimulatedTV: boolean;
  onToggleSimulatedTV: () => void;
  onOpenDiscovery: () => void;
  onOpenVoice: () => void;
  onOpenMedia: () => void;
  onOpenSync: () => void;
  onOpenSettings: () => void;
  onOpenPwaModal?: () => void;
  onQuickReconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeDevice,
  isOnline,
  showSimulatedTV,
  onToggleSimulatedTV,
  onOpenDiscovery,
  onOpenVoice,
  onOpenMedia,
  onOpenSync,
  onOpenSettings,
  onOpenPwaModal,
  onQuickReconnect,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/10 px-4 py-3 text-[#e0e0e0] transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* App Title & Active Device Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-600/30">
            <Tv className="w-5 h-5" />
          </div>

          <div className="min-w-0 cursor-pointer" onClick={onOpenDiscovery}>
            <h1 className="text-lg font-semibold tracking-tight text-white truncate">
              {activeDevice ? activeDevice.name : 'Living Room TV'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${activeDevice ? 'bg-green-500' : 'bg-amber-500 animate-ping'}`} />
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                {activeDevice ? `Connected • ${activeDevice.brand.toUpperCase()}` : 'Disconnected • Select TV'}
              </span>
            </div>
          </div>
        </div>

        {/* Network Latency & Quick Utility Control Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Network Latency</span>
            <span className="text-xs font-mono text-blue-400">12ms</span>
          </div>

          {/* Virtual TV Screen Toggle */}
          <button
            onClick={onToggleSimulatedTV}
            title={showSimulatedTV ? 'Hide TV Mirror' : 'Show Live TV Mirror Screen'}
            className={`p-2 rounded-full transition-all flex items-center gap-1.5 ${
              showSimulatedTV
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'hover:bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <MonitorPlay className="w-5 h-5" />
            <span className="hidden md:inline text-xs font-medium">TV Mirror</span>
          </button>

          {/* Voice Search Mic */}
          <button
            onClick={onOpenVoice}
            title="Voice Commands"
            className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-full transition-colors relative"
          >
            <Mic className="w-5 h-5 text-blue-400" />
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          </button>

          {/* Device Discovery Button */}
          <button
            onClick={onOpenDiscovery}
            title="Device Pairing & Network Scan"
            className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-full transition-colors"
          >
            {activeDevice?.protocol === 'web_bluetooth' ? (
              <Bluetooth className="w-5 h-5 text-blue-400" />
            ) : isOnline ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-amber-400" />
            )}
          </button>

          {/* Offline Media Vault */}
          <button
            onClick={onOpenMedia}
            title="Offline Media Vault"
            className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-full transition-colors"
          >
            <FolderDown className="w-5 h-5 text-gray-300" />
          </button>

          {/* iPhone / PWA Install Guide */}
          {onOpenPwaModal && (
            <button
              onClick={onOpenPwaModal}
              title="Install App on iPhone / iOS"
              className="px-2.5 py-1 rounded-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-all flex items-center gap-1 shrink-0"
            >
              <span>Install PWA</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            title="Remote Settings & Themes"
            className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-full transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
