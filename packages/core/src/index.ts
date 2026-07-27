export type TvPlatform =
  | "roku"
  | "lg-webos"
  | "samsung-tizen"
  | "android-tv"
  | "google-cast"
  | "fire-tv"
  | "generic-upnp"
  | "unknown";

export type DiscoveryMethod = "ssdp" | "mdns" | "cast" | "manual" | "saved-device";

export type PairingStatus = "unpaired" | "pairing" | "paired" | "failed";

export interface TvCapabilities {
  navigation: boolean;
  volume: boolean;
  channels: boolean;
  powerOff: boolean;
  powerOn: boolean;
  textInput: boolean;
  appLaunching: boolean;
  mediaControls: boolean;
  mediaCasting: boolean;
}

export interface TvDevice {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  platform: TvPlatform;
  ipAddress: string;
  macAddress?: string;
  discoveredBy: DiscoveryMethod[];
  capabilities: TvCapabilities;
  pairingStatus: PairingStatus;
  lastConnectedAt?: string;
  port?: number;
}

export interface TvDeviceState {
  power: boolean;
  volume: number;
  muted: boolean;
  channel: number;
  channelName: string;
  activeApp: string;
  currentInput: string;
  mediaState: "playing" | "paused" | "stopped";
  mediaTitle?: string;
  mediaArtist?: string;
}

export type RemoteKey =
  | "POWER"
  | "MUTE"
  | "VOLUME_UP"
  | "VOLUME_DOWN"
  | "CHANNEL_UP"
  | "CHANNEL_DOWN"
  | "UP"
  | "DOWN"
  | "LEFT"
  | "RIGHT"
  | "SELECT"
  | "BACK"
  | "HOME"
  | "MENU"
  | "INPUT"
  | "PLAY"
  | "PAUSE"
  | "STOP"
  | "REWIND"
  | "FAST_FORWARD"
  | "NUM_0" | "NUM_1" | "NUM_2" | "NUM_3" | "NUM_4"
  | "NUM_5" | "NUM_6" | "NUM_7" | "NUM_8" | "NUM_9"
  | "COLOR_RED" | "COLOR_GREEN" | "COLOR_YELLOW" | "COLOR_BLUE"
  | "INFO"
  | "EXIT";

export interface RemoteCommand {
  key: RemoteKey;
  value?: string | number;
  repeat?: number;
}

export interface TvApp {
  id: string;
  name: string;
  iconUrl?: string;
  isActive?: boolean;
}

export interface TvState {
  power: boolean;
  volume: number;
  muted: boolean;
  activeApp?: string;
  mediaState?: "playing" | "paused" | "stopped";
  channel?: number;
  input?: string;
}

export interface PowerCapabilities {
  powerOff: boolean;
  wakeOnLan: boolean;
  networkWake: boolean;
  requiresNetworkStandby: boolean;
}

export interface PairingInput {
  pin?: string;
  confirm?: boolean;
}

export interface PairingResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface IdentificationResult {
  platform: TvPlatform;
  confidence: number;
  evidence: string[];
}

export type VoiceIntentAction =
  | "remote.key"
  | "volume.change"
  | "channel.change"
  | "app.launch"
  | "text.input"
  | "power.off"
  | "power.on";

export interface VoiceIntent {
  action: VoiceIntentAction;
  key?: RemoteKey;
  amount?: number;
  channel?: string;
  appName?: string;
  text?: string;
  requiresConfirmation?: boolean;
}

export type AppTheme =
  | "elegant_dark"
  | "oled_black"
  | "cyber_neon"
  | "titanium_slate"
  | "classic_ir"
  | "minimal_light";

export interface FavoriteItem {
  id: string;
  title: string;
  category: "channel" | "app" | "media" | "macro";
  iconName: string;
  brandColor?: string;
  action: RemoteCommand;
  channelNumber?: number;
  appId?: string;
  url?: string;
  description?: string;
}

export interface TouchGestureSettings {
  swipeSensitivity: number;
  vibrationFeedback: boolean;
  soundEffects: boolean;
  doubleTapAction: RemoteKey;
  longPressAction: RemoteKey;
  twoFingerVerticalAction: "VOLUME" | "CHANNEL" | "NONE";
  swipeHoldRepeat: boolean;
}

export interface CommandLog {
  id: string;
  timestamp: string;
  command: RemoteCommand;
  deviceName: string;
  status: "sent" | "failed";
  details?: string;
}

export interface OfflineMediaItem {
  id: string;
  title: string;
  mimeType: string;
  size: number;
  duration?: number;
  url?: string;
  addedAt: string;
}
