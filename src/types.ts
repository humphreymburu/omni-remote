export type TVBrand = 'roku' | 'lg' | 'samsung' | 'sony' | 'android' | 'apple' | 'generic';

export type ConnectionProtocol = 'websocket' | 'http_rest' | 'web_bluetooth' | 'ssdp_bridge';

export interface TVDeviceState {
  power: boolean;
  volume: number;
  muted: boolean;
  channel: number;
  channelName: string;
  activeApp: string;
  currentInput: string;
  mediaState: 'playing' | 'paused' | 'stopped';
  mediaTitle?: string;
  mediaArtist?: string;
}

export interface TVDevice {
  id: string;
  name: string;
  brand: TVBrand;
  protocol: ConnectionProtocol;
  ipAddress: string;
  port: number;
  macAddress?: string;
  bluetoothName?: string;
  bluetoothId?: string;
  paired: boolean;
  isOnline: boolean;
  lastSeen: string;
  state: TVDeviceState;
}

export type CommandType =
  | 'POWER'
  | 'MUTE'
  | 'UNMUTE'
  | 'TOGGLE_MUTE'
  | 'VOL_UP'
  | 'VOL_DOWN'
  | 'VOL_SET'
  | 'CH_UP'
  | 'CH_DOWN'
  | 'CH_SET'
  | 'NAV_UP'
  | 'NAV_DOWN'
  | 'NAV_LEFT'
  | 'NAV_RIGHT'
  | 'NAV_SELECT'
  | 'BACK'
  | 'HOME'
  | 'MENU'
  | 'INPUT'
  | 'LAUNCH_APP'
  | 'COLOR_RED'
  | 'COLOR_GREEN'
  | 'COLOR_YELLOW'
  | 'COLOR_BLUE'
  | 'PLAY'
  | 'PAUSE'
  | 'STOP'
  | 'REWIND'
  | 'FAST_FORWARD'
  | 'NUM_0' | 'NUM_1' | 'NUM_2' | 'NUM_3' | 'NUM_4'
  | 'NUM_5' | 'NUM_6' | 'NUM_7' | 'NUM_8' | 'NUM_9'
  | 'TEXT_INPUT'
  | 'MACRO_EXECUTE';

export interface RemoteCommand {
  type: CommandType;
  value?: string | number;
  label?: string;
}

export interface FavoriteItem {
  id: string;
  title: string;
  category: 'channel' | 'app' | 'media' | 'macro';
  iconName: string;
  brandColor?: string;
  action: RemoteCommand;
  channelNumber?: number;
  appId?: string;
  url?: string;
  description?: string;
}

export interface TouchGestureSettings {
  swipeSensitivity: number; // 1-10
  vibrationFeedback: boolean;
  soundEffects: boolean;
  doubleTapAction: CommandType;
  longPressAction: CommandType;
  twoFingerVerticalAction: 'VOLUME' | 'CHANNEL' | 'NONE';
  swipeHoldRepeat: boolean;
}

export type AppTheme = 'elegant_dark' | 'oled_black' | 'cyber_neon' | 'titanium_slate' | 'classic_ir' | 'minimal_light';

export interface OfflineMediaItem {
  id: string;
  title: string;
  mimeType: string;
  size: number;
  duration?: number;
  url?: string;
  blobData?: Blob;
  addedAt: string;
}

export interface CommandLog {
  id: string;
  timestamp: string;
  command: RemoteCommand;
  deviceName: string;
  status: 'sent' | 'failed';
  details?: string;
}

export interface VoiceCommandResult {
  transcript: string;
  summary: string;
  matched: boolean;
  actions: Array<{ type: string; value?: string }>;
  voiceResponse: string;
}
