import type { TvDevice } from "@omni-remote/core";

const STORAGE_KEY = "omni_remote_devices";

export class DeviceRegistry {
  private devices: TvDevice[] = [];
  private onChange?: (devices: TvDevice[]) => void;

  constructor(onChange?: (devices: TvDevice[]) => void) {
    this.onChange = onChange;
  }

  setOnChange(callback: (devices: TvDevice[]) => void): void {
    this.onChange = callback;
  }

  getAll(): TvDevice[] {
    return [...this.devices];
  }

  getById(id: string): TvDevice | undefined {
    return this.devices.find((d) => d.id === id);
  }

  add(device: TvDevice): void {
    const existing = this.devices.findIndex((d) => d.id === device.id);
    if (existing >= 0) {
      this.devices[existing] = { ...this.devices[existing], ...device };
    } else {
      this.devices.push(device);
    }
    this.notify();
  }

  remove(id: string): void {
    this.devices = this.devices.filter((d) => d.id !== id);
    this.notify();
  }

  update(id: string, updates: Partial<TvDevice>): void {
    const idx = this.devices.findIndex((d) => d.id === id);
    if (idx >= 0) {
      this.devices[idx] = { ...this.devices[idx], ...updates };
      this.notify();
    }
  }

  getByPlatform(platform: string): TvDevice[] {
    return this.devices.filter((d) => d.platform === platform);
  }

  private notify(): void {
    this.onChange?.(this.devices);
  }

  mergeDiscovered(discovered: TvDevice[]): TvDevice[] {
    const merged: TvDevice[] = [];
    for (const device of discovered) {
      const existing = this.devices.find(
        (d) => d.ipAddress === device.ipAddress || d.id === device.id,
      );
      if (existing) {
        merged.push({ ...existing, ...device, discoveredBy: [...new Set([...existing.discoveredBy, ...device.discoveredBy])] });
      } else {
        merged.push(device);
      }
    }
    return merged;
  }
}

export const deviceRegistry = new DeviceRegistry();
