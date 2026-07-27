import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRemoteStore } from "../store";
import { commandDispatcher } from "../services/CommandDispatcher";
import type {
  FavoriteItem,
  RemoteCommand,
  RemoteKey,
} from "@omni-remote/core";

const CATEGORIES = ["all", "app", "channel", "media", "macro"] as const;

function renderIcon(name: string): string {
  const icons: Record<string, string> = {
    netflix: "🎬",
    youtube: "▶️",
    disney: "🏰",
    prime: "📦",
    spotify: "🎵",
    appletv: "🍎",
    hbo: "🟣",
    twitch: "🟣",
    bbc: "📺",
    cnn: "📰",
    espn: "⚽",
    hdmi1: "📡",
    hdmi2: "🎮",
    macro: "⚡",
    tv: "📺",
    music: "🎵",
    movie: "🎬",
    game: "🎮",
  };
  return icons[name.toLowerCase()] || "📱";
}

export function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const favorites = useRemoteStore((s) => s.favorites);
  const addFavorite = useRemoteStore((s) => s.addFavorite);
  const removeFavorite = useRemoteStore((s) => s.removeFavorite);
  const activeDevice = useRemoteStore((s) => s.activeDevice);

  const [category, setCategory] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newChannel, setNewChannel] = useState("");

  const filtered = category === "all"
    ? favorites
    : favorites.filter((f) => f.category === category);

  const handleLaunch = useCallback(
    async (item: FavoriteItem) => {
      if (!activeDevice) return;
      await commandDispatcher.execute(activeDevice, item.action);
    },
    [activeDevice],
  );

  const handleAdd = useCallback(() => {
    if (!newTitle.trim()) return;
    const fav: FavoriteItem = {
      id: `fav-${Date.now()}`,
      title: newTitle,
      category: newChannel ? "channel" : "app",
      iconName: newTitle.toLowerCase(),
      action: {
        key: (newChannel ? "CHANNEL_DOWN" : "HOME") as RemoteKey,
        value: newChannel || newTitle,
      },
      channelNumber: newChannel ? parseInt(newChannel) : undefined,
    };
    addFavorite(fav);
    setNewTitle("");
    setNewChannel("");
    setShowAdd(false);
  }, [newTitle, newChannel, addFavorite]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Pressable style={styles.addButton} onPress={() => setShowAdd(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.categoryTab,
              category === cat && styles.categoryTabActive,
            ]}
            onPress={() => setCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                category === cat && styles.categoryTextActive,
              ]}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <Pressable
            style={styles.favoriteItem}
            onPress={() => handleLaunch(item)}
            onLongPress={() => removeFavorite(item.id)}
          >
            <View
              style={[
                styles.favoriteIcon,
                item.brandColor
                  ? { backgroundColor: item.brandColor + "33" }
                  : null,
              ]}
            >
              <Text style={styles.favoriteEmoji}>
                {renderIcon(item.iconName)}
              </Text>
            </View>
            <Text style={styles.favoriteTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No favorites yet</Text>
          </View>
        }
      />

      <Modal visible={showAdd} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Favorite</Text>
            <TextInput
              style={styles.input}
              placeholder="Name (e.g. Netflix)"
              placeholderTextColor="#444"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Channel number (optional)"
              placeholderTextColor="#444"
              value={newChannel}
              onChangeText={setNewChannel}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowAdd(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleAdd}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  title: { color: "#e0e0e0", fontSize: 24, fontWeight: "700" },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: { color: "#fff", fontSize: 20, fontWeight: "600" },
  categoryRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#111",
  },
  categoryTabActive: { backgroundColor: "#3b82f6" },
  categoryText: { color: "#666", fontSize: 12, fontWeight: "600" },
  categoryTextActive: { color: "#fff" },
  grid: { padding: 12 },
  favoriteItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    margin: 4,
    backgroundColor: "#111",
    borderRadius: 14,
    maxWidth: "30%",
  },
  favoriteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  favoriteEmoji: { fontSize: 22 },
  favoriteTitle: {
    color: "#e0e0e0",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: "#444", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 40,
  },
  modal: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: { color: "#e0e0e0", fontSize: 18, fontWeight: "700", marginBottom: 16 },
  input: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 14,
    color: "#e0e0e0",
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#222",
    alignItems: "center",
  },
  cancelText: { color: "#666", fontWeight: "600" },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#3b82f6",
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "600" },
});
