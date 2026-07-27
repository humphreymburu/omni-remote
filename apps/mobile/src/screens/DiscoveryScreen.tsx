import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRemoteStore } from "../store";
import {
  DiscoveryEngine,
  SSDPMulticastDiscovery,
  MDNSDiscovery,
  SavedDeviceProbe,
  identifyDevice,
  detectCapabilities,
} from "@omni-remote/discovery";
import type {
  TvDevice,
  TvPlatform,
  DiscoveryMethod,
} from "@omni-remote/core";

type Tab = "scan" | "manual";

const PLATFORMS: { label: string; value: TvPlatform }[] = [
  { label: "Roku", value: "roku" },
  { label: "LG webOS", value: "lg-webos" },
  { label: "Samsung Tizen", value: "samsung-tizen" },
  { label: "Android TV", value: "android-tv" },
  { label: "Google Cast", value: "google-cast" },
  { label: "Unknown", value: "unknown" },
];

export function DiscoveryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const addPairedDevice = useRemoteStore((s) => s.addPairedDevice);
  const pairedDevices = useRemoteStore((s) => s.pairedDevices);

  const [tab, setTab] = useState<Tab>("scan");
  const [scanning, setScanning] = useState(false);
  const [discovered, setDiscovered] = useState<TvDevice[]>([]);

  const [manualName, setManualName] = useState("");
  const [manualIp, setManualIp] = useState("");
  const [manualPlatform, setManualPlatform] = useState<TvPlatform>("roku");

  const engine = React.useRef(new DiscoveryEngine());

  const startScan = useCallback(async () => {
    setScanning(true);
    setDiscovered([]);

    engine.current.setStrategies([
      new SSDPMulticastDiscovery(),
      new MDNSDiscovery(),
      new SavedDeviceProbe(pairedDevices),
    ]);

    try {
      const results = await engine.current.start(5000);
      const devices = results
        .filter((r) => r.device)
        .map((r) => r.device);
      setDiscovered(devices);
    } catch (err) {
      console.warn("Discovery error:", err);
    } finally {
      setScanning(false);
    }
  }, [pairedDevices]);

  useEffect(() => {
    return () => {
      engine.current.stop();
    };
  }, []);

  const handleAddDiscovered = useCallback(
    async (device: TvDevice) => {
      const idResult = identifyDevice({
        ipAddress: device.ipAddress,
        ssdpHeaders: { SERVER: device.manufacturer || "" },
      });

      const platform = idResult.platform !== "unknown"
        ? idResult.platform
        : device.platform;

      const caps = await detectCapabilities(device.ipAddress, platform);

      const full: TvDevice = {
        ...device,
        id: device.id || `tv-${Date.now()}`,
        platform,
        capabilities: caps,
        pairingStatus: "unpaired",
        discoveredBy: [...device.discoveredBy, "ssdp" as DiscoveryMethod],
        lastConnectedAt: new Date().toISOString(),
      };

      addPairedDevice(full);
      Alert.alert("Device Added", `${device.name} has been added.`);
    },
    [addPairedDevice],
  );

  const handleAddManual = useCallback(() => {
    if (!manualIp.trim()) {
      Alert.alert("Error", "Please enter an IP address");
      return;
    }

    const device: TvDevice = {
      id: `tv-manual-${Date.now()}`,
      name: manualName.trim() || `TV (${manualIp})`,
      platform: manualPlatform,
      ipAddress: manualIp,
      discoveredBy: ["manual"],
      capabilities: {
        navigation: true,
        volume: true,
        channels: true,
        powerOff: true,
        powerOn: false,
        textInput: true,
        appLaunching: true,
        mediaControls: true,
        mediaCasting: false,
      },
      pairingStatus: "unpaired",
      lastConnectedAt: new Date().toISOString(),
    };

    addPairedDevice(device);
    Alert.alert("Device Added", `${device.name} has been added.`);
    setManualIp("");
    setManualName("");
  }, [manualIp, manualName, manualPlatform, addPairedDevice]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, tab === "scan" && styles.tabActive]}
          onPress={() => setTab("scan")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "scan" && styles.tabTextActive,
            ]}
          >
            Scan Network
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "manual" && styles.tabActive]}
          onPress={() => setTab("manual")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "manual" && styles.tabTextActive,
            ]}
          >
            Manual IP
          </Text>
        </Pressable>
      </View>

      {tab === "scan" ? (
        <View style={styles.scanTab}>
          <Pressable
            style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
            onPress={startScan}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.scanButtonText}>Start Scan</Text>
            )}
          </Pressable>

          <FlatList
            data={discovered}
            keyExtractor={(item, idx) => `${item.ipAddress}-${idx}`}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.deviceItem}>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{item.name}</Text>
                  <Text style={styles.deviceIp}>{item.ipAddress}</Text>
                  <Text style={styles.devicePlatform}>{item.platform}</Text>
                </View>
                <Pressable
                  style={styles.addDeviceButton}
                  onPress={() => handleAddDiscovered(item)}
                >
                  <Text style={styles.addDeviceText}>Add</Text>
                </Pressable>
              </View>
            )}
            ListEmptyComponent={
              !scanning ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    Tap "Start Scan" to discover TVs
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      ) : (
        <View style={styles.manualTab}>
          <Text style={styles.fieldLabel}>Device Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Living Room TV"
            placeholderTextColor="#444"
            value={manualName}
            onChangeText={setManualName}
          />

          <Text style={styles.fieldLabel}>IP Address</Text>
          <TextInput
            style={styles.input}
            placeholder="192.168.1.100"
            placeholderTextColor="#444"
            value={manualIp}
            onChangeText={setManualIp}
            keyboardType="decimal-pad"
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>TV Platform</Text>
          <View style={styles.platformRow}>
            {PLATFORMS.map((p) => (
              <Pressable
                key={p.value}
                style={[
                  styles.platformChip,
                  manualPlatform === p.value && styles.platformChipActive,
                ]}
                onPress={() => setManualPlatform(p.value)}
              >
                <Text
                  style={[
                    styles.platformChipText,
                    manualPlatform === p.value &&
                      styles.platformChipTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.addManualButton} onPress={handleAddManual}>
            <Text style={styles.addManualText}>Add Device</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 12,
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 3,
    marginTop: 12,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 12 },
  tabActive: { backgroundColor: "#3b82f6" },
  tabText: { color: "#666", fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  scanTab: { flex: 1, padding: 16 },
  scanButton: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  scanButtonDisabled: { opacity: 0.5 },
  scanButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  listContent: { gap: 8 },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  deviceInfo: { flex: 1 },
  deviceName: { color: "#e0e0e0", fontSize: 15, fontWeight: "600" },
  deviceIp: { color: "#666", fontSize: 12, marginTop: 2 },
  devicePlatform: { color: "#3b82f6", fontSize: 11, marginTop: 2 },
  addDeviceButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addDeviceText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: "#444", fontSize: 15 },
  manualTab: { padding: 16 },
  fieldLabel: {
    color: "#888",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 14,
    color: "#e0e0e0",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#222",
  },
  platformRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  platformChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
  },
  platformChipActive: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  platformChipText: { color: "#666", fontSize: 12, fontWeight: "600" },
  platformChipTextActive: { color: "#fff" },
  addManualButton: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 24,
  },
  addManualText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
