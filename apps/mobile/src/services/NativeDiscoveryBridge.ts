import { NativeModules, NativeEventEmitter } from "react-native";

const { RNLocalNetworkDiscovery } = NativeModules;

export interface DiscoveredDeviceInfo {
  ipAddress: string;
  name: string;
  platform: string;
  server?: string;
  location?: string;
  usn?: string;
  method: "ssdp" | "mdns";
  serviceType?: string;
}

export type DiscoveryEventListener = (device: DiscoveredDeviceInfo) => void;
export type DiscoveryErrorListener = (error: { method: string; error: string }) => void;

class NativeDiscoveryBridge {
  private emitter: NativeEventEmitter;
  private listeners: Map<string, DiscoveryEventListener> = new Map();

  constructor() {
    this.emitter = new NativeEventEmitter(RNLocalNetworkDiscovery);
  }

  onDeviceDiscovered(listener: DiscoveryEventListener): () => void {
    const id = `disc-${Date.now()}`;
    this.listeners.set(id, listener);

    const subscription = this.emitter.addListener("onDeviceDiscovered", (device: DiscoveredDeviceInfo) => {
      listener(device);
    });

    return () => {
      subscription.remove();
      this.listeners.delete(id);
    };
  }

  onDiscoveryError(listener: DiscoveryErrorListener): () => void {
    const subscription = this.emitter.addListener("onDiscoveryError", listener);
    return () => subscription.remove();
  }

  async startSSDPScan(searchTarget?: string): Promise<{ count: number }> {
    return RNLocalNetworkDiscovery.startSSDPScan(searchTarget || "ssdp:all");
  }

  async startMDNSScan(serviceType?: string): Promise<void> {
    return RNLocalNetworkDiscovery.startMDNSScan(serviceType || "_googlecast._tcp");
  }

  async stopDiscovery(): Promise<void> {
    return RNLocalNetworkDiscovery.stopDiscovery();
  }

  async probeDevice(
    ipAddress: string,
    port: number = 80,
    platform?: string,
  ): Promise<{ reachable: boolean; statusCode?: number }> {
    return RNLocalNetworkDiscovery.probeDevice(ipAddress, port, platform || "unknown");
  }

  async getLocalIPAddress(): Promise<{ ipAddress: string; interface: string }> {
    return RNLocalNetworkDiscovery.getLocalIPAddress();
  }

  async sendWakeOnLAN(
    macAddress: string,
    ipAddress?: string,
  ): Promise<{ success: boolean }> {
    return RNLocalNetworkDiscovery.sendWakeOnLAN(macAddress, ipAddress || "");
  }
}

export const nativeDiscovery = new NativeDiscoveryBridge();
