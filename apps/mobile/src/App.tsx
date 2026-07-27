import React, { useEffect } from "react";
import { StatusBar, LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppNavigator } from "./navigation";
import { useRemoteStore } from "./store";
import { localStorageService } from "./services/LocalStorage";

LogBox.ignoreLogs(["Reanimated", "Non-serializable"]);

export default function App() {
  const setPairedDevices = useRemoteStore((s) => s.setPairedDevices);
  const setFavorites = useRemoteStore((s) => s.setFavorites);
  const setTheme = useRemoteStore((s) => s.setTheme);
  const setGestureSettings = useRemoteStore((s) => s.setGestureSettings);
  const setActiveDevice = useRemoteStore((s) => s.setActiveDevice);

  useEffect(() => {
    (async () => {
      const devices = await localStorageService.loadDevices();
      const favorites = await localStorageService.loadFavorites();
      const theme = await localStorageService.loadTheme();
      const gestures = await localStorageService.loadGestureSettings();

      setPairedDevices(devices);
      setFavorites(favorites);
      setTheme(theme);
      setGestureSettings(gestures);

      if (devices.length > 0 && !useRemoteStore.getState().activeDevice) {
        setActiveDevice(devices[0]);
      }
    })();
  }, []);

  useEffect(() => {
    const unsubDevices = useRemoteStore.subscribe(
      (state) => { localStorageService.saveDevices(state.pairedDevices); },
    );
    const unsubFavorites = useRemoteStore.subscribe(
      (state) => { localStorageService.saveFavorites(state.favorites); },
    );
    const unsubTheme = useRemoteStore.subscribe(
      (state) => { localStorageService.saveTheme(state.theme); },
    );
    const unsubGestures = useRemoteStore.subscribe(
      (state) => { localStorageService.saveGestureSettings(state.gestureSettings); },
    );

    return () => {
      unsubDevices();
      unsubFavorites();
      unsubTheme();
      unsubGestures();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#050505" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
