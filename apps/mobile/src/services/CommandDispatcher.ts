import type {
  TvDevice,
  TvPlatform,
  RemoteKey,
  RemoteCommand,
  VoiceIntent,
} from "@omni-remote/core";
import type { TvAdapter } from "@omni-remote/protocol-types";
import { RokuAdapter } from "@omni-remote/adapter-roku";
import { LgWebOsAdapter } from "@omni-remote/adapter-lg-webos";
import { SamsungTizenAdapter } from "@omni-remote/adapter-samsung-tizen";
import { GoogleCastAdapter } from "@omni-remote/adapter-cast";
import { GenericUpnpAdapter } from "@omni-remote/adapter-upnp";

const INSTANT_KEYS: Set<RemoteKey> = new Set([
  "VOLUME_UP", "VOLUME_DOWN", "CHANNEL_UP", "CHANNEL_DOWN",
  "UP", "DOWN", "LEFT", "RIGHT", "SELECT",
  "PLAY", "PAUSE", "STOP",
]);

export class CommandDispatcher {
  private adapters = new Map<string, TvAdapter>();
  private commandQueue = new Map<string, RemoteCommand[]>();
  private processing = new Set<string>();
  private intervals = new Map<string, number>();

  getAdapter(device: TvDevice): TvAdapter {
    const existing = this.adapters.get(device.id);
    if (existing) return existing;

    const adapter = this.createAdapter(device);
    this.adapters.set(device.id, adapter);
    return adapter;
  }

  private createAdapter(device: TvDevice): TvAdapter {
    const ip = device.ipAddress;
    switch (device.platform) {
      case "roku":
        return new RokuAdapter(ip, device.port || 8060);
      case "lg-webos":
        return new LgWebOsAdapter(ip, device.port || 3000);
      case "samsung-tizen":
        return new SamsungTizenAdapter(ip);
      case "google-cast":
        return new GoogleCastAdapter(ip);
      case "generic-upnp":
        return new GenericUpnpAdapter(ip);
      default:
        return new RokuAdapter(ip, device.port || 8060);
    }
  }

  async connect(device: TvDevice): Promise<void> {
    const adapter = this.getAdapter(device);
    await adapter.connect();
  }

  async pair(device: TvDevice, pin?: string): Promise<boolean> {
    const adapter = this.getAdapter(device);
    if (!adapter.pair) return false;
    const result = await adapter.pair({ pin, confirm: true });
    return result.success;
  }

  async disconnect(device: TvDevice): Promise<void> {
    const adapter = this.adapters.get(device.id);
    if (adapter) {
      await adapter.disconnect();
      this.adapters.delete(device.id);
    }
    this.clearQueue(device.id);
  }

  async execute(device: TvDevice, command: RemoteCommand): Promise<boolean> {
    const queue = this.commandQueue.get(device.id) || [];
    const isInstant = INSTANT_KEYS.has(command.key);

    if (isInstant) {
      queue.unshift(command);
    } else {
      queue.push(command);
    }

    this.commandQueue.set(device.id, queue);
    this.processQueue(device);
    return true;
  }

  private async processQueue(device: TvDevice): Promise<void> {
    if (this.processing.has(device.id)) return;
    this.processing.add(device.id);

    const adapter = this.adapters.get(device.id);
    if (!adapter) return;

    const queue = this.commandQueue.get(device.id) || [];

    while (queue.length > 0) {
      const command = queue.shift()!;
      try {
        await adapter.sendKey(command.key);
        if (command.repeat && command.repeat > 1) {
          for (let i = 1; i < command.repeat; i++) {
            await new Promise((r) => setTimeout(r, 100));
            await adapter.sendKey(command.key);
          }
        }
      } catch (err) {
        console.warn(`[CommandDispatcher] Failed to execute ${command.key}:`, err);
      }
      if (queue.length > 0) {
        await new Promise((r) => setTimeout(r, 150));
      }
    }

    this.processing.delete(device.id);
  }

  private clearQueue(deviceId: string): void {
    this.commandQueue.delete(deviceId);
    this.processing.delete(deviceId);
    const interval = this.intervals.get(deviceId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(deviceId);
    }
  }

  async removeAdapter(deviceId: string): Promise<void> {
    const adapter = this.adapters.get(deviceId);
    if (adapter) {
      await adapter.disconnect();
      this.adapters.delete(deviceId);
    }
    this.clearQueue(deviceId);
  }
}

export const commandDispatcher = new CommandDispatcher();
