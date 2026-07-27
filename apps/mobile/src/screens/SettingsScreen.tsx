import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRemoteStore } from "../store";
import type { AppTheme } from "@omni-remote/core";

const THEMES: { id: AppTheme; label: string; color: string }[] = [
  { id: "elegant_dark", label: "Elegant Dark", color: "#050505" },
  { id: "oled_black", label: "OLED Black", color: "#000" },
  { id: "titanium_slate", label: "Titanium", color: "#0f172a" },
  { id: "classic_ir", label: "Classic IR", color: "#1c1917" },
  { id: "minimal_light", label: "Minimal Light", color: "#f1f5f9" },
];

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useRemoteStore((s) => s.theme);
  const setTheme = useRemoteStore((s) => s.setTheme);
  const gestureSettings = useRemoteStore((s) => s.gestureSettings);
  const setGestureSettings = useRemoteStore((s) => s.setGestureSettings);

  const toggleVibration = useCallback(
    (val: boolean) =>
      setGestureSettings({ ...gestureSettings, vibrationFeedback: val }),
    [gestureSettings, setGestureSettings],
  );

  const toggleSound = useCallback(
    (val: boolean) =>
      setGestureSettings({ ...gestureSettings, soundEffects: val }),
    [gestureSettings, setGestureSettings],
  );

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <View style={styles.themeGrid}>
          {THEMES.map((t) => (
            <Pressable
              key={t.id}
              style={[
                styles.themeItem,
                { backgroundColor: t.color },
                theme === t.id && styles.themeItemActive,
              ]}
              onPress={() => setTheme(t.id)}
            >
              <Text
                style={[
                  styles.themeLabel,
                  t.id === "minimal_light"
                    ? { color: "#000" }
                    : { color: "#e0e0e0" },
                ]}
              >
                {t.label}
              </Text>
              {theme === t.id && (
                <Text
                  style={[
                    styles.themeCheck,
                    t.id === "minimal_light" ? { color: "#000" } : null,
                  ]}
                >
                  ✓
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feedback</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Haptic Vibration</Text>
          <Switch
            value={gestureSettings.vibrationFeedback}
            onValueChange={toggleVibration}
            trackColor={{ false: "#222", true: "#3b82f6" }}
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Sound Effects</Text>
          <Switch
            value={gestureSettings.soundEffects}
            onValueChange={toggleSound}
            trackColor={{ false: "#222", true: "#3b82f6" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Swipe Sensitivity</Text>
        <View style={styles.sensitivityRow}>
          {[1, 3, 5, 7, 10].map((val) => (
            <Pressable
              key={val}
              style={[
                styles.sensitivityDot,
                gestureSettings.swipeSensitivity === val &&
                  styles.sensitivityDotActive,
              ]}
              onPress={() =>
                setGestureSettings({
                  ...gestureSettings,
                  swipeSensitivity: val,
                })
              }
            >
              <Text
                style={[
                  styles.sensitivityText,
                  gestureSettings.swipeSensitivity === val &&
                    styles.sensitivityTextActive,
                ]}
              >
                {val}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  content: { paddingBottom: 40 },
  title: {
    color: "#e0e0e0",
    fontSize: 24,
    fontWeight: "700",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    color: "#888",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  themeItem: {
    width: "47%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  themeItemActive: { borderColor: "#3b82f6" },
  themeLabel: { fontSize: 13, fontWeight: "600" },
  themeCheck: {
    position: "absolute",
    top: 8,
    right: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#3b82f6",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  settingLabel: { color: "#e0e0e0", fontSize: 15 },
  sensitivityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sensitivityDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  sensitivityDotActive: { backgroundColor: "#3b82f6" },
  sensitivityText: { color: "#666", fontWeight: "600" },
  sensitivityTextActive: { color: "#fff" },
});
