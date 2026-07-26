import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

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

// In-memory mock cloud database for sync functionality
const cloudProfiles: Record<string, any> = {};

// 1. Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. Voice Command Interpretation using Gemini AI or structured fallback
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

// 3. Local TV Network Proxy Endpoint (Bypasses CORS for local REST APIs like Roku ECP, Sony IRCC)
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

// 4. Encrypted Cloud Synchronization Endpoint
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
