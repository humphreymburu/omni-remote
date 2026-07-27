import { create } from "zustand";
import type {
  TvDevice,
  RemoteCommand,
  FavoriteItem,
  TouchGestureSettings,
  AppTheme,
  CommandLog,
  OfflineMediaItem,
  RemoteKey,
} from "@omni-remote/core";

interface RemoteState {
  activeDevice: TvDevice | null;
  pairedDevices: TvDevice[];
  favorites: FavoriteItem[];
  activeMode: "dpad" | "touchpad" | "numpad" | "favorites";
  theme: AppTheme;
  gestureSettings: TouchGestureSettings;
  commandLogs: CommandLog[];
  isOnline: boolean;
  toastMessage: string;

  setActiveDevice: (device: TvDevice | null) => void;
  setPairedDevices: (devices: TvDevice[]) => void;
  addPairedDevice: (device: TvDevice) => void;
  removePairedDevice: (id: string) => void;
  setFavorites: (favorites: FavoriteItem[]) => void;
  addFavorite: (fav: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  setActiveMode: (mode: "dpad" | "touchpad" | "numpad" | "favorites") => void;
  setTheme: (theme: AppTheme) => void;
  setGestureSettings: (settings: TouchGestureSettings) => void;
  setIsOnline: (online: boolean) => void;
  appendCommandLog: (log: CommandLog) => void;
  setToastMessage: (msg: string) => void;
}

const DEFAULT_GESTURE_SETTINGS: TouchGestureSettings = {
  swipeSensitivity: 5,
  vibrationFeedback: true,
  soundEffects: true,
  doubleTapAction: "SELECT" as RemoteKey,
  longPressAction: "MENU" as RemoteKey,
  twoFingerVerticalAction: "VOLUME",
  swipeHoldRepeat: true,
};

export const useRemoteStore = create<RemoteState>((set) => ({
  activeDevice: null,
  pairedDevices: [],
  favorites: [],
  activeMode: "dpad",
  theme: "elegant_dark",
  gestureSettings: DEFAULT_GESTURE_SETTINGS,
  commandLogs: [],
  isOnline: true,
  toastMessage: "",

  setActiveDevice: (device) => set({ activeDevice: device }),
  setPairedDevices: (devices) => set({ pairedDevices: devices }),
  addPairedDevice: (device) =>
    set((state) => ({
      pairedDevices: [device, ...state.pairedDevices.filter((d) => d.id !== device.id)],
    })),
  removePairedDevice: (id) =>
    set((state) => ({
      pairedDevices: state.pairedDevices.filter((d) => d.id !== id),
    })),
  setFavorites: (favorites) => set({ favorites }),
  addFavorite: (fav) =>
    set((state) => ({ favorites: [fav, ...state.favorites] })),
  removeFavorite: (id) =>
    set((state) => ({ favorites: state.favorites.filter((f) => f.id !== id) })),
  setActiveMode: (mode) => set({ activeMode: mode }),
  setTheme: (theme) => set({ theme }),
  setGestureSettings: (settings) => set({ gestureSettings: settings }),
  setIsOnline: (online) => set({ isOnline: online }),
  appendCommandLog: (log) =>
    set((state) => ({
      commandLogs: [log, ...state.commandLogs.slice(0, 49)],
    })),
  setToastMessage: (msg) => set({ toastMessage: msg }),
}));
