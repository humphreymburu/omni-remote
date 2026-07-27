import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

// Discovery proxy (SSDP scanning from server)
app.get("/api/discover", async (_req, res) => {
  try {
    // In production, this would run SSDP/mDNS from the server
    // For now, return the discovery endpoint
    res.json({
      devices: [],
      message:
        "LAN discovery must be performed from the mobile device using native UDP",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// TV command proxy (for web clients that can't reach LAN directly)
app.post("/api/tv-proxy", async (req, res) => {
  try {
    const { url, method, body } = req.body;
    const response = await fetch(url, {
      method: method || "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    res.json({ success: response.ok, status: response.status });
  } catch (err: any) {
    res.status(502).json({ success: false, error: err.message });
  }
});

// Cloud sync endpoints
app.post("/api/sync/save", (req, res) => {
  const { accountId, payload } = req.body;
  if (!accountId || !payload) {
    res.status(400).json({ success: false, error: "Missing accountId or payload" });
    return;
  }
  // TODO: persist to database
  res.json({ success: true });
});

app.get("/api/sync/load", (req, res) => {
  const accountId = req.query.accountId as string;
  if (!accountId) {
    res.status(400).json({ success: false, error: "Missing accountId" });
    return;
  }
  // TODO: load from database
  res.json({ success: true, data: null });
});

app.listen(PORT, () => {
  console.log(`[Omni Remote API] running on http://localhost:${PORT}`);
});
