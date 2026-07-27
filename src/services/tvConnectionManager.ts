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
    let success = false;

    // Prepare the local state update that will be applied after transport success.
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
        success = await bluetoothService.sendCommand(command.type);
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

        const response = await fetch('/api/tv-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl, method: 'POST' }),
        });
        const result = await response.json();
        success = Boolean(result.success);
      } else if (device.protocol === 'websocket') {
        // WebSocket JSON-RPC / WS protocol proxy
        const response = await fetch('/api/tv-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `http://${device.ipAddress}:${device.port}/api/command`,
            method: 'POST',
            body: { command: command.type, value: command.value },
          }),
        });
        const result = await response.json();
        success = Boolean(result.success);
      } else {
        logMessage = `No command transport is implemented for ${device.brand.toUpperCase()} (${device.protocol})`;
      }
    } catch (err) {
      success = false;
      logMessage = `Failed to send ${command.type} to ${device.name}`;
      console.warn('Real device transport failed:', err);
    }

    return {
      success,
      updatedState: success ? newState : device.state,
      logMessage,
    };
  }

  // Uses the backend SSDP discovery endpoint. Browser PWAs cannot directly send
  // LAN multicast packets, so discovery must happen from the server process.
  public async scanLocalNetwork(): Promise<TVDevice[]> {
    const response = await fetch('/api/discover');
    if (!response.ok) {
      throw new Error('Device discovery failed');
    }

    const payload = await response.json();
    return payload.devices || [];
  }
}

export const tvConnectionManager = new TVConnectionManager();
