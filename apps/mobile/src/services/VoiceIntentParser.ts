import type { RemoteCommand, RemoteKey } from "@omni-remote/core";
import type { VoiceIntent } from "@omni-remote/core";

const CHANNEL_ALIASES: Record<string, string> = {
  "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
  "six": "6", "seven": "7", "eight": "8", "nine": "9", "zero": "0",
};

const APP_ALIASES: Record<string, string> = {
  "youtube": "YouTube",
  "netflix": "Netflix",
  "disney": "Disney+",
  "disney plus": "Disney+",
  "prime video": "Prime Video",
  "prime": "Prime Video",
  "hbo": "Max",
  "hbo max": "Max",
  "spotify": "Spotify",
  "apple tv": "Apple TV",
  "twitch": "Twitch",
};

export function parseVoiceTranscript(transcript: string): VoiceIntent[] {
  const lower = transcript.toLowerCase().trim();
  const intents: VoiceIntent[] = [];

  if (/volume up|turn it up|louder/i.test(lower)) {
    intents.push({ action: "volume.change", amount: 5 });
  } else if (/volume down|turn it down|quieter/i.test(lower)) {
    intents.push({ action: "volume.change", amount: -5 });
  } else if (/(set |change )?volume (to )?\d+/i.test(lower)) {
    const match = lower.match(/(\d+)/);
    if (match) {
      intents.push({ action: "volume.change", amount: parseInt(match[1]) });
    }
  } else if (/channel up|next channel/i.test(lower)) {
    intents.push({ action: "remote.key", key: "CHANNEL_UP" });
  } else if (/channel down|previous channel/i.test(lower)) {
    intents.push({ action: "remote.key", key: "CHANNEL_DOWN" });
  } else if (/(go to |change to |tune to |channel )(\w+)/i.test(lower)) {
    const match = lower.match(/(?:go to |change to |tune to |channel )(\w+)/i);
    if (match) {
      const ch = CHANNEL_ALIASES[match[1].toLowerCase()] || match[1];
      intents.push({ action: "channel.change", channel: ch });
    }
  } else if (/open |launch |start /i.test(lower)) {
    const match = lower.match(/(?:open |launch |start )(.+)/i);
    if (match) {
      const appName = APP_ALIASES[match[1].trim().toLowerCase()] || match[1].trim();
      intents.push({ action: "app.launch", appName });
    }
  } else if (/search for |find |look up /i.test(lower)) {
    const match = lower.match(/(?:search for |find |look up )(.+)/i);
    if (match) {
      intents.push({ action: "text.input", text: match[1].trim() });
    }
  } else if (/go home|home/i.test(lower)) {
    intents.push({ action: "remote.key", key: "HOME" });
  } else if (/back|go back/i.test(lower)) {
    intents.push({ action: "remote.key", key: "BACK" });
  } else if (/mute|silence/i.test(lower)) {
    intents.push({ action: "remote.key", key: "MUTE" });
  } else if (/play|resume/i.test(lower)) {
    intents.push({ action: "remote.key", key: "PLAY" });
  } else if (/pause|stop/i.test(lower)) {
    intents.push({ action: "remote.key", key: "PAUSE" });
  } else if (/power off|turn off|shut down/i.test(lower)) {
    intents.push({ action: "power.off", requiresConfirmation: true });
  } else if (/power on|turn on/i.test(lower)) {
    intents.push({ action: "power.on", requiresConfirmation: true });
  } else if (/up|scroll up/i.test(lower)) {
    intents.push({ action: "remote.key", key: "UP" });
  } else if (/down|scroll down/i.test(lower)) {
    intents.push({ action: "remote.key", key: "DOWN" });
  } else if (/left/i.test(lower)) {
    intents.push({ action: "remote.key", key: "LEFT" });
  } else if (/right/i.test(lower)) {
    intents.push({ action: "remote.key", key: "RIGHT" });
  } else if (/select|ok|enter/i.test(lower)) {
    intents.push({ action: "remote.key", key: "SELECT" });
  }

  if (intents.length === 0 && lower.length > 0) {
    intents.push({ action: "text.input", text: transcript });
  }

  return intents;
}

export function voiceIntentsToCommands(intents: VoiceIntent[]): RemoteCommand[] {
  return intents.map((intent): RemoteCommand => {
    switch (intent.action) {
      case "remote.key":
        return { key: intent.key || "SELECT" };
      case "volume.change":
        return {
          key: (intent.amount || 0) > 0 ? "VOLUME_UP" : "VOLUME_DOWN",
          value: Math.abs(intent.amount || 5),
        };
      case "channel.change":
        return { key: "CHANNEL_DOWN", value: intent.channel };
      case "app.launch":
        return { key: "HOME", value: intent.appName };
      case "text.input":
        return { key: "HOME", value: intent.text };
      case "power.off":
        return { key: "POWER" as RemoteKey };
      case "power.on":
        return { key: "POWER" as RemoteKey };
    }
  });
}
