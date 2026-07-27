import type {
  RemoteKey,
  PairingInput,
  PairingResult,
  TvApp,
  TvState,
} from "@omni-remote/core";

export interface TvAdapter {
  connect(): Promise<void>;
  pair?(input?: PairingInput): Promise<PairingResult>;
  disconnect(): Promise<void>;
  sendKey(key: RemoteKey): Promise<void>;
  typeText?(text: string): Promise<void>;
  setVolume?(volume: number): Promise<void>;
  changeChannel?(channel: string): Promise<void>;
  launchApp?(appId: string): Promise<void>;
  getInstalledApps?(): Promise<TvApp[]>;
  getState?(): Promise<TvState>;
  wake?(): Promise<void>;
}
