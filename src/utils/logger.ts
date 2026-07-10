import { LogEntry } from "../types";

const MAX_LOGS = 500;
let logs: LogEntry[] = [];
let logListeners: (() => void)[] = [];

export function addLog(message: string, type: LogEntry["type"] = "info") {
  const timestamp = new Date().toLocaleTimeString();
  const entry: LogEntry = { timestamp, type, message };
  logs.unshift(entry);
  if (logs.length > MAX_LOGS) {
    logs.pop();
  }
  // Console logging too
  if (type === "error") {
    console.error(`[${timestamp}] ERROR: ${message}`);
  } else if (type === "warn") {
    console.warn(`[${timestamp}] WARN: ${message}`);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
  logListeners.forEach((listener) => listener());
}

export function getLogs(): LogEntry[] {
  return logs;
}

export function clearLogs() {
  logs = [];
  logListeners.forEach((listener) => listener());
}

export function addLogListener(listener: () => void) {
  logListeners.push(listener);
}

export function removeLogListener(listener: () => void) {
  logListeners = logListeners.filter((l) => l !== listener);
}
