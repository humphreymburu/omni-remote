import express from "express";
import path from "path";
import dgram from "node:dgram";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// In-memory profile store for sync functionality. Replace with persistent
// storage before using sync across production server restarts.
const cloudProfiles: Record<string, any> = {};

type DiscoveredTV = {
  id: string;
  name: string;
  brand: "roku" | "lg" | "samsung" | "sony" | "android" | "apple" | "generic";
  protocol: "websocket" | "http_rest" | "web_bluetooth" | "ssdp_bridge";
  ipAddress: string;
  port: number;
  paired: boolean;
  isOnline: boolean;
  lastSeen: string;
  state: {
    power: boolean;
    volume: number;
    muted: boolean;
    channel: number;
    channelName: string;
    activeApp: string;
    currentInput: string;
    mediaState: "playing" | "paused" | "stopped";
  };
};

function parseSsdpHeaders(message: string): Record<string, string> {
  return message.split(/\r?\n/).reduce<Record<string, string>>((headers, line) => {
    const separator = line.indexOf(":");
    if (separator > -1) {
      headers[line.slice(0, separator).trim().toLowerCase()] = line.slice(separator + 1).trim();
    }
    return headers;
  }, {});
}

function inferBrand(headers: Record<string, string>): DiscoveredTV["brand"] {
  const text = `${headers.server || ""} ${headers.st || ""} ${headers.usn || ""} ${headers.location || ""}`.toLowerCase();
  if (text.includes("roku")) return "roku";
  if (text.includes("samsung")) return "samsung";
  if (text.includes("lg") || text.includes("webos")) return "lg";
  if (text.includes("bravia") || text.includes("sony")) return "sony";
  if (text.includes("android") || text.includes("google")) return "android";
  if (text.includes("apple")) return "apple";
  return "generic";
}

function buildDiscoveredDevice(headers: Record<string, string>, remoteAddress: string): DiscoveredTV {
  const brand = inferBrand(headers);
  const location = headers.location || "";
  let port = brand === "roku" ? 8060 : 80;

  try {
    if (location) {
      const url = new URL(location);
      if (url.port) {
        port = Number(url.port);
      }
    }
  } catch {
    // Some devices return non-standard LOCATION values. The remote address is still useful.
  }

  const name =
    headers["friendly-name"] ||
    headers["roku-device-name"] ||
    (brand === "generic" ? `UPnP Device ${remoteAddress}` : `${brand.toUpperCase()} TV ${remoteAddress}`);

  return {
    id: `ssdp-${brand}-${remoteAddress.replace(/[^a-z0-9]/gi, "-")}-${port}`,
    name,
    brand,
    protocol: brand === "roku" ? "http_rest" : "ssdp_bridge",
    ipAddress: remoteAddress,
    port,
    paired: false,
    isOnline: true,
    lastSeen: new Date().toISOString(),
    state: {
      power: true,
      volume: 20,
      muted: false,
      channel: 1,
      channelName: "Live TV",
      activeApp: brand === "roku" ? "Roku Home" : "Smart TV",
      currentInput: "Unknown",
      mediaState: "stopped",
    },
  };
}

function discoverSsdpDevices(timeoutMs = 3500): Promise<DiscoveredTV[]> {
  const searchTargets = ["ssdp:all", "upnp:rootdevice", "roku:ecp"];
  const devices = new Map<string, DiscoveredTV>();

  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
    const finish = () => {
      socket.close();
      resolve(Array.from(devices.values()));
    };
    const timer = setTimeout(finish, timeoutMs);

    socket.on("message", (buffer, remote) => {
      const headers = parseSsdpHeaders(buffer.toString("utf8"));
      const device = buildDiscoveredDevice(headers, remote.address);
      devices.set(device.id, device);
    });

    socket.on("error", (error) => {
      clearTimeout(timer);
      socket.close();
      reject(error);
    });

    socket.bind(() => {
      socket.setBroadcast(true);
      socket.setMulticastTTL(2);

      searchTargets.forEach((target) => {
        const request = [
          "M-SEARCH * HTTP/1.1",
          "HOST: 239.255.255.250:1900",
          'MAN: "ssdp:discover"',
          "MX: 2",
          `ST: ${target}`,
          "",
          "",
        ].join("\r\n");

        socket.send(Buffer.from(request), 1900, "239.255.255.250");
      });
    });
  });
}

// 1. Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. Real SSDP network discovery. This only discovers devices visible from the
// server's network, so hosted deployments cannot scan a user's home LAN unless
// the server is running inside that LAN.
app.get("/api/discover", async (_req, res) => {
  try {
    const devices = await discoverSsdpDevices();
    res.json({
      success: true,
      devices,
      message:
        devices.length > 0
          ? `Found ${devices.length} device(s) via SSDP.`
          : "No SSDP devices responded on this network.",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      devices: [],
      error: err.message || "Device discovery failed",
    });
  }
});

// 3. Voice Command Interpretation using Gemini AI or structured fallback
app.post("/api/voice-command", async (req, res) => {
  try {
    const { transcript, currentDevice } = req.body;
    if (!transcript || typeof transcript !== "string") {
      res.status(400).json({ error: "Missing or invalid transcript" });
      return;
    }

    const ai = getGeminiClient();

    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Analyze this TV remote control user voice or text command: "${transcript}".
Target TV Brand / Context: ${currentDevice?.brand || "Generic Smart TV"}.

Parse the user's intent into executable TV remote actions.
Return a JSON object with:
- "matched": boolean (true if understood)
- "summary": string (a short natural explanation of what will be performed)
- "actions": array of objects with fields:
   - "type": string (one of "POWER_TOGGLE", "POWER_ON", "POWER_OFF", "VOLUME_UP", "VOLUME_DOWN", "VOLUME_SET", "MUTE", "UNMUTE", "CHANNEL_UP", "CHANNEL_DOWN", "CHANNEL_SET", "NAVIGATE", "SELECT", "BACK", "HOME", "LAUNCH_APP", "CHANGE_INPUT", "MEDIA_CONTROL", "SEARCH")
   - "value": string or number or object (e.g. volume target number 20, app name "Netflix", direction "UP", "DOWN", "LEFT", "RIGHT", input "HDMI 1", playback "PLAY", "PAUSE", "STOP")
- "voiceResponse": string (a brief voice feedback string to speak back to the user)`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matched: { type: Type.BOOLEAN },
              summary: { type: Type.STRING },
              voiceResponse: { type: Type.STRING },
              actions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    value: { type: Type.STRING },
                  },
                  required: ["type"],
                },
              },
            },
            required: ["matched", "summary", "actions", "voiceResponse"],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        res.json(parsed);
        return;
      }
    }

    // Fallback heuristic parser if Gemini AI is unavailable
    const lower = transcript.toLowerCase();
    const actions: Array<{ type: string; value?: string }> = [];
    let summary = "Executed command";

    if (lower.includes("mute")) {
      actions.push({ type: "MUTE" });
      summary = "Toggled Mute";
    } else if (lower.includes("unmute")) {
      actions.push({ type: "UNMUTE" });
      summary = "Unmuted Audio";
    } else if (lower.includes("volume up") || lower.includes("louder") || lower.includes("turn up")) {
      actions.push({ type: "VOLUME_UP", value: "5" });
      summary = "Increased volume";
    } else if (lower.includes("volume down") || lower.includes("quieter") || lower.includes("turn down")) {
      actions.push({ type: "VOLUME_DOWN", value: "5" });
      summary = "Decreased volume";
    } else if (lower.includes("home")) {
      actions.push({ type: "HOME" });
      summary = "Navigated Home";
    } else if (lower.includes("back")) {
      actions.push({ type: "BACK" });
      summary = "Navigated Back";
    } else if (lower.includes("power") || lower.includes("turn off") || lower.includes("turn on")) {
      actions.push({ type: "POWER_TOGGLE" });
      summary = "Toggled Power";
    } else if (lower.includes("netflix")) {
      actions.push({ type: "LAUNCH_APP", value: "Netflix" });
      summary = "Launching Netflix";
    } else if (lower.includes("youtube")) {
      actions.push({ type: "LAUNCH_APP", value: "YouTube" });
      summary = "Launching YouTube";
    } else if (lower.includes("disney")) {
      actions.push({ type: "LAUNCH_APP", value: "Disney+" });
      summary = "Launching Disney+";
    } else if (lower.includes("prime") || lower.includes("amazon")) {
      actions.push({ type: "LAUNCH_APP", value: "Prime Video" });
      summary = "Launching Prime Video";
    } else if (lower.includes("spotify")) {
      actions.push({ type: "LAUNCH_APP", value: "Spotify" });
      summary = "Launching Spotify";
    } else {
      actions.push({ type: "SEARCH", value: transcript });
      summary = `Searching for "${transcript}"`;
    }

    res.json({
      matched: true,
      summary,
      voiceResponse: summary,
      actions,
    });
  } catch (err: any) {
    console.error("Voice command processing error:", err);
    res.status(500).json({
      matched: false,
      summary: "Error processing voice command",
      voiceResponse: "Sorry, I couldn't understand that request.",
      actions: [],
      error: err.message,
    });
  }
});

// 4. Local TV Network Proxy Endpoint (Bypasses CORS for local REST APIs like Roku ECP, Sony IRCC)
app.post("/api/tv-proxy", async (req, res) => {
  const { url, method = "POST", headers = {}, body = null, timeout = 3000 } = req.body;

  if (!url || typeof url !== "string") {
    res.status(400).json({ success: false, error: "Target URL is required" });
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "User-Agent": "OmniRemote-PWA/1.0",
        ...headers,
      },
      signal: controller.signal,
    };

    if (body && (method === "POST" || method === "PUT")) {
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    const responseText = await response.text();
    res.json({
      success: response.ok,
      status: response.status,
      data: responseText,
    });
  } catch (err: any) {
    res.status(502).json({
      success: false,
      error: err.name === "AbortError" ? "Device connection timed out" : err.message,
    });
  }
});

// 5. Profile Synchronization Endpoint
app.post("/api/sync/save", (req, res) => {
  const { accountId = "default-user", payload } = req.body;
  if (!payload) {
    res.status(400).json({ error: "No payload provided" });
    return;
  }

  cloudProfiles[accountId] = {
    updatedAt: new Date().toISOString(),
    data: payload,
  };

  res.json({
    success: true,
    message: "Cloud sync successful",
    timestamp: cloudProfiles[accountId].updatedAt,
  });
});

app.get("/api/sync/load", (req, res) => {
  const accountId = (req.query.accountId as string) || "default-user";
  const profile = cloudProfiles[accountId];

  if (!profile) {
    res.status(404).json({ success: false, error: "No cloud profile found" });
    return;
  }

  res.json({
    success: true,
    data: profile.data,
    updatedAt: profile.updatedAt,
  });
});

// Start Express and Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OmniRemote server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
