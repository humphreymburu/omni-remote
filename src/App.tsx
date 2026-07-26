import React, { useState, useEffect } from 'react';
import {
  Tv,
  Gamepad2,
  Hand,
  Hash,
  Sparkles,
  Wifi,
  WifiOff,
  History,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Header } from './components/common/Header';
import { SimulatedTVScreen } from './components/simulator/SimulatedTVScreen';
import { DPadRemote } from './components/remote/DPadRemote';
import { TouchpadRemote } from './components/touchpad/TouchpadRemote';
import { NumPadRemote } from './components/remote/NumPadRemote';
import { FavoritesPanel } from './components/favorites/FavoritesPanel';
import { VoiceControlModal } from './components/voice/VoiceControlModal';
import { DeviceDiscoveryModal } from './components/discovery/DeviceDiscoveryModal';
import { OfflineMediaVault } from './components/media/OfflineMediaVault';
import { CloudSyncModal } from './components/sync/CloudSyncModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { PwaInstallModal } from './components/common/PwaInstallModal';

import {
  TVDevice,
  RemoteCommand,
  FavoriteItem,
  TouchGestureSettings,
  AppTheme,
  CommandLog,
  OfflineMediaItem,
} from './types';
import { DEFAULT_FAVORITES } from './data/defaultFavorites';
import { tvConnectionManager } from './services/tvConnectionManager';
import { soundManager } from './utils/soundEffects';
import { getLocalConfig, saveLocalConfig } from './utils/indexedDb';

export default function App() {
  const [activeDevice, setActiveDevice] = useState<TVDevice | null>(null);
  const [pairedDevices, setPairedDevices] = useState<TVDevice[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>(DEFAULT_FAVORITES);
  const [activeMode, setActiveMode] = useState<'dpad' | 'touchpad' | 'numpad' | 'favorites'>('dpad');

  const [showSimulatedTV, setShowSimulatedTV] = useState<boolean>(true);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [showMediaModal, setShowMediaModal] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([]);

  const [theme, setTheme] = useState<AppTheme>('elegant_dark');
  const [gestureSettings, setGestureSettings] = useState<TouchGestureSettings>({
    swipeSensitivity: 5,
    vibrationFeedback: true,
    soundEffects: true,
    doubleTapAction: 'PLAY',
    longPressAction: 'MENU',
    twoFingerVerticalAction: 'VOLUME',
    swipeHoldRepeat: true,
  });

  // Load saved preferences & paired devices on startup
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const initData = async () => {
      const savedTheme = await getLocalConfig<AppTheme>('app_theme', 'elegant_dark');
      setTheme(savedTheme);

      const savedGestures = await getLocalConfig<TouchGestureSettings>('gesture_settings', gestureSettings);
      setGestureSettings(savedGestures);
      soundManager.setEnabled(savedGestures.soundEffects);

      const savedFavs = await getLocalConfig<FavoriteItem[]>('favorites_list', DEFAULT_FAVORITES);
      setFavorites(savedFavs);

      // Default mock paired devices
      const defaultDevices: TVDevice[] = [
        {
          id: 'tv-lg-livingroom',
          name: 'Living Room OLED TV',
          brand: 'lg',
          protocol: 'websocket',
          ipAddress: '192.168.1.105',
          port: 3000,
          paired: true,
          isOnline: true,
          lastSeen: new Date().toISOString(),
          state: {
            power: true,
            volume: 24,
            muted: false,
            channel: 7,
            channelName: 'BBC News HD',
            activeApp: 'Netflix',
            currentInput: 'HDMI 1 (Apple TV)',
            mediaState: 'playing',
            mediaTitle: 'Stranger Things',
          },
        },
        {
          id: 'tv-roku-bedroom',
          name: 'Bedroom Roku Express',
          brand: 'roku',
          protocol: 'http_rest',
          ipAddress: '192.168.1.112',
          port: 8060,
          paired: true,
          isOnline: true,
          lastSeen: new Date().toISOString(),
          state: {
            power: true,
            volume: 18,
            muted: false,
            channel: 12,
            channelName: 'Roku Channel',
            activeApp: 'YouTube',
            currentInput: 'Roku Home',
            mediaState: 'paused',
          },
        },
      ];

      const loadedDevices = await getLocalConfig<TVDevice[]>('paired_devices', defaultDevices);
      setPairedDevices(loadedDevices);

      if (loadedDevices.length > 0) {
        setActiveDevice(loadedDevices[0]);
        tvConnectionManager.setActiveDevice(loadedDevices[0]);
      }
    };

    initData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show Toast feedback
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2200);
  };

  // Dispatch Remote Commands
  const handleSendCommand = async (command: RemoteCommand) => {
    if (gestureSettings.vibrationFeedback) {
      soundManager.triggerHaptic(20);
    }
    if (gestureSettings.soundEffects) {
      soundManager.playClick();
    }

    const currentDev = activeDevice || pairedDevices[0];
    if (!currentDev) return;

    const { updatedState, logMessage } = await tvConnectionManager.sendCommand(command, currentDev);

    const updatedDev = { ...currentDev, state: updatedState };
    setActiveDevice(updatedDev);

    // Update list
    setPairedDevices((prev) =>
      prev.map((d) => (d.id === updatedDev.id ? updatedDev : d))
    );

    showToast(logMessage);

    // Append log
    const newLog: CommandLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      command,
      deviceName: currentDev.name,
      status: 'sent',
      details: logMessage,
    };

    setCommandLogs((prev) => [newLog, ...prev.slice(0, 19)]);
  };

  const handleExecuteVoiceActions = (actions: Array<{ type: string; value?: string }>) => {
    actions.forEach((act, i) => {
      setTimeout(() => {
        handleSendCommand({ type: act.type as any, value: act.value });
      }, i * 350);
    });
  };

  const handleCastMediaToTV = (mediaItem: OfflineMediaItem) => {
    handleSendCommand({
      type: 'LAUNCH_APP',
      value: `Media Player: ${mediaItem.title}`,
    });
    setShowMediaModal(false);
  };

  const handleAddDevice = (device: TVDevice) => {
    const updated = [device, ...pairedDevices.filter((d) => d.id !== device.id)];
    setPairedDevices(updated);
    saveLocalConfig('paired_devices', updated);
  };

  const handleAddFavorite = (fav: FavoriteItem) => {
    const updated = [fav, ...favorites];
    setFavorites(updated);
    saveLocalConfig('favorites_list', updated);
  };

  const handleDeleteFavorite = (id: string) => {
    const updated = favorites.filter((f) => f.id !== id);
    setFavorites(updated);
    saveLocalConfig('favorites_list', updated);
  };

  const handleSaveCloudSync = async (accountId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/sync/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          payload: {
            pairedDevices,
            favorites,
            theme,
            gestureSettings,
          },
        }),
      });
      const data = await res.json();
      return data.success;
    } catch (err) {
      return false;
    }
  };

  const handleLoadCloudSync = async (accountId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/sync/load?accountId=${encodeURIComponent(accountId)}`);
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.pairedDevices) setPairedDevices(data.data.pairedDevices);
        if (data.data.favorites) setFavorites(data.data.favorites);
        if (data.data.theme) setTheme(data.data.theme);
        if (data.data.gestureSettings) setGestureSettings(data.data.gestureSettings);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(
      { pairedDevices, favorites, theme, gestureSettings },
      null,
      2
    );
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omniremote-backup-${Date.now()}.json`;
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.pairedDevices) setPairedDevices(parsed.pairedDevices);
        if (parsed.favorites) setFavorites(parsed.favorites);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.gestureSettings) setGestureSettings(parsed.gestureSettings);
        showToast('Restored setup from JSON backup');
      } catch (err) {
        showToast('Invalid JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  // Theme Wrapper CSS
  const getThemeClass = () => {
    switch (theme) {
      case 'elegant_dark':
        return 'bg-[#050505] text-[#e0e0e0] selection:bg-blue-600 selection:text-white';
      case 'oled_black':
        return 'bg-black text-slate-100';
      case 'titanium_slate':
        return 'bg-slate-900 text-slate-100';
      case 'classic_ir':
        return 'bg-neutral-950 text-amber-200';
      case 'minimal_light':
        return 'bg-slate-100 text-slate-900';
      default:
        return 'bg-[#050505] text-[#e0e0e0]';
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col font-sans transition-colors ${getThemeClass()}`}>
      {/* Top Navigation Header */}
      <Header
        activeDevice={activeDevice}
        isOnline={isOnline}
        theme={theme}
        showSimulatedTV={showSimulatedTV}
        onToggleSimulatedTV={() => setShowSimulatedTV(!showSimulatedTV)}
        onOpenDiscovery={() => setShowDiscoveryModal(true)}
        onOpenVoice={() => setShowVoiceModal(true)}
        onOpenMedia={() => setShowMediaModal(true)}
        onOpenSync={() => setShowSyncModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenPwaModal={() => setShowPwaModal(true)}
        onQuickReconnect={() => {
          if (pairedDevices.length > 0) setActiveDevice(pairedDevices[0]);
        }}
      />

      {/* Main Responsive Canvas */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-4 flex flex-col gap-4 pb-12">
        {/* Interactive Simulated TV Screen Frame */}
        {showSimulatedTV && activeDevice && (
          <SimulatedTVScreen
            device={activeDevice}
            onClose={() => setShowSimulatedTV(false)}
          />
        )}

        {/* Toast Feedback Banner */}
        {toastMsg && (
          <div className="sticky top-16 z-30 mx-auto w-full max-w-sm px-4 py-2.5 rounded-2xl bg-blue-600/90 text-white text-xs font-bold shadow-xl shadow-blue-600/30 backdrop-blur-md flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-300 shrink-0" />
              <span>{toastMsg}</span>
            </div>
            <span className="text-[10px] font-mono text-blue-200">OK</span>
          </div>
        )}

        {/* Remote Control Mode Tab Selector */}
        <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-[#111111] border border-white/10 rounded-2xl shadow-lg max-w-md mx-auto w-full">
          {[
            { id: 'dpad', label: 'D-Pad', icon: Gamepad2 },
            { id: 'touchpad', label: 'Touchpad', icon: Hand },
            { id: 'numpad', label: 'Keypad', icon: Hash },
            { id: 'favorites', label: 'Launcher', icon: Sparkles },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  soundManager.playClick(800, 0.02);
                  setActiveMode(mode.id as any);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[11px] font-semibold">{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Remote Control Screen Panel */}
        <div className="w-full">
          {activeMode === 'dpad' && (
            <DPadRemote device={activeDevice} onSendCommand={handleSendCommand} />
          )}

          {activeMode === 'touchpad' && (
            <TouchpadRemote
              settings={gestureSettings}
              onSendCommand={handleSendCommand}
              onUpdateSettings={(s) => {
                setGestureSettings(s);
                saveLocalConfig('gesture_settings', s);
                soundManager.setEnabled(s.soundEffects);
              }}
            />
          )}

          {activeMode === 'numpad' && (
            <NumPadRemote onSendCommand={handleSendCommand} />
          )}

          {activeMode === 'favorites' && (
            <FavoritesPanel
              favorites={favorites}
              onSendCommand={handleSendCommand}
              onAddFavorite={handleAddFavorite}
              onDeleteFavorite={handleDeleteFavorite}
            />
          )}
        </div>

        {/* Diagnostic Command Logs Drawer */}
        {commandLogs.length > 0 && (
          <div className="mt-2 bg-[#111111] border border-white/10 rounded-2xl p-4 text-xs flex flex-col gap-2 max-w-md mx-auto w-full">
            <div className="flex items-center justify-between text-gray-400 text-[11px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-400" /> Recent Remote Logs
              </span>
              <span className="font-mono text-[10px] text-gray-500">{commandLogs.length} events</span>
            </div>
            <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-1 text-[11px] font-mono">
              {commandLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-500">{log.timestamp}</span>
                  <span className="font-bold text-blue-400">{log.command.type}</span>
                  <span className="text-green-400 truncate max-w-[120px]">{log.details}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer bar matching Elegant Dark design template */}
      <footer className="mt-auto border-t border-white/5 bg-[#050505] px-6 py-3.5 flex items-center justify-between text-[10px] text-gray-500 uppercase font-bold tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span>WebSocket Active</span>
        </div>
        <div className="hidden sm:block text-gray-600 uppercase font-medium">Remote Control • Web PWA</div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 font-mono">v2.4.1</span>
        </div>
      </footer>

      {/* Modals & Dialog Windows */}
      <VoiceControlModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        activeDevice={activeDevice}
        onExecuteActions={handleExecuteVoiceActions}
      />

      <DeviceDiscoveryModal
        isOpen={showDiscoveryModal}
        onClose={() => setShowDiscoveryModal(false)}
        devices={pairedDevices}
        activeDevice={activeDevice}
        onSelectDevice={(dev) => {
          setActiveDevice(dev);
          tvConnectionManager.setActiveDevice(dev);
          showToast(`Connected to ${dev.name}`);
        }}
        onAddDevice={handleAddDevice}
      />

      <OfflineMediaVault
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onCastMediaToTV={handleCastMediaToTV}
      />

      <CloudSyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onSaveCloudSync={handleSaveCloudSync}
        onLoadCloudSync={handleLoadCloudSync}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        theme={theme}
        onChangeTheme={(t) => {
          setTheme(t);
          saveLocalConfig('app_theme', t);
        }}
        gestureSettings={gestureSettings}
        onUpdateGestureSettings={(s) => {
          setGestureSettings(s);
          saveLocalConfig('gesture_settings', s);
          soundManager.setEnabled(s.soundEffects);
        }}
      />

      <PwaInstallModal
        isOpen={showPwaModal}
        onClose={() => setShowPwaModal(false)}
      />
    </div>
  );
}
