import type { RemoteKey, TvApp, TvState, PairingInput, PairingResult } from "@omni-remote/core";
import type { TvAdapter } from "@omni-remote/protocol-types";

const ROKU_ECP_PORT = 8060;

const KEY_MAP: Record<RemoteKey, string> = {
  HOME: "Home",
  BACK: "Back",
  SELECT: "Select",
  UP: "Up",
  DOWN: "Down",
  LEFT: "Left",
  RIGHT: "Right",
  VOLUME_UP: "VolumeUp",
  VOLUME_DOWN: "VolumeDown",
  MUTE: "VolumeMute",
  POWER: "PowerOff",
  PLAY: "Play",
  PAUSE: "Play",
  STOP: "Stop",
  REWIND: "Rev",
  FAST_FORWARD: "Fwd",
  CHANNEL_UP: "ChannelUp",
  CHANNEL_DOWN: "ChannelDown",
  MENU: "Menu",
  INPUT: "Input",
  INFO: "Info",
  EXIT: "Exit",
  NUM_0: "Lit_0",
  NUM_1: "Lit_1",
  NUM_2: "Lit_2",
  NUM_3: "Lit_3",
  NUM_4: "Lit_4",
  NUM_5: "Lit_5",
  NUM_6: "Lit_6",
  NUM_7: "Lit_7",
  NUM_8: "Lit_8",
  NUM_9: "Lit_9",
  COLOR_RED: "Red",
  COLOR_GREEN: "Green",
  COLOR_YELLOW: "Yellow",
  COLOR_BLUE: "Blue",
};

export class RokuAdapter implements TvAdapter {
  private ipAddress: string;
  private port: number;
  private connected = false;

  constructor(ipAddress: string, port: number = ROKU_ECP_PORT) {
    this.ipAddress = ipAddress;
    this.port = port;
  }

  async connect(): Promise<void> {
    const url = `http://${this.ipAddress}:${this.port}/`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Roku connect failed: ${response.status}`);
    }
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async sendKey(key: RemoteKey): Promise<void> {
    const rokuKey = KEY_MAP[key];
    if (!rokuKey) {
      throw new Error(`Unsupported key for Roku: ${key}`);
    }
    const url = `http://${this.ipAddress}:${this.port}/keypress/${rokuKey}`;
    const response = await fetch(url, { method: "POST" });
    if (!response.ok) {
      throw new Error(`Roku keypress failed: ${response.status}`);
    }
  }

  async typeText(text: string): Promise<void> {
    for (const char of text) {
      const encoded = encodeURIComponent(char);
      const url = `http://${this.ipAddress}:${this.port}/keypress/Lit_${encoded}`;
      await fetch(url, { method: "POST" });
    }
  }

  async launchApp(appId: string): Promise<void> {
    const url = `http://${this.ipAddress}:${this.port}/launch/${appId}`;
    const response = await fetch(url, { method: "POST" });
    if (!response.ok) {
      throw new Error(`Roku launch app failed: ${response.status}`);
    }
  }

  async getInstalledApps(): Promise<TvApp[]> {
    const url = `http://${this.ipAddress}:${this.port}/query/apps`;
    const response = await fetch(url);
    const text = await response.text();
    const apps: TvApp[] = [];
    const regex = /<app id="(\d+)"[^>]*>([^<]+)<\/app>/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      apps.push({ id: match[1], name: match[2] });
    }
    return apps;
  }

  async getState(): Promise<TvState> {
    const url = `http://${this.ipAddress}:${this.port}/query/device-info`;
    const response = await fetch(url);
    const text = await response.text();
    const power = !text.includes("<power-mode>powerOff</power-mode>");
    return {
      power,
      volume: 50,
      muted: false,
      activeApp: undefined,
    };
  }

  async wake(): Promise<void> {
    throw new Error("Wake-on-LAN not implemented for Roku adapter");
  }
}
