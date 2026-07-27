import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Vibration,
} from "react-native";
import type { RemoteCommand, RemoteKey } from "@omni-remote/core";

interface Props {
  onSendCommand: (command: RemoteCommand) => void;
}

interface PadButton {
  key: RemoteKey;
  label: string;
  row: "top" | "mid" | "bot" | "side";
  col?: "left" | "right" | "center";
  size?: "small" | "large";
}

export function DPadRemote({ onSendCommand }: Props) {
  const repeatTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const send = useCallback(
    (key: RemoteKey) => onSendCommand({ key }),
    [onSendCommand],
  );

  const startRepeat = useCallback(
    (key: RemoteKey) => {
      send(key);
      const timer = setInterval(() => {
        Vibration.vibrate(5);
        send(key);
      }, 200);
      repeatTimers.current.set(key, timer);
    },
    [send],
  );

  const stopRepeat = useCallback((key: RemoteKey) => {
    const timer = repeatTimers.current.get(key);
    if (timer) {
      clearInterval(timer);
      repeatTimers.current.delete(key);
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Power / Mute / Input Bar */}
      <View style={styles.topBar}>
        <PadButton
          label="⏻"
          onPress={() => send("POWER")}
          color="#ef4444"
        />
        <PadButton
          label="🔇"
          onPress={() => send("MUTE")}
          color="#f59e0b"
        />
        <PadButton
          label="SOURCE"
          onPress={() => send("INPUT")}
          color="#3b82f6"
          wide
        />
      </View>

      {/* D-Pad + Side Controls */}
      <View style={styles.mainRow}>
        {/* Volume */}
        <View style={styles.sideControls}>
          <PadButton label="+" onPress={() => send("VOLUME_UP")} />
          <View style={styles.sideLabel}>
            <Text style={styles.sideLabelText}>VOL</Text>
          </View>
          <PadButton label="−" onPress={() => send("VOLUME_DOWN")} />
        </View>

        {/* D-Pad */}
        <View style={styles.dpad}>
          <View style={styles.dpadRow}>
            <View style={styles.dpadPlaceholder} />
            <PadButton
              label="▲"
              onPressIn={() => startRepeat("UP")}
              onPressOut={() => stopRepeat("UP")}
              dpad
            />
            <View style={styles.dpadPlaceholder} />
          </View>
          <View style={styles.dpadRow}>
            <PadButton
              label="◀"
              onPressIn={() => startRepeat("LEFT")}
              onPressOut={() => stopRepeat("LEFT")}
              dpad
            />
            <PadButton label="●" onPress={() => send("SELECT")} dpad center />
            <PadButton
              label="▶"
              onPressIn={() => startRepeat("RIGHT")}
              onPressOut={() => stopRepeat("RIGHT")}
              dpad
            />
          </View>
          <View style={styles.dpadRow}>
            <View style={styles.dpadPlaceholder} />
            <PadButton
              label="▼"
              onPressIn={() => startRepeat("DOWN")}
              onPressOut={() => stopRepeat("DOWN")}
              dpad
            />
            <View style={styles.dpadPlaceholder} />
          </View>
        </View>

        {/* Channel */}
        <View style={styles.sideControls}>
          <PadButton label="▲" onPress={() => send("CHANNEL_UP")} />
          <View style={styles.sideLabel}>
            <Text style={styles.sideLabelText}>CH</Text>
          </View>
          <PadButton label="▼" onPress={() => send("CHANNEL_DOWN")} />
        </View>
      </View>

      {/* Nav Bar */}
      <View style={styles.navBar}>
        <PadButton label="BACK" onPress={() => send("BACK")} wide />
        <PadButton label="HOME" onPress={() => send("HOME")} wide />
        <PadButton label="MENU" onPress={() => send("MENU")} />
      </View>

      {/* Media Controls */}
      <View style={styles.mediaRow}>
        {(["REWIND", "PLAY", "PAUSE", "STOP", "FAST_FORWARD"] as RemoteKey[]).map(
          (key) => (
            <PadButton
              key={key}
              label={key === "REWIND" ? "⏪" : key === "PLAY" ? "▶" : key === "PAUSE" ? "⏸" : key === "STOP" ? "⏹" : "⏩"}
              onPress={() => send(key)}
            />
          ),
        )}
      </View>

      {/* Color Buttons */}
      <View style={styles.colorRow}>
        {(["COLOR_RED", "COLOR_GREEN", "COLOR_YELLOW", "COLOR_BLUE"] as RemoteKey[]).map(
          (key) => (
            <PadButton
              key={key}
              label={key === "COLOR_RED" ? "R" : key === "COLOR_GREEN" ? "G" : key === "COLOR_YELLOW" ? "Y" : "B"}
              onPress={() => send(key)}
              color={
                key === "COLOR_RED"
                  ? "#ef4444"
                  : key === "COLOR_GREEN"
                  ? "#22c55e"
                  : key === "COLOR_YELLOW"
                  ? "#eab308"
                  : "#3b82f6"
              }
            />
          ),
        )}
      </View>
    </View>
  );
}

function PadButton({
  label,
  onPress,
  onPressIn,
  onPressOut,
  color,
  wide,
  dpad,
  center,
}: {
  label: string;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  color?: string;
  wide?: boolean;
  dpad?: boolean;
  center?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.padButton,
        wide && styles.padButtonWide,
        dpad && styles.padButtonDpad,
        center && styles.padButtonCenter,
        color && { backgroundColor: color + "22", borderColor: color },
        pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] },
      ]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Text
        style={[
          styles.padButtonText,
          color && { color },
          center && { color: "#fff", fontSize: 18 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  topBar: { flexDirection: "row", gap: 8 },
  mainRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sideControls: { alignItems: "center", gap: 4, width: 50 },
  sideLabel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  sideLabelText: { color: "#666", fontSize: 10, fontWeight: "700" },
  dpad: { flex: 1, aspectRatio: 1, gap: 4 },
  dpadRow: { flexDirection: "row", justifyContent: "center", gap: 4 },
  dpadPlaceholder: { width: 64 },
  navBar: { flexDirection: "row", gap: 8 },
  mediaRow: { flexDirection: "row", justifyContent: "space-around", gap: 6 },
  colorRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  padButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  padButtonWide: { flex: 1.5 },
  padButtonDpad: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#1a1a1a",
  },
  padButtonCenter: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  padButtonText: {
    color: "#e0e0e0",
    fontSize: 16,
    fontWeight: "600",
  },
});
