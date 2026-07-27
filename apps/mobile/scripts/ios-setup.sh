#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────
# Omni Remote — iOS Project Setup Script
# Run from the monorepo root or apps/mobile directory
# ──────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$MOBILE_DIR/../.." && pwd)"

echo "┌──────────────────────────────────────┐"
echo "│  Omni Remote — iOS Setup             │"
echo "└──────────────────────────────────────┘"
echo ""
echo "  Mobile dir:   $MOBILE_DIR"
echo "  Repo root:    $REPO_ROOT"
echo ""

# ── Step 1: Check prerequisites ──

command -v node >/dev/null 2>&1 || { echo "ERROR: node is required"; exit 1; }
command -v pod >/dev/null 2>&1 || {
  echo "WARNING: CocoaPods not found. Install with: sudo gem install cocoapods"
  echo "  skipping pod install..."
  HAS_PODS=false
}
HAS_PODS=${HAS_PODS:-true}

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "ERROR: Node.js 18+ required (found v$(node -v))"
  exit 1
fi

echo "  ✓ Node.js $(node -v)"
echo "  ✓ npm $(npm -v)"

# ── Step 2: Install JS dependencies ──

echo ""
echo "  Installing npm dependencies..."
cd "$REPO_ROOT"
npm install --legacy-peer-deps 2>&1 | tail -1

# ── Step 3: Link native module headers ──

echo ""
echo "  Configuring native network discovery module..."

NATIVE_SRC="$MOBILE_DIR/native-modules/ios/RNLocalNetworkDiscovery"
IOS_TARGET="$MOBILE_DIR/ios/OmniRemote"

# Copy native module files if not already present
if [ ! -f "$IOS_TARGET/RNLocalNetworkDiscovery.h" ]; then
  cp "$NATIVE_SRC/RNLocalNetworkDiscovery.h" "$IOS_TARGET/"
  cp "$NATIVE_SRC/RNLocalNetworkDiscovery.m" "$IOS_TARGET/"
  echo "  ✓ Native module files linked"
else
  echo "  ✓ Native module files already present"
fi

# ── Step 4: Install CocoaPods ──

if [ "$HAS_PODS" = true ]; then
  echo ""
  echo "  Installing CocoaPods dependencies..."
  cd "$MOBILE_DIR/ios"
  
  if pod install 2>&1 | tail -5; then
    echo "  ✓ Pods installed successfully"
  else
    echo "  ⚠ pod install had issues — try running manually:"
    echo "    cd apps/mobile/ios && pod install"
  fi
fi

# ── Step 5: Generate Xcode project (if needed) ──

if [ ! -d "$MOBILE_DIR/ios/OmniRemote.xcworkspace" ]; then
  echo ""
  echo "  Generating Xcode workspace..."
  echo "  (This normally happens during pod install)"
  echo "  If the workspace is missing, re-run: pod install"
fi

# ── Step 6: Configure signing ──

echo ""
echo "┌──────────────────────────────────────┐"
echo "│  iOS Setup Complete!                  │"
echo "│                                       │"
echo "│  Next steps:                          │"
echo "│                                       │"
echo "│  1. Open workspace in Xcode:          │"
echo "│     open ios/OmniRemote.xcworkspace   │"
echo "│                                       │"
echo "│  2. Set your development team in:     │"
echo "│     Signing & Capabilities tab        │"
echo "│                                       │"
echo "│  3. Build and run:                    │"
echo "│     ⌘R in Xcode                      │"
echo "│                                       │"
echo "│  4. Or run from terminal:             │"
echo "│     npm run ios                       │"
echo "│                                       │"
echo "│  Permissions to test:                 │"
echo "│    • Local Network (for TV discovery) │"
echo "│    • Microphone (for voice commands)  │"
echo "└──────────────────────────────────────┘"
