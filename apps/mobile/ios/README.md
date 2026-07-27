# iOS Project Setup

This document explains how to generate the native Xcode project for Omni Remote on iOS.

## Prerequisites

- macOS with Xcode 16+ installed
- Node.js 18+
- CocoaPods (`sudo gem install cocoapods`)
- React Native CLI (`npm install -g @react-native-community/cli`)

## Initial Setup (First Time Only)

### Option A: Auto Setup Script

```bash
cd apps/mobile
npm run ios:setup
```

This script will:
1. Install npm dependencies
2. Link the native network discovery module
3. Run `pod install` to generate the Xcode workspace
4. Print next steps

### Option B: Manual Setup

```bash
# From the monorepo root
cd apps/mobile

# 1. Generate native iOS project scaffold
npx react-native init OmniRemote --directory ios --skip-install

# 2. Install CocoaPods
cd ios && pod install

# 3. Open in Xcode
open OmniRemote.xcworkspace
```

## Daily Development

```bash
# Start Metro bundler
npm run mobile:start

# In a second terminal, run on iOS simulator
npm run mobile:ios

# Or run on a physical device
npm run mobile:ios -- --device "My iPhone"
```

## Required iOS Permissions

The app requires these permissions (already configured in `Info.plist`):

| Permission | Usage | iOS Prompt |
|-----------|-------|-----------|
| **Local Network** | SSDP/mDNS TV discovery | "Omni Remote wants to find and connect to devices on your local network" |
| **Bonjour Services** | mDNS service discovery | Automatic when Local Network is granted |
| **Microphone** | Voice commands | "Omni Remote would like to access the microphone" |
| **Speech Recognition** | Voice-to-text | "Speech recognition will send voice data to Apple" |

## Native Module: RNLocalNetworkDiscovery

The custom native module `RNLocalNetworkDiscovery` provides:

- **SSDP scanning** — Multicast UDP M-SEARCH to 239.255.255.250:1900
- **mDNS discovery** — NWBrowser-based Bonjour service browsing (iOS 14+)
- **Device probing** — HTTP connectivity check to verify device reachability
- **Local IP detection** — Gets the phone's Wi-Fi IP via `getifaddrs`
- **Wake-on-LAN** — Magic packet sender for network-wake-capable TVs

The TypeScript bridge is at `src/services/NativeDiscoveryBridge.ts`.

## Testing on Device

1. Connect iPhone via USB
2. In Xcode, select your device from the scheme dropdown
3. Set your Apple Developer team in `Signing & Capabilities`
4. Press ⌘R

For the first run:
- Accept **Local Network** permission when prompted
- Make sure your iPhone and TV are on the same Wi-Fi network
- Some routers isolate devices (guest networks) — test on the main network

## Troubleshooting

### `pod install` fails with monorepo module resolution

The Podfile includes monorepo node_modules paths. If issues persist:

```bash
cd apps/mobile/ios
pod install --repo-update
```

### "No visible @interface for RCTAppDelegate"

Update Xcode and CocoaPods. If still failing, check the React Native version matches the pods version:

```bash
cd apps/mobile
npx react-native info
```

### Local network not discovering TVs

- Ensure Local Network permission is granted (check Settings > Privacy > Local Network)
- Some VPNs block local multicast — disable VPN for testing
- Try manual IP entry in the Discovery tab as fallback

### Build errors about missing icons

Create placeholder AppIcon images:
```bash
# Using ImageMagick or sips to generate placeholder icons
sips -z 120 120 --setProperty format png -o apps/mobile/ios/OmniRemote/Images.xcassets/AppIcon.appiconset/Icon-120@2x.png /System/Library/CoreServices/Applications/DVD\ Player.app/Contents/Resources/AppIcon.icns 2>/dev/null
```
