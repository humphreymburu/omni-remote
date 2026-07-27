# OmniRemote Smart TV Control

OmniRemote is a browser-based smart TV remote control app. It gives you a phone-friendly remote interface for controlling TVs and media devices through Wi-Fi, Bluetooth, and local proxy endpoints.

The app is built as a React + Vite progressive web app with an Express server. It can run locally in the browser, be installed as a PWA, and includes server endpoints for voice-command parsing, TV proxy requests, and simple profile sync.

## What the App Does

- Controls smart TVs with D-pad, touchpad, number keypad, playback, volume, channel, input, home, back, and app-launch commands.
- Shows a TV status panel for the currently paired device.
- Discovers SSDP/UPnP devices visible from the app server, with support paths for Roku REST commands, manual IP setup, and Web Bluetooth.
- Lets users create their own favorite shortcuts for apps, channels, media, and macros.
- Supports voice or typed natural-language commands, using Gemini when `GEMINI_API_KEY` is available and a local fallback parser when it is not.
- Stores user preferences, paired devices, favorites, gesture settings, and offline media in browser storage.
- Imports local audio/video files into an offline media vault and lets users preview or cast them through the remote flow.
- Backs up and restores remote profiles through a simple in-memory sync API, and also supports JSON export/import.
- Includes theme settings, haptic feedback, sound effects, command logs, and PWA install guidance.

## Tech Stack

- React 19
- TypeScript
- Vite
- Express
- Tailwind CSS
- Lucide React icons
- Google Gemini API via `@google/genai`
- Browser APIs: IndexedDB, Web Speech, Speech Synthesis, Web Bluetooth, Service Worker, PWA Manifest

## Getting Started

### Prerequisites

- Node.js
- npm
- Optional: a Gemini API key for AI-powered voice command parsing

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

The server starts on:

```text
http://localhost:3000
```

To use a different port:

```bash
PORT=3001 npm run dev
```

### Optional Gemini Setup

For AI voice command parsing, provide `GEMINI_API_KEY` before starting the app:

```bash
GEMINI_API_KEY="your-api-key" npm run dev
```

Without this key, the app still runs and uses a built-in rule-based command parser.

## Available Scripts

```bash
npm run dev       # Start the Express + Vite development server
npm run build     # Build the frontend and bundle the server
npm run start     # Start the production server from dist/server.cjs
npm run preview   # Preview the Vite build
npm run lint      # Run TypeScript checks
npm run clean     # Remove build output
```

## Important Notes

- Device discovery is real SSDP discovery from the Node/Express server. For home LAN discovery, run the app server on the same network as the TV.
- A hosted PWA cannot directly scan a user's private Wi-Fi network from browser JavaScript. Use Manual IP or Web Bluetooth when the backend is not on the TV's LAN.
- Profile sync uses an in-memory store in `server.ts`, so synced profiles reset when the server restarts.
- Offline media and app preferences are stored in the browser using IndexedDB.
- PWA behavior depends on browser support and requires the app to be served over HTTP/HTTPS rather than opened as a local file.
