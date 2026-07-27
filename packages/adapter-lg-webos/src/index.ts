import type { RemoteKey, TvApp, TvState, PairingInput, PairingResult } from "@omni-remote/core";
import type { TvAdapter } from "@omni-remote/protocol-types";

const LG_WEBOS_PORT = 3000;
const LG_WEBOS_WS_PORT = 3001;

const KEY_MAP: Record<RemoteKey, string> = {
  POWER: "POWER",
  MUTE: "MUTE",
  VOLUME_UP: "VOLUMEUP",
  VOLUME_DOWN: "VOLUMEDOWN",
  CHANNEL_UP: "CHANNELUP",
  CHANNEL_DOWN: "CHANNELDOWN",
  UP: "UP",
  DOWN: "DOWN",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  SELECT: "ENTER",
  BACK: "BACK",
  HOME: "HOME",
  MENU: "MENU",
  INPUT: "INPUT",
  PLAY: "PLAY",
  PAUSE: "PAUSE",
  STOP: "STOP",
  REWIND: "REWIND",
  FAST_FORWARD: "FASTFORWARD",
  NUM_0: "0",
  NUM_1: "1",
  NUM_2: "2",
  NUM_3: "3",
  NUM_4: "4",
  NUM_5: "5",
  NUM_6: "6",
  NUM_7: "7",
  NUM_8: "8",
  NUM_9: "9",
  COLOR_RED: "RED",
  COLOR_GREEN: "GREEN",
  COLOR_YELLOW: "YELLOW",
  COLOR_BLUE: "BLUE",
  INFO: "INFO",
  EXIT: "EXIT",
};

export class LgWebOsAdapter implements TvAdapter {
  private ipAddress: string;
  private port: number;
  private wsPort: number;
  private connected = false;
  private clientKey?: string;
  private ws?: WebSocket;

  constructor(
    ipAddress: string,
    port: number = LG_WEBOS_PORT,
    wsPort: number = LG_WEBOS_WS_PORT,
  ) {
    this.ipAddress = ipAddress;
    this.port = port;
    this.wsPort = wsPort;
  }

  async connect(): Promise<void> {
    const url = `http://${this.ipAddress}:${this.port}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`LG WebOS connect failed: ${response.status}`);
    }
    this.connected = true;
  }

  async pair(input?: PairingInput): Promise<PairingResult> {
    try {
      const wsUrl = `ws://${this.ipAddress}:${this.wsPort}`;
      this.ws = new WebSocket(wsUrl);

      await new Promise<void>((resolve, reject) => {
        if (!this.ws) return reject(new Error("WebSocket not created"));
        this.ws.onopen = () => resolve();
        this.ws.onerror = (e) => reject(new Error("WebSocket connection failed"));
      });

      const pairPayload = {
        type: "register",
        id: "omni-remote",
        "force-key-regeneration": true,
        "client-key": this.clientKey,
        "manifest": {
          manifestVersion: 1,
          appVersion: "1.0",
          permissions: [
            "LAUNCH",
            "CONTROL_INPUT",
            "CONTROL_POWER",
            "CONTROL_VOLUME",
            "READ_INSTALLED_APPS",
          ],
        },
        "pairing-type": "prompt",
      };

      this.ws.send(JSON.stringify(pairPayload));

      const response = await new Promise<any>((resolve, reject) => {
        if (!this.ws) return reject(new Error("WebSocket not created"));
        this.ws.onmessage = (event) => {
          try {
            resolve(JSON.parse(event.data));
          } catch {
            reject(new Error("Invalid response"));
          }
        };
      });

      if (response.type === "registered" && response["client-key"]) {
        this.clientKey = response["client-key"];
        return { success: true, token: this.clientKey };
      }

      return { success: false, error: "Pairing rejected by TV" };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async sendKey(key: RemoteKey): Promise<void> {
    if (!this.ws) throw new Error("Not connected");
    const lgKey = KEY_MAP[key];
    if (!lgKey) throw new Error(`Unsupported key: ${key}`);
    this.ws.send(JSON.stringify({
      type: "button",
      payload: { key: lgKey },
    }));
  }

  async typeText(text: string): Promise<void> {
    if (!this.ws) throw new Error("Not connected");
    this.ws.send(JSON.stringify({
      type: "textinput",
      payload: { text },
    }));
  }

  async launchApp(appId: string): Promise<void> {
    if (!this.ws) throw new Error("Not connected");
    this.ws.send(JSON.stringify({
      type: "launch",
      payload: { id: appId },
    }));
  }

  async getInstalledApps(): Promise<TvApp[]> {
    const url = `http://${this.ipAddress}:${this.port}/api/v1/apps`;
    const response = await fetch(url);
    return response.json();
  }

  async disconnect(): Promise<void> {
    this.ws?.close();
    this.connected = false;
  }

  async getState?(): Promise<TvState> {
    return { power: true, volume: 50, muted: false };
  }

  async wake(): Promise<void> {
    throw new Error("Wake not implemented");
  }
}
