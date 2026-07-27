import type {
  TvDevice,
  FavoriteItem,
  AppTheme,
  TouchGestureSettings,
  OfflineMediaItem,
} from "@omni-remote/core";

const KEYS = {
  PAIRED_DEVICES: "omni_paired_devices",
  FAVORITES: "omni_favorites",
  THEME: "omni_theme",
  GESTURE_SETTINGS: "omni_gesture_settings",
} as const;

async function getItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("[LocalStorage] setItem failed:", err);
  }
}

export const localStorageService = {
  async saveDevices(devices: TvDevice[]): Promise<void> {
    const safe = devices.map((d) => ({
      ...d,
      state: undefined,
    }));
    await setItem(KEYS.PAIRED_DEVICES, safe);
  },

  async loadDevices(): Promise<TvDevice[]> {
    return getItem<TvDevice[]>(KEYS.PAIRED_DEVICES, []);
  },

  async saveFavorites(favorites: FavoriteItem[]): Promise<void> {
    await setItem(KEYS.FAVORITES, favorites);
  },

  async loadFavorites(): Promise<FavoriteItem[]> {
    return getItem<FavoriteItem[]>(KEYS.FAVORITES, []);
  },

  async saveTheme(theme: AppTheme): Promise<void> {
    await setItem(KEYS.THEME, theme);
  },

  async loadTheme(): Promise<AppTheme> {
    return getItem<AppTheme>(KEYS.THEME, "elegant_dark");
  },

  async saveGestureSettings(settings: TouchGestureSettings): Promise<void> {
    await setItem(KEYS.GESTURE_SETTINGS, settings);
  },

  async loadGestureSettings(): Promise<TouchGestureSettings> {
    return getItem<TouchGestureSettings>(KEYS.GESTURE_SETTINGS, {
      swipeSensitivity: 5,
      vibrationFeedback: true,
      soundEffects: true,
      doubleTapAction: "SELECT",
      longPressAction: "MENU",
      twoFingerVerticalAction: "VOLUME",
      swipeHoldRepeat: true,
    } as TouchGestureSettings);
  },
};
