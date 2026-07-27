import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Vibration,
} from "react-native";
import type { RemoteCommand, TouchGestureSettings, RemoteKey } from "@omni-remote/core";

interface Props {
  settings: TouchGestureSettings;
  onSendCommand: (command: RemoteCommand) => void;
}

const SWIPE_THRESHOLD = 40;

export function TouchpadRemote({ settings, onSendCommand }: Props) {
  const [gestureLabel, setGestureLabel] = useState("");
  const [touchPoints, setTouchPoints] = useState<
    { x: number; y: number; id: number }[]
  >([]);
  const touchHistory = useRef<{ x: number; y: number; t: number }[]>([]);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef(0);
  const swipeHandled = useRef(false);

  const showGesture = useCallback((label: string) => {
    setGestureLabel(label);
    Vibration.vibrate(10);
    setTimeout(() => setGestureLabel(""), 600);
  }, []);

  const detectSwipe = useCallback(
    (dx: number, dy: number) => {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const sensitivity = settings.swipeSensitivity * 8;

      if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) return false;
      if (absDx > absDy && absDx > sensitivity) {
        showGesture(dx > 0 ? "→ Right" : "← Left");
        onSendCommand({ key: dx > 0 ? "RIGHT" : "LEFT" });
        return true;
      }
      if (absDy > absDx && absDy > sensitivity) {
        showGesture(dy > 0 ? "↓ Down" : "↑ Up");
        onSendCommand({ key: dy > 0 ? "DOWN" : "UP" });
        return true;
      }
      return false;
    },
    [settings.swipeSensitivity, onSendCommand, showGesture],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const touches = evt.nativeEvent.touches;
        setTouchPoints(
          Array.from(touches).map((t: any) => ({
            x: t.pageX,
            y: t.pageY,
            id: t.identifier || 0,
          })),
        );
        touchHistory.current = [
          { x: touches[0]?.pageX || 0, y: touches[0]?.pageY || 0, t: Date.now() },
        ];
        swipeHandled.current = false;

        longPressTimer.current = setTimeout(() => {
          showGesture("Long Press: Menu");
          onSendCommand({ key: settings.longPressAction as RemoteKey });
        }, 600);
      },
      onPanResponderMove: (evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        const touches = evt.nativeEvent.touches;
        setTouchPoints(
          Array.from(touches).map((t: any) => ({
            x: t.pageX,
            y: t.pageY,
            id: t.identifier || 0,
          })),
        );

        // Two-finger vertical: volume control
        if (touches.length >= 2) {
          if (!swipeHandled.current && settings.twoFingerVerticalAction !== "NONE") {
            const dy = gesture.dy;
            if (Math.abs(dy) > SWIPE_THRESHOLD) {
              swipeHandled.current = true;
              if (settings.twoFingerVerticalAction === "VOLUME") {
                showGesture(dy > 0 ? "Vol Down" : "Vol Up");
                onSendCommand({
                  key: dy > 0 ? "VOLUME_DOWN" : "VOLUME_UP",
                });
              } else {
                showGesture(dy > 0 ? "CH Down" : "CH Up");
                onSendCommand({
                  key: dy > 0 ? "CHANNEL_DOWN" : "CHANNEL_UP",
                });
              }
            }
          }
          return;
        }

        // Single finger swipe
        if (!swipeHandled.current && (Math.abs(gesture.dx) > SWIPE_THRESHOLD || Math.abs(gesture.dy) > SWIPE_THRESHOLD)) {
          swipeHandled.current = detectSwipe(gesture.dx, gesture.dy);
        }
      },
      onPanResponderRelease: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        // Single touch: tap = select
        if (!swipeHandled.current) {
          const now = Date.now();
          if (now - lastTap.current < 300) {
            showGesture("Double Tap");
            onSendCommand({ key: settings.doubleTapAction as RemoteKey });
            lastTap.current = 0;
          } else {
            lastTap.current = now;
            // Wait a bit to see if it's a double tap
            setTimeout(() => {
              if (lastTap.current === now) {
                showGesture("Tap: Select");
                onSendCommand({ key: "SELECT" });
              }
            }, 320);
          }
        }

        setTouchPoints([]);
        touchHistory.current = [];
      },
      onPanResponderTerminate: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        setTouchPoints([]);
      },
    }),
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.touchpad} {...panResponder.panHandlers}>
        <View style={styles.touchArea}>
          <Text style={styles.hint}>Swipe to navigate • Tap to select</Text>
          {touchPoints.map((pt, idx) => (
            <View
              key={idx}
              style={[
                styles.touchDot,
                { left: pt.x - 200, top: pt.y - 300 },
              ]}
            />
          ))}
        </View>
      </View>
      {gestureLabel ? (
        <View style={styles.gestureLabel}>
          <Text style={styles.gestureText}>{gestureLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12 },
  touchpad: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#222",
    overflow: "hidden",
  },
  touchArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    color: "#444",
    fontSize: 14,
  },
  touchDot: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(59, 130, 246, 0.3)",
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  gestureLabel: {
    backgroundColor: "#3b82f6",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: "center",
  },
  gestureText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
