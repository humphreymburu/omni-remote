import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { RemoteCommand, RemoteKey } from "@omni-remote/core";

interface Props {
  onSendCommand: (command: RemoteCommand) => void;
}

const KEYS: RemoteKey[] = [
  "NUM_1", "NUM_2", "NUM_3",
  "NUM_4", "NUM_5", "NUM_6",
  "NUM_7", "NUM_8", "NUM_9",
  "NUM_0",
];

export function NumPadRemote({ onSendCommand }: Props) {
  const [buffer, setBuffer] = useState("");

  const pressKey = useCallback(
    (key: RemoteKey) => {
      onSendCommand({ key });
      setBuffer((prev) => {
        const next = prev + key.replace("NUM_", "");
        return next.length > 4 ? next.slice(-4) : next;
      });
    },
    [onSendCommand],
  );

  const sendChannel = useCallback(() => {
    if (buffer) {
      onSendCommand({ key: "CHANNEL_DOWN", value: parseInt(buffer) });
      setBuffer("");
    }
  }, [buffer, onSendCommand]);

  const clear = useCallback(() => {
    setBuffer("");
    onSendCommand({ key: "BACK" });
  }, [onSendCommand]);

  return (
    <View style={styles.container}>
      <View style={styles.bufferRow}>
        <View style={styles.buffer}>
          <Text style={styles.bufferText}>
            {buffer.padEnd(4, "─").split("").join(" ")}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {KEYS.map((key) => (
          <Pressable
            key={key}
            style={({ pressed }) => [
              styles.numButton,
              pressed && { opacity: 0.6 },
            ]}
            onPress={() => pressKey(key)}
          >
            <Text style={styles.numText}>
              {key.replace("NUM_", "")}
            </Text>
          </Pressable>
        ))}
        <Pressable
          style={({ pressed }) => [
            styles.numButton,
            styles.clearButton,
            pressed && { opacity: 0.6 },
          ]}
          onPress={clear}
        >
          <Text style={styles.clearText}>CLR</Text>
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.actionButton}
          onPress={sendChannel}
        >
          <Text style={styles.actionText}>GO TO CHANNEL</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  bufferRow: { alignItems: "center" },
  buffer: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    minWidth: 180,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  bufferText: {
    color: "#e0e0e0",
    fontSize: 28,
    fontWeight: "300",
    fontFamily: "monospace",
    letterSpacing: 6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  numButton: {
    width: "30%",
    aspectRatio: 1.5,
    borderRadius: 14,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#222",
    maxWidth: 100,
  },
  numText: {
    color: "#e0e0e0",
    fontSize: 24,
    fontWeight: "500",
  },
  clearButton: {
    backgroundColor: "#ef444422",
    borderColor: "#ef4444",
  },
  clearText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
