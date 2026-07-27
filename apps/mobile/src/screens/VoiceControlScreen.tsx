import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRemoteStore } from "../store";
import { commandDispatcher } from "../services/CommandDispatcher";
import { parseVoiceTranscript, voiceIntentsToCommands } from "../services/VoiceIntentParser";
import type { VoiceIntent } from "@omni-remote/core";

const SUGGESTIONS = [
  "Volume up",
  "Volume down",
  "Mute",
  "Channel up",
  "Go home",
  "Open YouTube",
  "Play",
  "Pause",
  "Search for cats",
];

export function VoiceControlScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const activeDevice = useRemoteStore((s) => s.activeDevice);
  const [transcript, setTranscript] = useState("");
  const [intents, setIntents] = useState<VoiceIntent[]>([]);
  const [listening, setListening] = useState(false);
  const [inputText, setInputText] = useState("");

  const handleTranscript = useCallback((text: string) => {
    setTranscript(text);
    const parsed = parseVoiceTranscript(text);
    setIntents(parsed);
  }, []);

  // Using TextInput as a fallback since react-native-voice needs native setup
  const handleTextSubmit = useCallback(() => {
    if (!inputText.trim()) return;
    handleTranscript(inputText.trim());
    setInputText("");
  }, [inputText, handleTranscript]);

  const handleExecute = useCallback(async () => {
    if (!activeDevice) {
      Alert.alert("No Device", "Select a TV first");
      navigation.goBack();
      return;
    }

    const commands = voiceIntentsToCommands(intents);
    for (const cmd of commands) {
      await commandDispatcher.execute(activeDevice, cmd);
      await new Promise((r) => setTimeout(r, 300));
    }
    navigation.goBack();
  }, [intents, activeDevice, navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.micContainer}>
          <View style={[styles.micButton, listening && styles.micButtonActive]}>
            <Text style={styles.micIcon}>🎤</Text>
          </View>
          <Text style={styles.micLabel}>
            {listening ? "Listening..." : "Enter text below"}
          </Text>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder='Try "Volume up" or "Open YouTube"'
            placeholderTextColor="#444"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleTextSubmit}
            returnKeyType="done"
          />
          <Pressable style={styles.goButton} onPress={handleTextSubmit}>
            <Text style={styles.goButtonText}>Go</Text>
          </Pressable>
        </View>

        {transcript ? (
          <View style={styles.resultBox}>
            <Text style={styles.transcriptLabel}>You said:</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>

            {intents.length > 0 && (
              <>
                <Text style={styles.intentsLabel}>Actions:</Text>
                {intents.map((intent, idx) => (
                  <View key={idx} style={styles.intentRow}>
                    <Text style={styles.intentText}>
                      {intent.action}
                      {intent.key ? `: ${intent.key}` : ""}
                      {intent.amount ? `: ${intent.amount > 0 ? "+" : ""}${intent.amount}` : ""}
                      {intent.appName ? `: ${intent.appName}` : ""}
                      {intent.text ? `: "${intent.text}"` : ""}
                    </Text>
                  </View>
                ))}

                <Pressable style={styles.executeButton} onPress={handleExecute}>
                  <Text style={styles.executeText}>Execute</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : null}

        <Text style={styles.suggestionsLabel}>Try saying:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.suggestionsRow}>
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                style={styles.suggestionChip}
                onPress={() => handleTranscript(s)}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  content: { flex: 1, padding: 20 },
  micContainer: { alignItems: "center", paddingVertical: 30 },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#222",
  },
  micButtonActive: { borderColor: "#3b82f6", backgroundColor: "#1a2332" },
  micIcon: { fontSize: 32 },
  micLabel: { color: "#666", fontSize: 13, marginTop: 12 },
  inputRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  textInput: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 14,
    color: "#e0e0e0",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#222",
  },
  goButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 14,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  goButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  resultBox: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  transcriptLabel: { color: "#888", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  transcriptText: { color: "#e0e0e0", fontSize: 18, fontWeight: "500", marginTop: 4 },
  intentsLabel: { color: "#888", fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginTop: 16 },
  intentRow: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  intentText: { color: "#3b82f6", fontSize: 13, fontFamily: "monospace" },
  executeButton: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  executeText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  suggestionsLabel: {
    color: "#888",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  suggestionsRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
  },
  suggestionText: { color: "#e0e0e0", fontSize: 13 },
});
