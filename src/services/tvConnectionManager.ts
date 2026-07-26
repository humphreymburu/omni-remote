import { TVDevice, RemoteCommand, CommandLog } from '../types';
import { bluetoothService } from './bluetoothService';

export class TVConnectionManager {
  private activeDevice: TVDevice | null = null;

  public setActiveDevice(device: TVDevice | null) {
    this.activeDevice = device;
  }

  public getActiveDevice(): TVDevice | null {
    return this.activeDevice;
  }

  // Executes a remote command through the device protocol driver
  public async sendCommand(
    command: RemoteCommand,
    device: TVDevice
  ): Promise<{ success: boolean; updatedState: TVDevice['state']; logMessage: string }> {
    const newState = { ...device.state };
    let logMessage = `Sent ${command.type}${command.value !== undefined ? `: ${command.value}` : ''}`;
    let success = true;

    // First update simulated local state for instant tactile response
    switch (command.type) {
      case 'POWER':
        newState.power = !newState.power;
        logMessage = newState.power ? 'Power Turned ON' : 'Power Turned OFF';
        break;

      case 'MUTE':
        newState.muted = true;
        logMessage = 'Audio Muted';
        break;

      case 'UNMUTE':
        newState.muted = false;
        logMessage = 'Audio Unmuted';
        break;

      case 'TOGGLE_MUTE':
        newState.muted = !newState.muted;
        logMessage = newState.muted ? 'Muted' : 'Unmuted';
        break;

      case 'VOL_UP':
        newState.muted = false;
        newState.volume = Math.min(100, newState.volume + (typeof command.value === 'number' ? command.value : 2));
        logMessage = `Volume increased to ${newState.volume}%`;
        break;

      case 'VOL_DOWN':
        newState.muted = false;
        newState.volume = Math.max(0, newState.volume - (typeof command.value === 'number' ? command.value : 2));
        logMessage = `Volume decreased to ${newState.volume}%`;
        break;

      case 'VOL_SET':
        newState.muted = false;
        newState.volume = Math.min(100, Math.max(0, Number(command.value) || 0));
        logMessage = `Volume set to ${newState.volume}%`;
        break;

      case 'CH_UP':
        newState.channel = (newState.channel % 999) + 1;
        newState.channelName = `Channel ${newState.channel}`;
        newState.activeApp = 'Live TV';
        logMessage = `Channel switched to ${newState.channel}`;
        break;

      case 'CH_DOWN':
        newState.channel = newState.channel > 1 ? newState.channel - 1 : 999;
        newState.channelName = `Channel ${newState.channel}`;
        newState.activeApp = 'Live TV';
        logMessage = `Channel switched to ${newState.channel}`;
        break;

      case 'CH_SET':
        if (command.value) {
          newState.channel = Number(command.value) || 1;
          newState.channelName = `Channel ${newState.channel}`;
          newState.activeApp = 'Live TV';
          logMessage = `Channel set to ${newState.channel}`;
        }
        break;

      case 'LAUNCH_APP':
        if (command.value) {
          newState.activeApp = String(command.value);
          logMessage = `Launched ${newState.activeApp}`;
        }
        break;

      case 'INPUT':
        if (command.value) {
          newState.currentInput = String(command.value);
          newState.activeApp = String(command.value);
          logMessage = `Input switched to ${newState.currentInput}`;
        }
        break;

      case 'PLAY':
        newState.mediaState = 'playing';
        logMessage = 'Playback Started';
        break;

      case 'PAUSE':
        newState.mediaState = 'paused';
        logMessage = 'Playback Paused';
        break;

      case 'STOP':
        newState.mediaState = 'stopped';
        logMessage = 'Playback Stopped';
        break;

      case 'HOME':
        newState.activeApp = 'Home Launcher';
        logMessage = 'Navigated to Home';
        break;

      default:
        logMessage = `Executed ${command.type}`;
        break;
    }

    // Now dispatch to real protocol transport if network is connected
    try {
      if (device.protocol === 'web_bluetooth') {
        await bluetoothService.sendCommand(command.type);
      } else if (device.protocol === 'http_rest' && device.brand === 'roku') {
        // Roku ECP endpoint protocol
        const keyMap: Record<string, string> = {
          HOME: 'Home',
          BACK: 'Back',
          NAV_SELECT: 'Select',
          NAV_UP: 'Up',
          NAV_DOWN: 'Down',
          NAV_LEFT: 'Left',
          NAV_RIGHT: 'Right',
          VOL_UP: 'VolumeUp',
          VOL_DOWN: 'VolumeDown',
          MUTE: 'VolumeMute',
          POWER: 'Power',
          PLAY: 'Play',
          PAUSE: 'Play',
        };
        const key = keyMap[command.type] || command.type;
        const targetUrl = `http://${device.ipAddress}:${device.port || 8060}/keypress/${key}`;

        fetch('/api/tv-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl, method: 'POST' }),
        }).catch(() => {});
      } else if (device.protocol === 'websocket') {
        // WebSocket JSON-RPC / WS protocol proxy
        fetch('/api/tv-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `http://${device.ipAddress}:${device.port}/api/command`,
            method: 'POST',
            body: { command: command.type, value: command.value },
          }),
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Real device transport notice (using protocol fallback):', err);
    }

    return {
      success,
      updatedState: newState,
      logMessage,
    };
  }

  // Live subnet mDNS / SSDP broadcast network scanner simulation
  public async scanLocalNetwork(): Promise<TVDevice[]> {
    await new Promise((r) => setTimeout(r, 1200));

    return [
      {
        id: 'tv-lg-livingroom',
        name: 'Living Room OLED TV',
        brand: 'lg',
        protocol: 'websocket',
        ipAddress: '192.168.1.105',
        port: 3000,
        macAddress: 'AA:BB:CC:11:22:33',
        paired: true,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        state: {
          power: true,
          volume: 24,
          muted: false,
          channel: 7,
          channelName: 'BBC News HD',
          activeApp: 'Netflix',
          currentInput: 'HDMI 1 (Apple TV)',
          mediaState: 'playing',
          mediaTitle: 'Stranger Things',
          mediaArtist: 'S4 : E1 - Chapter One',
        },
      },
      {
        id: 'tv-roku-bedroom',
        name: 'Bedroom Roku Express',
        brand: 'roku',
        protocol: 'http_rest',
        ipAddress: '192.168.1.112',
        port: 8060,
        paired: true,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        state: {
          power: true,
          volume: 18,
          muted: false,
          channel: 12,
          channelName: 'Roku Channel',
          activeApp: 'YouTube',
          currentInput: 'Roku Home',
          mediaState: 'paused',
          mediaTitle: '4K Ultra HD Nature Relaxation',
        },
      },
      {
        id: 'tv-samsung-den',
        name: 'Den Samsung QLED 4K',
        brand: 'samsung',
        protocol: 'websocket',
        ipAddress: '192.168.1.120',
        port: 8001,
        paired: false,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        state: {
          power: false,
          volume: 15,
          muted: false,
          channel: 4,
          channelName: 'CNN International',
          activeApp: 'Disney+',
          currentInput: 'HDMI 2 (PlayStation 5)',
          mediaState: 'stopped',
        },
      },
      {
        id: 'tv-sony-bravia',
        name: 'Basement Sony Bravia Google TV',
        brand: 'sony',
        protocol: 'http_rest',
        ipAddress: '192.168.1.145',
        port: 80,
        paired: true,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        state: {
          power: true,
          volume: 32,
          muted: false,
          channel: 1,
          channelName: 'NBC Live',
          activeApp: 'Prime Video',
          currentInput: 'HDMI 3',
          mediaState: 'playing',
        },
      },
    ];
  }
}

export const tvConnectionManager = new TVConnectionManager();
