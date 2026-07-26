import React, { useRef, useState } from 'react';
import {
  Hand,
  Sparkles,
  Volume2,
  Sliders,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
} from 'lucide-react';
import { RemoteCommand, TouchGestureSettings } from '../../types';

interface TouchpadRemoteProps {
  settings: TouchGestureSettings;
  onSendCommand: (command: RemoteCommand) => void;
  onUpdateSettings: (newSettings: TouchGestureSettings) => void;
}

export const TouchpadRemote: React.FC<TouchpadRemoteProps> = ({
  settings,
  onSendCommand,
  onUpdateSettings,
}) => {
  const touchStartPos = useRef<{ x: number; y: number; time: number } | null>(null);
  const touch2FingerY = useRef<number | null>(null);
  const [activeGesture, setActiveGesture] = useState<string>('');
  const [touchTrail, setTouchTrail] = useState<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<any>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      touchStartPos.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      setTouchTrail({ x, y });

      // Start long-press timer
      longPressTimer.current = setTimeout(() => {
        setActiveGesture('LONG PRESS (MENU)');
        onSendCommand({ type: settings.longPressAction });
        touchStartPos.current = null;
      }, 650);
    } else if (e.touches.length === 2) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      touch2FingerY.current = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (e.touches.length === 1 && touchStartPos.current) {
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      setTouchTrail({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
    } else if (e.touches.length === 2 && touch2FingerY.current !== null) {
      const currentY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const diffY = touch2FingerY.current - currentY;

      if (Math.abs(diffY) > 25) {
        if (diffY > 0) {
          setActiveGesture('2-FINGER SWIPE UP (VOL +)');
          onSendCommand({ type: 'VOL_UP' });
        } else {
          setActiveGesture('2-FINGER SWIPE DOWN (VOL -)');
          onSendCommand({ type: 'VOL_DOWN' });
        }
        touch2FingerY.current = currentY;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!touchStartPos.current) {
      setTouchTrail(null);
      return;
    }

    const duration = Date.now() - touchStartPos.current.time;
    const endTouch = e.changedTouches[0];
    const deltaX = endTouch.clientX - touchStartPos.current.x;
    const deltaY = endTouch.clientY - touchStartPos.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const minSwipeDist = 35 - settings.swipeSensitivity * 2; // Sensitivity calculation

    if (distance > minSwipeDist) {
      // Directional Swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          setActiveGesture('SWIPE RIGHT');
          onSendCommand({ type: 'NAV_RIGHT' });
        } else {
          setActiveGesture('SWIPE LEFT');
          onSendCommand({ type: 'NAV_LEFT' });
        }
      } else {
        if (deltaY > 0) {
          setActiveGesture('SWIPE DOWN');
          onSendCommand({ type: 'NAV_DOWN' });
        } else {
          setActiveGesture('SWIPE UP');
          onSendCommand({ type: 'NAV_UP' });
        }
      }
    } else if (duration < 300) {
      // Single Tap Select
      setActiveGesture('TAP (SELECT)');
      onSendCommand({ type: 'NAV_SELECT' });
    }

    touchStartPos.current = null;
    touch2FingerY.current = null;
    setTouchTrail(null);

    setTimeout(() => setActiveGesture(''), 1000);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-6 rounded-[36px] bg-[#111111] border border-white/10 shadow-2xl">
      {/* Touchpad Header & Status */}
      <div className="flex items-center justify-between text-xs font-semibold px-2">
        <div className="flex items-center gap-2 text-blue-400 uppercase tracking-widest text-[10px] font-bold">
          <Hand className="w-4 h-4 text-blue-400" />
          <span>Touchpad Gestures</span>
        </div>
        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/20">
          {activeGesture || 'Ready for touch'}
        </span>
      </div>

      {/* Interactive Touch Surface Canvas */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-square w-full rounded-3xl bg-[#121212] border border-white/10 hover:border-blue-500/50 transition-colors flex flex-col items-center justify-center p-4 cursor-pointer overflow-hidden shadow-inner select-none"
      >
        {/* Visual Directional Guides Overlay */}
        <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none opacity-20 text-gray-400">
          <ChevronLeft className="w-8 h-8 animate-pulse" />
          <div className="flex flex-col items-center justify-between h-full py-2">
            <ChevronUp className="w-8 h-8 animate-pulse" />
            <div className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-widest text-gray-500">
              <MousePointerClick className="w-4 h-4" /> Tap / Swipe Surface
            </div>
            <ChevronDown className="w-8 h-8 animate-pulse" />
          </div>
          <ChevronRight className="w-8 h-8 animate-pulse" />
        </div>

        {/* Dynamic Touch Ripple / Trail Highlight */}
        {touchTrail && (
          <div
            className="absolute w-16 h-16 rounded-full bg-blue-600/30 border-2 border-blue-400 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-ping"
            style={{ left: `${touchTrail.x}px`, top: `${touchTrail.y}px` }}
          />
        )}

        {/* Gesture Cheat Sheet Legend */}
        <div className="z-10 flex flex-col items-center gap-1 text-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mb-1">
            <Hand className="w-6 h-6 animate-bounce" />
          </div>
          <p className="text-xs font-bold text-white">Swipe in any direction</p>
          <p className="text-[11px] text-gray-400 mt-1">Tap to Select • 2-Finger Vertical for Volume</p>
        </div>
      </div>

      {/* Sensitivity Controls */}
      <div className="bg-[#121212] p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
          <span className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-400">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            Swipe Sensitivity
          </span>
          <span className="font-mono text-blue-400 text-xs font-bold">{settings.swipeSensitivity}x</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={settings.swipeSensitivity}
          onChange={(e) =>
            onUpdateSettings({ ...settings, swipeSensitivity: Number(e.target.value) })
          }
          className="w-full accent-blue-600 h-1.5 bg-white/10 rounded-lg cursor-pointer mt-1"
        />
      </div>
    </div>
  );
};
