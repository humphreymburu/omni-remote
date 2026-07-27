import type { TvDevice, TvPlatform, DiscoveryMethod, IdentificationResult } from "@omni-remote/core";

export interface DiscoveryResult {
  device: TvDevice;
  method: DiscoveryMethod;
}

export type DiscoveryCallback = (results: DiscoveryResult[]) => void;

export interface DiscoveryStrategy {
  name: string;
  start(onDiscover: DiscoveryCallback): Promise<void>;
  stop(): Promise<void>;
}

export class SSDPMulticastDiscovery implements DiscoveryStrategy {
  name = "ssdp";

  async start(onDiscover: DiscoveryCallback): Promise<void> {
    // Android: Native UDP multicast socket on 239.255.255.250:1900
    // iOS: Native UDP multicast via NWConnection
    // Sends M-SEARCH * HTTP/1.1 request and parses responses
    console.log("[SSDP] Starting discovery (native UDP required)");
    // Implementation will use native module bridge
  }

  async stop(): Promise<void> {
    console.log("[SSDP] Stopping discovery");
  }
}

export class MDNSDiscovery implements DiscoveryStrategy {
  name = "mdns";

  async start(onDiscover: DiscoveryCallback): Promise<void> {
    // Uses native mDNS/DNS-SD
    // Discovers _googlecast._tcp, _roku._tcp, etc.
    console.log("[mDNS] Starting discovery (native mDNS required)");
  }

  async stop(): Promise<void> {
    console.log("[mDNS] Stopping discovery");
  }
}

export class SavedDeviceProbe implements DiscoveryStrategy {
  name = "saved-device";
  private savedDevices: TvDevice[];

  constructor(savedDevices: TvDevice[]) {
    this.savedDevices = savedDevices;
  }

  async start(onDiscover: DiscoveryCallback): Promise<void> {
    const results: DiscoveryResult[] = [];
    for (const device of this.savedDevices) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(`http://${device.ipAddress}:${device.port || 80}/`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (response.ok) {
          results.push({
            device: { ...device, lastConnectedAt: new Date().toISOString() },
            method: "saved-device",
          });
        }
      } catch {
        // Device offline, skip
      }
    }
    if (results.length > 0) {
      onDiscover(results);
    }
  }

  async stop(): Promise<void> {}
}

export class ManualIPDiscovery implements DiscoveryStrategy {
  name = "manual";

  async start(onDiscover: DiscoveryCallback): Promise<void> {
    // Manual IP entry is handled by UI, not discovery loop
  }

  async stop(): Promise<void> {}
}

export interface IdentifyDeviceParams {
  ipAddress: string;
  port?: number;
  ssdpHeaders?: Record<string, string>;
  upnpXml?: string;
  mdnsService?: { type: string; name: string };
  openPorts?: number[];
  httpResponse?: { headers: Record<string, string>; body?: string };
}

const PLATFORM_PORTS: Record<TvPlatform, number[]> = {
  roku: [8060],
  "lg-webos": [3000, 3001],
  "samsung-tizen": [8001, 8002],
  "android-tv": [5555],
  "google-cast": [8009, 8443],
  "fire-tv": [5555],
  "generic-upnp": [5000, 1900],
  unknown: [],
};

export function identifyDevice(params: IdentifyDeviceParams): IdentificationResult {
  const evidence: string[] = [];
  let confidence = 0;
  let platform: TvPlatform = "unknown";

  if (params.ssdpHeaders) {
    const headers = params.ssdpHeaders;
    const server = headers["SERVER"] || "";
    const usn = headers["USN"] || "";
    const st = headers["ST"] || "";

    if (server.includes("Roku") || usn.includes("roku")) {
      platform = "roku";
      confidence = 0.9;
      evidence.push("SSDP: Roku USN detected");
    } else if (server.includes("LG")) {
      platform = "lg-webos";
      confidence = 0.8;
      evidence.push("SSDP: LG server header");
    } else if (server.includes("Samsung")) {
      platform = "samsung-tizen";
      confidence = 0.8;
      evidence.push("SSDP: Samsung server header");
    } else if (st.includes("googlecast")) {
      platform = "google-cast";
      confidence = 0.9;
      evidence.push("SSDP: Google Cast service type");
    }
  }

  if (params.mdnsService) {
    const type = params.mdnsService.type;
    if (type.includes("_googlecast")) {
      platform = "google-cast";
      confidence = 0.95;
      evidence.push("mDNS: Google Cast service");
    } else if (type.includes("_roku")) {
      platform = "roku";
      confidence = 0.95;
      evidence.push("mDNS: Roku service");
    } else if (type.includes("_webos")) {
      platform = "lg-webos";
      confidence = 0.9;
      evidence.push("mDNS: webOS service");
    } else if (type.includes("_samsung")) {
      platform = "samsung-tizen";
      confidence = 0.9;
      evidence.push("mDNS: Samsung service");
    }
  }

  if (params.openPorts && platform === "unknown") {
    for (const [plat, ports] of Object.entries(PLATFORM_PORTS)) {
      if (plat === "unknown") continue;
      const matched = ports.filter((p) => params.openPorts?.includes(p));
      if (matched.length > 0) {
        platform = plat as TvPlatform;
        confidence = 0.5;
        evidence.push(`Port match: ${matched.join(", ")} suggests ${plat}`);
        break;
      }
    }
  }

  return { platform, confidence, evidence };
}

export async function detectCapabilities(
  ipAddress: string,
  platform: TvPlatform,
): Promise<{
  navigation: boolean;
  volume: boolean;
  channels: boolean;
  powerOff: boolean;
  powerOn: boolean;
  textInput: boolean;
  appLaunching: boolean;
  mediaControls: boolean;
  mediaCasting: boolean;
}> {
  const defaultCapabilities = {
    navigation: false,
    volume: false,
    channels: false,
    powerOff: false,
    powerOn: false,
    textInput: false,
    appLaunching: false,
    mediaControls: false,
    mediaCasting: false,
  };

  switch (platform) {
    case "roku":
      return {
        navigation: true,
        volume: true,
        channels: true,
        powerOff: true,
        powerOn: false,
        textInput: true,
        appLaunching: true,
        mediaControls: true,
        mediaCasting: true,
      };
    case "lg-webos":
      return {
        navigation: true,
        volume: true,
        channels: true,
        powerOff: true,
        powerOn: true,
        textInput: true,
        appLaunching: true,
        mediaControls: true,
        mediaCasting: false,
      };
    case "samsung-tizen":
      return {
        navigation: true,
        volume: true,
        channels: true,
        powerOff: true,
        powerOn: false,
        textInput: true,
        appLaunching: true,
        mediaControls: true,
        mediaCasting: false,
      };
    case "google-cast":
      return {
        navigation: false,
        volume: true,
        channels: false,
        powerOff: false,
        powerOn: false,
        textInput: false,
        appLaunching: true,
        mediaControls: true,
        mediaCasting: true,
      };
    case "generic-upnp":
      return {
        navigation: true,
        volume: false,
        channels: false,
        powerOff: false,
        powerOn: false,
        textInput: false,
        appLaunching: false,
        mediaControls: false,
        mediaCasting: false,
      };
    default:
      return defaultCapabilities;
  }
}

export class DiscoveryEngine {
  private strategies: DiscoveryStrategy[] = [];
  private onDeviceFound?: DiscoveryCallback;
  private running = false;

  constructor(strategies?: DiscoveryStrategy[]) {
    if (strategies) {
      this.strategies = strategies;
    }
  }

  setStrategies(strategies: DiscoveryStrategy[]): void {
    this.strategies = strategies;
  }

  setCallback(callback: DiscoveryCallback): void {
    this.onDeviceFound = callback;
  }

  async start(timeoutMs: number = 5000): Promise<DiscoveryResult[]> {
    this.running = true;
    const allResults: DiscoveryResult[] = [];

    const collectResults = (results: DiscoveryResult[]) => {
      allResults.push(...results);
      this.onDeviceFound?.(results);
    };

    const strategyPromises = this.strategies.map((s) =>
      s.start(collectResults).catch((err) =>
        console.warn(`[Discovery] Strategy ${s.name} failed:`, err),
      ),
    );

    await Promise.race([
      Promise.all(strategyPromises),
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);

    this.running = false;
    await this.stop();

    return allResults;
  }

  async stop(): Promise<void> {
    await Promise.all(
      this.strategies.map((s) => s.stop().catch(() => {})),
    );
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }
}
