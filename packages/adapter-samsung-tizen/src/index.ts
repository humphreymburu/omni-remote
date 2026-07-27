import type { RemoteKey, TvApp, TvState, PairingInput, PairingResult } from "@omni-remote/core";
import type { TvAdapter } from "@omni-remote/protocol-types";

const SAMSUNG_WS_PORT = 8002;
const SAMSUNG_HTTP_PORT = 8001;

const KEY_MAP: Record<RemoteKey, string> = {
  POWER: "KEY_POWER",
  MUTE: "KEY_MUTE",
  VOLUME_UP: "KEY_VOLUP",
  VOLUME_DOWN: "KEY_VOLDOWN",
  CHANNEL_UP: "KEY_CHUP",
  CHANNEL_DOWN: "KEY_CHDOWN",
  UP: "KEY_UP",
  DOWN: "KEY_DOWN",
  LEFT: "KEY_LEFT",
  RIGHT: "KEY_RIGHT",
  SELECT: "KEY_ENTER",
  BACK: "KEY_RETURN",
  HOME: "KEY_HOME",
  MENU: "KEY_MENU",
  INPUT: "KEY_SOURCE",
  PLAY: "KEY_PLAY",
  PAUSE: "KEY_PAUSE",
  STOP: "KEY_STOP",
  REWIND: "KEY_REWIND",
  FAST_FORWARD: "KEY_FF",
  NUM_0: "KEY_0",
  NUM_1: "KEY_1",
  NUM_2: "KEY_2",
  NUM_3: "KEY_3",
  NUM_4: "KEY_4",
  NUM_5: "KEY_5",
  NUM_6: "KEY_6",
  NUM_7: "KEY_7",
  NUM_8: "KEY_8",
  NUM_9: "KEY_9",
  COLOR_RED: "KEY_RED",
  COLOR_GREEN: "KEY_GREEN",
  COLOR_YELLOW: "KEY_YELLOW",
  COLOR_BLUE: "KEY_BLUE",
  INFO: "KEY_INFO",
  EXIT: "KEY_EXIT",
};

export class SamsungTizenAdapter implements TvAdapter {
  private ipAddress: string;
  private wsPort: number;
  private httpPort: number;
  private ws?: WebSocket;
  private connected = false;
  private token?: string;

  constructor(
    ipAddress: string,
    wsPort: number = SAMSUNG_WS_PORT,
    httpPort: number = SAMSUNG_HTTP_PORT,
  ) {
    this.ipAddress = ipAddress;
    this.wsPort = wsPort;
    this.httpPort = httpPort;
  }

  async connect(): Promise<void> {
    const url = `http://${this.ipAddress}:${this.httpPort}/api/v2/`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Samsung connect failed: ${response.status}`);
    }
    this.connected = true;
  }

  async pair(input?: PairingInput): Promise<PairingResult> {
    try {
      const wsUrl = `ws://${this.ipAddress}:${this.wsPort}/api/v2/channels/samsung.remote.control?name=${encodeURIComponent("Omni Remote")}`;
      if (this.token) {
        const wsUrlWithToken = `${wsUrl}&token=${this.token}`;
        this.ws = new WebSocket(wsUrlWithToken);
      } else {
        this.ws = new WebSocket(wsUrl);
      }

      await new Promise<void>((resolve, reject) => {
        if (!this.ws) return reject(new Error("WebSocket not created"));
        this.ws.onopen = () => resolve();
        this.ws.onerror = () => reject(new Error("WebSocket connection failed"));
      });

      return new Promise((resolve) => {
        if (!this.ws) return resolve({ success: false, error: "No WebSocket" });
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.event === "ms.channel.connect") {
              this.token = data.data?.token;
              resolve({ success: true, token: this.token });
            } else {
              resolve({ success: false, error: "Unexpected response" });
            }
          } catch {
            resolve({ success: true });
          }
        };
      });
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async sendKey(key: RemoteKey): Promise<void> {
    if (!this.ws) throw new Error("Not connected");
    const samsungKey = KEY_MAP[key];
    if (!samsungKey) throw new Error(`Unsupported key: ${key}`);
    this.ws.send(JSON.stringify({
      method: "ms.remote.control",
      params: {
        Cmd: "Click",
        DataOfCmd: samsungKey,
        Option: "false",
        TypeOfRemote: "SendRemoteKey",
      },
    }));
  }

  async launchApp(appId: string): Promise<void> {
    if (!this.ws) throw new Error("Not connected");
    this.ws.send(JSON.stringify({
      method: "ms.channel.emit",
      params: {
        event: "ed.apps.launch",
        to: "host",
        data: {
          appId,
          actionType: "NATIVE_LAUNCH",
        },
      },
    }));
  }

  async disconnect(): Promise<void> {
    this.ws?.close();
    this.connected = false;
  }

  async getInstalledApps(): Promise<TvApp[]> {
    return [];
  }

  async getState(): Promise<TvState> {
    return { power: true, volume: 50, muted: false };
  }

  async wake(): Promise<void> {
    throw new Error("Wake not implemented");
  }
}
