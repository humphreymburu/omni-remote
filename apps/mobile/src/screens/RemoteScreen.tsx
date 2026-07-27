import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Vibration } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRemoteStore } from "../store";
import { DPadRemote } from "../components/remote/DPadRemote";
import { TouchpadRemote } from "../components/touchpad/TouchpadRemote";
import { NumPadRemote } from "../components/remote/NumPadRemote";
import { commandDispatcher } from "../services/CommandDispatcher";
import type { RemoteCommand } from "@omni-remote/core";

const MODES = [
  { id: "dpad" as const, label: "D-Pad" },
  { id: "touchpad" as const, label: "Touch" },
  { id: "numpad" as const, label: "Keypad" },
  { id: "favorites" as const, label: "Apps" },
];

export function RemoteScreen() {
  const insets = useSafeAreaInsets();
  const activeDevice = useRemoteStore((s) => s.activeDevice);
  const pairedDevices = useRemoteStore((s) => s.pairedDevices);
  const activeMode = useRemoteStore((s) => s.activeMode);
  const setActiveMode = useRemoteStore((s) => s.setActiveMode);
  const gestureSettings = useRemoteStore((s) => s.gestureSettings);
  const appendCommandLog = useRemoteStore((s) => s.appendCommandLog);
  const setToastMessage = useRemoteStore((s) => s.setToastMessage);

  const device = activeDevice || pairedDevices[0];

  const handleSendCommand = useCallback(async (command: RemoteCommand) => {
    if (!device) {
      setToastMessage("Select a TV first");
      return;
    }

    if (gestureSettings.vibrationFeedback) {
      Vibration.vibrate(10);
    }

    const success = await commandDispatcher.execute(device, command);

    appendCommandLog({
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      command,
      deviceName: device.name,
      status: success ? "sent" : "failed",
    });

    setToastMessage(success ? `${command.key} sent` : "Command failed");
  }, [device, gestureSettings, appendCommandLog, setToastMessage]);

  const currentDevice = device;
  const currentSettings = gestureSettings;

  const remoteContent = useMemo(() => {
    switch (activeMode) {
      case "dpad":
        return <DPadRemote onSendCommand={handleSendCommand} />;
      case "touchpad":
        return (
          <TouchpadRemote
            settings={currentSettings}
            onSendCommand={handleSendCommand}
          />
        );
      case "numpad":
        return <NumPadRemote onSendCommand={handleSendCommand} />;
      case "favorites":
        return null;
    }
  }, [activeMode, handleSendCommand, currentSettings]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {currentDevice?.name || "No TV Selected"}
        </Text>
        <Text style={styles.subtitle}>
          {currentDevice?.platform || ""}
          {currentDevice?.ipAddress ? ` - ${currentDevice.ipAddress}` : ""}
        </Text>
      </View>

      <View style={styles.modeTabs}>
        {MODES.map((mode) => (
          <Pressable
            key={mode.id}
            style={[
              styles.modeTab,
              activeMode === mode.id && styles.modeTabActive,
            ]}
            onPress={() => setActiveMode(mode.id)}
          >
            <Text
              style={[
                styles.modeTabText,
                activeMode === mode.id && styles.modeTabTextActive,
              ]}
            >
              {mode.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.remoteContainer}>
        {remoteContent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  title: {
    color: "#e0e0e0",
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  modeTabs: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 3,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  modeTabActive: {
    backgroundColor: "#3b82f6",
  },
  modeTabText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
  },
  modeTabTextActive: {
    color: "#fff",
  },
  remoteContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
