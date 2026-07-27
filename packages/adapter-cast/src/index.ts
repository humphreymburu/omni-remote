import type { RemoteKey, TvApp, TvState } from "@omni-remote/core";
import type { TvAdapter } from "@omni-remote/protocol-types";

export class GoogleCastAdapter implements TvAdapter {
  private ipAddress: string;
  private port: number;
  private connected = false;

  constructor(ipAddress: string, port: number = 8009) {
    this.ipAddress = ipAddress;
    this.port = port;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async sendKey(key: RemoteKey): Promise<void> {
    throw new Error("Google Cast does not support key-based remote control");
  }

  async setVolume(volume: number): Promise<void> {
    throw new Error("Volume control via Cast requires media session");
  }

  async getState(): Promise<TvState> {
    return { power: true, volume: 50, muted: false };
  }

  async wake(): Promise<void> {
    throw new Error("Wake not implemented");
  }

  async getInstalledApps(): Promise<TvApp[]> {
    return [];
  }

  async launchApp(appId: string): Promise<void> {
    throw new Error("App launching via Cast requires Cast SDK");
  }
}
