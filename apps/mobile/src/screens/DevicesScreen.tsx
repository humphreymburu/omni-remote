import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRemoteStore } from "../store";
import { pairingManager } from "../services/PairingManager";
import { commandDispatcher } from "../services/CommandDispatcher";
import type { TvDevice } from "@omni-remote/core";

export function DevicesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const pairedDevices = useRemoteStore((s) => s.pairedDevices);
  const activeDevice = useRemoteStore((s) => s.activeDevice);
  const setActiveDevice = useRemoteStore((s) => s.setActiveDevice);
  const removePairedDevice = useRemoteStore((s) => s.removePairedDevice);

  const handleSelectDevice = useCallback(async (device: TvDevice) => {
    try {
      await pairingManager.reconnect(device);
      setActiveDevice(device);
    } catch {
      Alert.alert("Connection Failed", `Could not connect to ${device.name}`);
    }
  }, [setActiveDevice]);

  const handleRemoveDevice = useCallback((device: TvDevice) => {
    Alert.alert(
      "Remove Device",
      `Remove ${device.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await commandDispatcher.removeAdapter(device.id);
            removePairedDevice(device.id);
          },
        },
      ],
    );
  }, [removePairedDevice]);

  const renderDevice = useCallback(
    ({ item }: { item: TvDevice }) => {
      const isActive = activeDevice?.id === item.id;
      return (
        <Pressable
          style={[styles.deviceItem, isActive && styles.deviceItemActive]}
          onPress={() => handleSelectDevice(item)}
          onLongPress={() => handleRemoveDevice(item)}
        >
          <View style={styles.deviceInfo}>
            <View style={styles.deviceHeader}>
              <Text style={styles.deviceName}>{item.name}</Text>
              {isActive && <View style={styles.activeBadge} />}
            </View>
            <Text style={styles.deviceDetails}>
              {item.platform} - {item.ipAddress}
            </Text>
            <Text style={styles.deviceDetails}>
              Paired: {item.pairingStatus === "paired" ? "Yes" : "No"}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      );
    },
    [activeDevice, handleSelectDevice, handleRemoveDevice],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Devices</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate("Discovery")}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={pairedDevices}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Devices</Text>
            <Text style={styles.emptySubtitle}>
              Tap + Add to discover TVs on your network
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  title: {
    color: "#e0e0e0",
    fontSize: 24,
    fontWeight: "700",
  },
  addButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
  },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  deviceItemActive: {
    borderColor: "#3b82f6",
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deviceName: {
    color: "#e0e0e0",
    fontSize: 16,
    fontWeight: "600",
  },
  activeBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  deviceDetails: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    color: "#444",
    fontSize: 24,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    color: "#666",
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtitle: {
    color: "#444",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
