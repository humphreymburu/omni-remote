import type { TvDevice, PairingStatus } from "@omni-remote/core";
import { commandDispatcher } from "./CommandDispatcher";

export class PairingManager {
  private pairingInProgress = new Set<string>();

  isPairing(deviceId: string): boolean {
    return this.pairingInProgress.has(deviceId);
  }

  async startPairing(device: TvDevice, pin?: string): Promise<boolean> {
    const deviceId = device.id;
    if (this.pairingInProgress.has(deviceId)) {
      throw new Error("Pairing already in progress");
    }

    this.pairingInProgress.add(deviceId);

    try {
      await commandDispatcher.connect(device);
      const success = await commandDispatcher.pair(device, pin);
      return success;
    } finally {
      this.pairingInProgress.delete(deviceId);
    }
  }

  async reconnect(device: TvDevice): Promise<boolean> {
    try {
      await commandDispatcher.connect(device);
      return true;
    } catch {
      return false;
    }
  }

  async unpair(device: TvDevice): Promise<void> {
    await commandDispatcher.disconnect(device);
  }
}

export const pairingManager = new PairingManager();
