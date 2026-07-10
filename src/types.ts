export interface BotConfig {
  javaIP: string;
  bedrockIP: string;
  bedrockPort: number;
  store: string;
  website: string;
  discord: string;
  logo: string;
  background: string;
  discordToken?: string;
  clientId?: string;
}

export interface ServerStatusInfo {
  online: boolean;
  ping: number;
  playersOnline: number;
  playersMax: number;
  version: string;
  software: string;
  motd: string;
}

export interface BotStatus {
  running: boolean;
  tag: string | null;
  guildsCount: number;
  latency: number;
}

export interface LogEntry {
  timestamp: string;
  type: "info" | "success" | "warn" | "error";
  message: string;
}
