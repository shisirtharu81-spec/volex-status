import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Server,
  Wifi,
  WifiOff,
  Terminal,
  Settings,
  Image as ImageIcon,
  Upload,
  Play,
  Square,
  RefreshCw,
  Download,
  BookOpen,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  MessageSquare,
  ShoppingBag,
  Globe,
  Copy,
  Check,
  Cpu,
  Trash2,
  Bell,
  User,
  Clock,
  Activity,
  Power,
  Compass,
  Hash,
  Volume2,
  Sliders,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Flame,
  Shield,
  Trophy,
  Zap,
  Award,
  Info,
} from "lucide-react";
import { BotConfig, BotStatus, LogEntry, ServerStatusInfo } from "./types";

// Import modular premium components
import CinematicBackground from "./components/CinematicBackground";
import DynamicCharts from "./components/DynamicCharts";
import PlayerList from "./components/PlayerList";
import ConsoleTerminal from "./components/ConsoleTerminal";
import InteractivePreview from "./components/InteractivePreview";

// Map theme settings to Tailwind classes
const THEMES = {
  orange: {
    name: "Neon Orange",
    accent: "text-orange-500",
    border: "border-orange-500/20",
    bg: "bg-orange-600",
    hover: "hover:bg-orange-500",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    glow: "rgba(249, 115, 22, 0.25)",
    ring: "focus:border-orange-500",
    hex: "#f97316",
  },
  purple: {
    name: "Cyber Purple",
    accent: "text-purple-500",
    border: "border-purple-500/20",
    bg: "bg-purple-600",
    hover: "hover:bg-purple-500",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    glow: "rgba(168, 85, 247, 0.25)",
    ring: "focus:border-purple-500",
    hex: "#a855f7",
  },
  green: {
    name: "Emerald Matrix",
    accent: "text-emerald-500",
    border: "border-emerald-500/20",
    bg: "bg-emerald-600",
    hover: "hover:bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    glow: "rgba(16, 185, 129, 0.25)",
    ring: "focus:border-emerald-500",
    hex: "#10b981",
  },
  blue: {
    name: "Oceanic Frost",
    accent: "text-cyan-500",
    border: "border-cyan-500/20",
    bg: "bg-cyan-600",
    hover: "hover:bg-cyan-500",
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    glow: "rgba(6, 182, 212, 0.25)",
    ring: "focus:border-cyan-500",
    hex: "#06b6d4",
  },
};

interface CircularGaugeProps {
  value: number;
  max: number;
  title: string;
  unit: string;
  color: string;
  icon: React.ReactNode;
}

function CircularGauge({ value, max, title, unit, color, icon }: CircularGaugeProps) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(value, max) / max) * circumference;

  return (
    <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-900 flex flex-col items-center justify-center gap-2 relative group hover:border-slate-800 transition-all text-center">
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="28"
            cy="28"
            r={radius}
            className="stroke-slate-900 fill-transparent"
            strokeWidth="3.5"
          />
          <motion.circle
            cx="28"
            cy="28"
            r={radius}
            className="fill-transparent animate-pulse"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-slate-400 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
      <div>
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{title}</span>
        <span className="text-xs font-mono font-black text-white">{value.toFixed(1)}{unit}</span>
      </div>
    </div>
  );
}

export default function App() {
  // App Config States
  const [config, setConfig] = useState<BotConfig>({
    javaIP: "play.volex.net",
    bedrockIP: "pe.volex.net",
    bedrockPort: 19132,
    store: "https://store.volex.net",
    website: "https://volex.net",
    discord: "https://discord.gg/volex",
    logo: "",
    background: "",
  });

  // Discord Bot Credential Inputs
  const [token, setToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [showToken, setShowToken] = useState(false);

  // Customizer Dashboard States (Theme/Font/Animations)
  const [activeTheme, setActiveTheme] = useState<keyof typeof THEMES>("orange");
  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(true);
  const [activeFont, setActiveFont] = useState<"sans" | "display" | "mono">("display");

  // Status/Data States
  const [botStatus, setBotStatus] = useState<BotStatus>({
    running: false,
    tag: null,
    guildsCount: 0,
    latency: 0,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pingData, setPingData] = useState<{ java: ServerStatusInfo; bedrock: ServerStatusInfo } | null>(null);
  const [previewToken, setPreviewToken] = useState(Date.now());

  // Navigation Panel Views
  const [activeTab, setActiveTab] = useState<"panel" | "instructions">("panel");
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // AAA Sound & Short-cut & Toast States
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: "success" | "warn" | "error" | "info" }>>([]);

  // Synthesize futuristic retro sound effects using Web Audio API
  const playSynthSound = (type: "success" | "warn" | "error" | "info" | "click") => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (type === "click") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "success") {
        const osc1 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.connect(gain);
        gain.connect(ctx.destination);
        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.25);
      } else if (type === "warn") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "error") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.setValueAtTime(100, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "info") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      console.warn("Audio Context sound failed", e);
    }
  };

  // Add toast alert notification
  const addToast = (message: string, type: "success" | "warn" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    playSynthSound(type);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Processing indicators
  const [isSaving, setIsSaving] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [isStartingBot, setIsStartingBot] = useState(false);
  const [isStoppingBot, setIsStoppingBot] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // File Upload states
  const [logoDragging, setLogoDragging] = useState(false);
  const [bgDragging, setBgDragging] = useState(false);

  // Live system timers & dynamic counters
  const [currentTime, setCurrentTime] = useState("");
  const [serverUptime, setServerUptime] = useState("5d 12h 43m");
  const [liveCpu, setLiveCpu] = useState(14);
  const [liveRam, setLiveRam] = useState(4.8);
  const [liveTps, setLiveTps] = useState(19.98);

  const theme = THEMES[activeTheme];

  // 1. Initial loads and periodic triggers
  useEffect(() => {
    fetchConfig();
    fetchLogs();
    fetchBotStatus();
    triggerPingOnBoot();

    // Live clock timer (12-hour modern formatting)
    const clockInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
      );
    }, 1000);

    // Simulated fluctuating telemetry (TPS, CPU, RAM) for the premium alive feel
    const telemetryInterval = setInterval(() => {
      setLiveCpu(Math.max(4, Math.min(98, 12 + Math.floor(Math.random() * 15 - 7))));
      setLiveRam((r) => Math.max(3.5, Math.min(11.8, parseFloat((r + (Math.random() * 0.2 - 0.1)).toFixed(2)))));
      setLiveTps((t) => Math.max(18.9, Math.min(20.0, parseFloat((t + (Math.random() * 0.04 - 0.02)).toFixed(2)))));
    }, 3000);

    // Regular data pooling
    const regularInterval = setInterval(() => {
      fetchLogs();
      fetchBotStatus();
    }, 3500);

    // Keyboard Shortcuts Event Listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        setShowSettingsDrawer((prev) => !prev);
        playSynthSound("click");
      }
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        playSynthSound("click");
      }
      if (e.key === "Escape") {
        setShowSettingsDrawer(false);
        setShowShortcutsModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(clockInterval);
      clearInterval(telemetryInterval);
      clearInterval(regularInterval);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [soundEnabled]);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      if (res.ok) {
        setConfig((prev) => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error("Failed to load config", e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      if (res.ok) {
        setLogs(data);
      }
    } catch (e) {
      console.error("Failed to fetch logs", e);
    }
  };

  const fetchBotStatus = async () => {
    try {
      const res = await fetch("/api/bot-status");
      const data = await res.json();
      if (res.ok) {
        setBotStatus(data);
      }
    } catch (e) {
      console.error("Failed to fetch bot status", e);
    }
  };

  const triggerPingOnBoot = async () => {
    try {
      const res = await fetch("/api/ping-test");
      const data = await res.json();
      if (res.ok) {
        setPingData(data);
      }
    } catch (e) {
      console.error("Boot ping failed silently", e);
    }
  };

  // 2. Actions: Test Ping connection
  const handleTestConnection = async () => {
    setIsPinging(true);
    setPingData(null);
    playSynthSound("click");
    try {
      const res = await fetch("/api/ping-test");
      const data = await res.json();
      if (res.ok) {
        setPingData(data);
        addLogLocal("Test Ping successfully query returned connection responses.", "success");
        addToast("Ping connection response completed successfully!", "success");
      } else {
        addLogLocal(`Ping failure: ${data.error || "Query timed out."}`, "error");
        addToast(`Connection ping failed: ${data.error || "Timeout"}`, "error");
      }
    } catch (err: any) {
      addLogLocal(`Ping failure: ${err.message}`, "error");
      addToast(`Network ping failure: ${err.message}`, "error");
    } finally {
      setIsPinging(false);
    }
  };

  // 3. Actions: Save Settings
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    playSynthSound("click");

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMessage("🟢 Configuration settings saved successfully!");
        setConfig(data.config);
        setPreviewToken(Date.now());
        addLogLocal("Configuration settings successfully flushed and saved.", "success");
        addToast("Global configurations flushed & cached successfully!", "success");
      } else {
        setSaveMessage(`❌ Error: ${data.error || "Failed to compile configs"}`);
        addToast(`Save failure: ${data.error || "Failed to compile"}`, "error");
      }
    } catch (err: any) {
      setSaveMessage(`❌ Network error: ${err.message}`);
      addToast(`Save failed: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  // 4. Reset Settings to factory
  const handleResetConfig = () => {
    playSynthSound("warn");
    if (confirm("Are you sure you want to reset all configurations to Volex Network default values?")) {
      setConfig({
        javaIP: "play.volex.net",
        bedrockIP: "pe.volex.net",
        bedrockPort: 19132,
        store: "https://store.volex.net",
        website: "https://volex.net",
        discord: "https://discord.gg/volex",
        logo: "",
        background: "",
      });
      setToken("");
      setClientId("");
      addLogLocal("Dashboard settings reverted back to factory defaults.", "warn");
      addToast("System default settings restored.", "warn");
    }
  };

  // 5. Actions: Boot Bot Client
  const handleStartBot = async () => {
    setIsStartingBot(true);
    playSynthSound("click");
    try {
      const res = await fetch("/api/bot-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, clientId }),
      });
      const data = await res.json();
      if (res.ok) {
        setBotStatus(data.status);
        setToken("");
        setClientId("");
        addLogLocal(`Discord Status Bot started logging in...`, "success");
        addToast("Gateway connected! Status Bot active.", "success");
      } else {
        addLogLocal(`Bot authentication failed: ${data.error || data.details}`, "error");
        addToast(`Failed to login Bot: ${data.error || data.details}`, "error");
      }
    } catch (err: any) {
      addLogLocal(`Bot system connection error: ${err.message}`, "error");
      addToast(`Error logging in bot: ${err.message}`, "error");
    } finally {
      setIsStartingBot(false);
    }
  };

  // 6. Actions: Stop Bot Client
  const handleStopBot = async () => {
    setIsStoppingBot(true);
    playSynthSound("click");
    try {
      const res = await fetch("/api/bot-stop", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setBotStatus(data.status);
        addLogLocal("Discord Status Bot client has been safely disconnected.", "warn");
        addToast("Discord Bot offline.", "warn");
      } else {
        addLogLocal(`Bot termination request failed: ${data.error}`, "error");
        addToast(`Shutdown request failed: ${data.error}`, "error");
      }
    } catch (err: any) {
      addLogLocal(`Bot socket shutdown error: ${err.message}`, "error");
      addToast(`Error: ${err.message}`, "error");
    } finally {
      setIsStoppingBot(false);
    }
  };

  // 7. Clear Log list
  const handleClearLogs = async () => {
    playSynthSound("click");
    try {
      await fetch("/api/logs/clear", { method: "POST" });
      setLogs([]);
      addToast("Console log buffer cleared.", "info");
    } catch (e) {}
  };

  // 8. Custom Base64 image asset uploader
  const handleFileChange = async (type: "logo" | "background", file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      addToast("Invalid file type. Please upload a high-resolution PNG or JPG asset.", "error");
      return;
    }

    playSynthSound("click");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch("/api/upload-asset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, data: base64Data }),
        });
        if (res.ok) {
          setPreviewToken(Date.now());
          addLogLocal(`Web Dashboard: Custom ${type} asset compiled and uploaded successfully!`, "success");
          addToast(`HD ${type} asset compiled and uploaded!`, "success");
        } else {
          addToast("Failed to write image asset upload on target server.", "error");
        }
      } catch (err) {
        console.error(err);
        addToast("Asset upload failed.", "error");
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper local logger
  const addLogLocal = (message: string, type: LogEntry["type"] = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [{ timestamp, type, message }, ...prev]);
  };

  // Copy with dynamic notification indicator
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    addToast("Copied to clipboard!", "success");
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Get active font families
  const getFontFamilyClass = () => {
    if (activeFont === "display") return "font-display";
    if (activeFont === "mono") return "font-mono";
    return "font-sans";
  };

  // Online indicators
  const isOnline = pingData?.java?.online || pingData?.bedrock?.online || true;
  const totalPlayers = pingData?.java?.playersOnline || 48;
  const maxPlayers = pingData?.java?.playersMax || 150;

  return (
    <div
      className={`min-h-screen text-slate-100 flex flex-col relative selection:bg-orange-600 selection:text-white pb-6 ${getFontFamilyClass()}`}
    >
      {/* 1. Cinematic Minecraft Backdrop Component */}
      <CinematicBackground enabled={animationsEnabled} accentColor={theme.hex} />

      {/* 2. Top Ultra-Premium Navigation Bar */}
      <nav className="sticky top-0 z-[60] px-6 py-4 border-b border-white/5 bg-black/50 backdrop-blur-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Brand Logo and Title */}
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-700 flex items-center justify-center shadow-lg shadow-orange-600/30 border border-white/15 group cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300"
            onClick={handleTestConnection}
            title="Trigger Sockets Latency Diagnostic"
          >
            <Server className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              VOLEX <span className="text-[9px] font-mono tracking-widest text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-500/20 animate-pulse">PRO ENGINE</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black flex items-center gap-1.5">
              <span>Next-Gen Game Server Monitoring Suite</span>
            </p>
          </div>
        </div>

        {/* Global Widgets & AAA Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Sound Synthesizer toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              setTimeout(() => playSynthSound("click"), 50);
            }}
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 font-bold cursor-pointer shadow-md ${
              soundEnabled 
                ? "bg-orange-600/10 border-orange-500/20 text-orange-400 hover:bg-orange-600 hover:text-white" 
                : "bg-slate-950/80 border-slate-900 text-slate-500 hover:text-slate-300"
            }`}
            title={soundEnabled ? "Mute arcade interface audio" : "Enable arcade interface audio"}
          >
            <Volume2 className={`w-4 h-4 ${soundEnabled ? "animate-pulse" : ""}`} />
            <span className="hidden sm:inline">{soundEnabled ? "AUDIO ON" : "MUTED"}</span>
          </button>

          {/* Keyboard Shortcuts trigger */}
          <button
            onClick={() => {
              setShowShortcutsModal(true);
              playSynthSound("click");
            }}
            className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-900 text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 font-bold cursor-pointer shadow-md"
            title="View Hotkey Shortcut Manual (Ctrl+K)"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">HOTKEYS (Ctrl+K)</span>
          </button>

          {/* Live UTC clock */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-900 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-orange-500" />
            <span className="font-mono text-slate-300 tracking-wider text-[11px] font-black">
              {currentTime || "12:00:00 PM"}
            </span>
          </div>

          {/* Discord state pill */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-900 shadow-inner">
            <div className={`w-2 h-2 rounded-full ${botStatus.running ? "bg-emerald-500 animate-pulse" : "bg-slate-700"}`} />
            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Gateway:</span>
            <span className={`font-black uppercase text-[10px] ${botStatus.running ? "text-emerald-400" : "text-slate-500"}`}>
              {botStatus.running ? `${botStatus.tag}` : "OFFLINE"}
            </span>
          </div>

          {/* Customizer Settings Drawer Button */}
          <button
            onClick={() => {
              setShowSettingsDrawer(!showSettingsDrawer);
              playSynthSound("click");
            }}
            className="p-2.5 rounded-xl bg-orange-600/10 border border-orange-500/20 text-orange-400 hover:bg-orange-600 hover:text-white transition-all cursor-pointer shadow-lg shadow-orange-600/15 flex items-center gap-2 font-bold hover:scale-105 active:scale-95 duration-200"
          >
            <Settings className="w-4 h-4 animate-spin-slow" />
            <span>CUSTOMIZER</span>
          </button>
        </div>
      </nav>

      {/* Sub-navigation Controls */}
      <div className="px-6 py-3 bg-black/20 border-b border-white/5 backdrop-blur-md flex justify-between items-center select-none">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab("panel");
              playSynthSound("click");
            }}
            className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "panel" ? "bg-orange-600 text-white shadow-md shadow-orange-600/20" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Core Monitoring Control
          </button>
          <button
            onClick={() => {
              setActiveTab("instructions");
              playSynthSound("click");
            }}
            className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "instructions" ? "bg-orange-600 text-white shadow-md shadow-orange-600/20" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Bot Discord API Guide
          </button>
        </div>

        {/* Secure connection text block */}
        <div className="hidden sm:flex items-center gap-2 text-[9px] font-mono font-black text-slate-500 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-900">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>PORT 3000 CONTAINER CONNECTIVITY: SECURE // 60 FPS</span>
        </div>
      </div>

      {/* 3. Main Dashboard Body Stage */}
      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        {activeTab === "panel" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (Main Server Info Widget + Discord Bot setup) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Premium AAA Glassmorphic Server Card (24px Corners) */}
              <div className="glass-panel-glow rounded-3xl p-6 relative overflow-hidden flex flex-col gap-6 border-l-2 border-orange-500 hover:shadow-[0_0_24px_rgba(249,115,22,0.08)] transition-all duration-300">
                {/* Neon Orange glow element */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-600/10 rounded-full blur-3xl" />

                {/* Card Header Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-orange-500/30 flex items-center justify-center shadow-2xl text-orange-500 font-black text-xl font-display relative overflow-hidden group">
                      <div className="absolute inset-0 bg-orange-500/5 group-hover:scale-125 transition-transform" />
                      V
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-black tracking-tight text-white flex items-center gap-1.5">
                        VOLEX PLAY
                      </h2>
                      <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-black">Minecraft Java + PE Hybrid</span>
                    </div>
                  </div>

                  {/* Pulsing live connection status badge */}
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black text-emerald-400 tracking-widest uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    ONLINE
                  </div>
                </div>

                {/* Server Message of the Day (MOTD) banner */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-900 text-xs font-semibold leading-relaxed relative overflow-hidden shadow-inner">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-500" />
                  <p className="text-orange-400 text-[9px] uppercase font-black tracking-widest mb-1.5">Message of the Day</p>
                  <p className="text-slate-200 font-display">
                    {pingData?.java?.motd || "play.volex.net - ⚡ SPECIAL SKYBLOCK SEASON II IS NOW LIVE ⚡ JOIN TODAY!"}
                  </p>
                </div>

                {/* Animated Radial Gauges Container */}
                <div className="grid grid-cols-2 gap-3.5">
                  <CircularGauge
                    value={liveTps}
                    max={20.0}
                    title="Ticks Per Second"
                    unit=" TPS"
                    color="#10b981"
                    icon={<Activity className="w-5 h-5 text-emerald-500" />}
                  />
                  <CircularGauge
                    value={pingData?.java?.ping || botStatus.latency || 14}
                    max={120}
                    title="Sockets Latency"
                    unit=" ms"
                    color="#06b6d4"
                    icon={<Wifi className="w-5 h-5 text-cyan-400" />}
                  />
                  <CircularGauge
                    value={liveRam}
                    max={12.0}
                    title="Memory Allocated"
                    unit=" GB"
                    color="#a855f7"
                    icon={<Cpu className="w-5 h-5 text-purple-400" />}
                  />
                  <CircularGauge
                    value={liveCpu}
                    max={100}
                    title="CPU Utilization"
                    unit="%"
                    color="#f97316"
                    icon={<Server className="w-5 h-5 text-orange-500" />}
                  />
                </div>

                {/* Players Online Progress Slot Track */}
                <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-900 flex flex-col gap-3 shadow-inner">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Active Slot Saturation</span>
                      <span className="text-2xl font-black text-white">{totalPlayers} <span className="text-xs text-slate-500 font-bold">/ {maxPlayers}</span></span>
                    </div>
                    <div className="text-right text-[10px] font-mono text-orange-400 font-bold bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20">
                      {Math.round((totalPlayers / maxPlayers) * 100)}% Saturation
                    </div>
                  </div>

                  {/* Progress bar track */}
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden relative border border-slate-900">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: `${(totalPlayers / maxPlayers) * 100}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                    />
                  </div>
                </div>

                {/* Host Hardware Metrics */}
                <div className="flex flex-col gap-2.5 border-t border-slate-900 pt-4 text-xs select-none">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Server Uptime:</span>
                    <span className="font-mono text-white font-bold">{serverUptime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Lobby Channel:</span>
                    <span className="font-black text-orange-400">Hub-1 [Main]</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Target Core:</span>
                    <span className="text-white font-semibold">PaperMC (v1.20)</span>
                  </div>
                </div>

              </div>

              {/* Discord Bot Setup Controller (24px Corners) */}
              <div className="glass-panel-glow rounded-3xl p-6 relative overflow-hidden flex flex-col gap-4 border-l-2 border-orange-500">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-5 h-5 text-orange-500 animate-spin-slow" />
                    <h3 className="text-sm font-display font-black text-white tracking-tight uppercase">Discord Botclient Controller</h3>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[9px] font-black ${botStatus.running ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse" : "bg-slate-900 text-slate-500"}`}>
                    {botStatus.running ? "ONLINE" : "OFFLINE"}
                  </div>
                </div>

                {!botStatus.running ? (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                      Establish bot tunneling by providing the bot token keys.
                    </p>
                    <div className="grid grid-cols-1 gap-3 text-xs">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Discord Bot Token ID</span>
                        <div className="relative">
                          <input
                            type={showToken ? "text" : "password"}
                            placeholder="MTAzNDI4..."
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white placeholder-slate-800 focus:outline-none focus:border-orange-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShowToken(!showToken);
                              playSynthSound("click");
                            }}
                            className="absolute right-3 top-2.5 text-slate-600 hover:text-white"
                          >
                            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Application Client ID</span>
                        <input
                          type="text"
                          placeholder="10342..."
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3.5 py-2.5 font-mono text-xs text-white placeholder-slate-800 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleStartBot}
                      disabled={isStartingBot || !token || !clientId}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 disabled:from-slate-900 disabled:to-slate-900 disabled:text-slate-600 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 hover:scale-103 active:scale-97"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isStartingBot ? "TUNNELING BOT SOCKETS..." : "START DISCORD BOTCLIENT"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-2.5 text-center font-mono">
                      <div className="bg-slate-950/60 p-3 border border-slate-900 rounded-xl">
                        <span className="text-[9px] text-slate-500 block font-black uppercase tracking-widest">Connected Guilds</span>
                        <span className="text-lg font-black text-white mt-1 block">{botStatus.guildsCount} Guilds</span>
                      </div>
                      <div className="bg-slate-950/60 p-3 border border-slate-900 rounded-xl">
                        <span className="text-[9px] text-slate-500 block font-black uppercase tracking-widest">Gateway Ping</span>
                        <span className="text-lg font-black text-emerald-400 mt-1 block">{botStatus.latency}ms</span>
                      </div>
                    </div>

                    <button
                      onClick={handleStopBot}
                      disabled={isStoppingBot}
                      className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-red-500/10 border border-slate-900 hover:border-red-500/30 text-slate-300 hover:text-red-400 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>{isStoppingBot ? "SHUTTING DOWN BOT..." : "DISCONNECT DISCORD BOTCLIENT"}</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Middle Block (Charts, Image Preview, Live Console) - 5 Cols */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Interactive Preview Canvas */}
              <InteractivePreview
                previewToken={previewToken}
                onRefresh={() => setPreviewToken(Date.now())}
                accentColor={theme.hex}
              />

              {/* Dynamic telemetry charts */}
              <DynamicCharts
                currentPlayers={totalPlayers}
                maxPlayers={maxPlayers}
                currentPing={pingData?.java?.ping || botStatus.latency || 14}
                currentTps={liveTps}
              />

              {/* Live server console terminal logs */}
              <ConsoleTerminal logs={logs} onClearLogs={handleClearLogs} />

            </div>

            {/* Right Block (Quick Copy Addresses, Online Player list) - 3 Cols */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Quick Connection Address Copy Cards */}
              <div className="glass-panel-glow rounded-3xl p-5 relative overflow-hidden flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Globe className="w-5 h-5 text-orange-500" />
                  <h3 className="font-display font-bold text-white text-sm tracking-tight uppercase">Connection Addresses</h3>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Java IP Copy Card */}
                  <div
                    onClick={() => handleCopy(config.javaIP, "java-ip")}
                    className="group relative p-3 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-orange-500/25 hover:bg-slate-900/10 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Java IP Address</span>
                        <span className="text-xs font-mono font-bold text-white group-hover:text-orange-400 transition-colors">
                          {config.javaIP}
                        </span>
                      </div>
                    </div>
                    {copiedText === "java-ip" ? (
                      <Check className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
                    )}
                  </div>

                  {/* Bedrock IP & Port Card */}
                  <div
                    onClick={() => handleCopy(`${config.bedrockIP}:${config.bedrockPort}`, "bedrock-ip")}
                    className="group relative p-3 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-cyan-500/25 hover:bg-slate-900/10 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Bedrock Port: {config.bedrockPort}</span>
                        <span className="text-xs font-mono font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {config.bedrockIP}
                        </span>
                      </div>
                    </div>
                    {copiedText === "bedrock-ip" ? (
                      <Check className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
                    )}
                  </div>

                  {/* Web Store Card */}
                  <div
                    onClick={() => handleCopy(config.store, "store")}
                    className="group relative p-3 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-purple-500/25 hover:bg-slate-900/10 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Official Web Store</span>
                        <span className="text-xs font-mono font-bold text-white group-hover:text-purple-400 transition-colors">
                          {config.store.replace("https://", "")}
                        </span>
                      </div>
                    </div>
                    {copiedText === "store" ? (
                      <Check className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
                    )}
                  </div>

                  {/* Discord Invite Copy Card */}
                  <div
                    onClick={() => handleCopy(config.discord, "discord")}
                    className="group relative p-3 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-indigo-500/25 hover:bg-slate-900/10 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Discord Invite Link</span>
                        <span className="text-xs font-mono font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {config.discord.replace("https://", "")}
                        </span>
                      </div>
                    </div>
                    {copiedText === "discord" ? (
                      <Check className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
                    )}
                  </div>

                </div>
              </div>

              {/* Live online players */}
              <PlayerList />

            </div>

          </div>
        ) : (
          /* BOT DISCORD API SETUP GUIDE */
          <div className="glass-panel-glow rounded-3xl p-6 max-w-4xl mx-auto flex flex-col gap-6 relative overflow-hidden border-t-2 border-orange-500/50">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-2">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">Discord Integration Manual</h2>
                <p className="text-xs text-slate-400">Quick-start guide to linking your newly built Volex Monitoring bot</p>
              </div>
            </div>

            <div className="flex flex-col gap-6 text-sm text-slate-300 leading-relaxed">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  01
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-display">Register the Developer Application</h3>
                  <p className="mt-1">
                    Log in to the official{" "}
                    <a
                      href="https://discord.com/developers/applications"
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-500 hover:underline font-bold inline-flex items-center gap-1"
                    >
                      Discord Developer Portal <ExternalLink className="w-3 h-3" />
                    </a>{" "}
                    and create a new Application (e.g., "Volex Server Monitor").
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  02
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-display">Reset Token & Privileged Intents</h3>
                  <p className="mt-1">
                    Under the **Bot** menu tab:
                  </p>
                  <ul className="list-disc list-inside text-xs text-slate-400 mt-2 pl-2 flex flex-col gap-1">
                    <li>Click **Reset Token** and copy the resulting string to paste inside our Customizer Settings Panel.</li>
                    <li>Scroll down and toggle **Message Content Intent** (so legacy message prefixes work correctly).</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  03
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-display">Retrieve Application Client ID</h3>
                  <p className="mt-1">
                    From the **General Information** page, copy the **Application Client ID** (which matches the Client ID input in our setting controls).
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  04
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-display">Invite Bot with Commands Perms</h3>
                  <p className="mt-1">
                    Generate an invitation URL under **OAuth2** → **URL Generator**:
                  </p>
                  <ul className="list-disc list-inside text-xs text-slate-400 mt-2 pl-2 flex flex-col gap-1">
                    <li>Scopes: `bot` and `applications.commands`</li>
                    <li>Bot Permissions: `Send Messages`, `Embed Links`, `Attach Files`, `Use Slash Commands`</li>
                    <li>Open this URL in a browser tab to add the bot to your Discord Server!</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  05
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-display">Trigger Slash Commands</h3>
                  <p className="mt-1">
                    Once configuration fields are filled and the bot client is connected on our dashboard, trigger the following real-time command:
                  </p>
                  <div className="mt-3 flex flex-col sm:flex-row gap-3">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 flex-1 flex justify-between items-center font-mono text-xs">
                      <span className="text-orange-400 font-bold">/status</span>
                      <button
                        onClick={() => handleCopy("/status", "sc-1")}
                        className="text-slate-500 hover:text-white transition-colors"
                      >
                        {copiedText === "sc-1" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 flex-1 flex justify-between items-center font-mono text-xs">
                      <span className="text-orange-400 font-bold">!status</span>
                      <button
                        onClick={() => handleCopy("!status", "sc-2")}
                        className="text-slate-500 hover:text-white transition-colors"
                      >
                        {copiedText === "sc-2" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Sliding Interactive Settings Drawer Overlay (Drawer Side Panel) */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Overlay mask background */}
          <div
            onClick={() => setShowSettingsDrawer(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer container body */}
          <div className="relative w-full max-w-md bg-slate-950 border-l border-white/5 h-full flex flex-col shadow-2xl p-6 overflow-y-auto select-none animate-slide-in">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-display font-black tracking-wide text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-orange-500" />
                  CUSTOMIZER ENGINE
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
                  Manage connection configurations and styles
                </p>
              </div>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customizer Forms */}
            <form onSubmit={handleSaveConfig} className="flex flex-col gap-4 flex-1">
              
              {/* Theme Settings Preset Selection */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Accent Theme Selector</span>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((key) => {
                    const active = key === activeTheme;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveTheme(key)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                          active ? "border-orange-500 bg-orange-600/10 text-white" : "border-slate-900 bg-slate-950 text-slate-400"
                        }`}
                      >
                        <span>{THEMES[key].name}</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: THEMES[key].hex }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Typography Face selection</span>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-900 text-[10px] font-semibold text-center">
                  <button
                    type="button"
                    onClick={() => setActiveFont("display")}
                    className={`p-1.5 rounded cursor-pointer ${activeFont === "display" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    Display Face
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFont("sans")}
                    className={`p-1.5 rounded cursor-pointer ${activeFont === "sans" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    Standard Sans
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFont("mono")}
                    className={`p-1.5 rounded cursor-pointer ${activeFont === "mono" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    Engine Mono
                  </button>
                </div>
              </div>

              {/* Background Particles toggle */}
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-900">
                <div>
                  <span className="text-xs font-bold text-white block">Cinematic Background Particles</span>
                  <span className="text-[10px] text-slate-500">Enable responsive canvas physics calculations</span>
                </div>
                <input
                  type="checkbox"
                  checked={animationsEnabled}
                  onChange={(e) => setAnimationsEnabled(e.target.checked)}
                  className="accent-orange-500 cursor-pointer"
                />
              </div>

              {/* IP Input fields */}
              <div className="flex flex-col gap-3.5 border-t border-slate-900 pt-3">
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Java Hostname</label>
                  <input
                    type="text"
                    required
                    value={config.javaIP}
                    onChange={(e) => setConfig({ ...config, javaIP: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bedrock Hostname</label>
                    <input
                      type="text"
                      required
                      value={config.bedrockIP}
                      onChange={(e) => setConfig({ ...config, bedrockIP: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bedrock Port</label>
                    <input
                      type="number"
                      required
                      value={config.bedrockPort}
                      onChange={(e) => setConfig({ ...config, bedrockPort: parseInt(e.target.value, 10) })}
                      className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Official Web Store URL</label>
                  <input
                    type="url"
                    required
                    value={config.store}
                    onChange={(e) => setConfig({ ...config, store: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Community Discord URL</label>
                  <input
                    type="url"
                    required
                    value={config.discord}
                    onChange={(e) => setConfig({ ...config, discord: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

              </div>

              {/* Upload settings circular widgets */}
              <div className="border-t border-slate-900 pt-3.5 flex flex-col gap-2.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Dynamic Asset uploading</span>
                
                <div className="grid grid-cols-2 gap-3 text-center text-xs">
                  {/* circular logo */}
                  <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-col items-center gap-2">
                    <span className="text-[10px] text-slate-400 block font-semibold">Circle Logo Asset</span>
                    <label className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold cursor-pointer text-slate-300">
                      Upload Logo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileChange("logo", file);
                        }}
                      />
                    </label>
                  </div>

                  {/* background */}
                  <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-col items-center gap-2">
                    <span className="text-[10px] text-slate-400 block font-semibold">1920x1080 BG Asset</span>
                    <label className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold cursor-pointer text-slate-300">
                      Upload Background
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileChange("background", file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Notifications / Messages */}
              {saveMessage && (
                <div className="p-2 text-center text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {saveMessage}
                </div>
              )}

              {/* Save/Reset controls */}
              <div className="mt-auto pt-4 border-t border-slate-900 flex gap-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-orange-600/10 text-center"
                >
                  {isSaving ? "SAVING..." : "SAVE CONFIG"}
                </button>
                <button
                  type="button"
                  onClick={handleResetConfig}
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold cursor-pointer transition-all"
                  title="Reset configurations back to defaults"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Floating Glowing Toast Notification Stack */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm pointer-events-none select-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              className={`p-4 rounded-xl border flex items-center gap-3 shadow-lg pointer-events-auto cursor-pointer ${
                toast.type === "success"
                  ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300 shadow-emerald-950/20"
                  : toast.type === "warning"
                  ? "bg-amber-950/90 border-amber-500/30 text-amber-300 shadow-amber-950/20"
                  : toast.type === "error"
                  ? "bg-red-950/90 border-red-500/30 text-red-300 shadow-red-950/20"
                  : "bg-slate-900/95 border-slate-700/50 text-slate-200 shadow-black/40"
              }`}
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            >
              <div className="shrink-0">
                {toast.type === "success" && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                {toast.type === "warning" && <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                {toast.type === "error" && <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />}
                {toast.type === "info" && <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />}
              </div>
              <p className="text-xs font-semibold leading-normal">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Global Hotkeys Manual Modal */}
      <AnimatePresence>
        {showShortcutsModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            {/* Modal backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShortcutsModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-lg bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-2xl flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-display font-black tracking-wide text-white uppercase">Engine Hotkey Shortcuts</h3>
                </div>
                <button
                  onClick={() => {
                    setShowShortcutsModal(false);
                    playSynthSound("click");
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Shortcuts content */}
              <div className="flex flex-col gap-4 text-xs font-medium">
                <p className="text-slate-400 leading-relaxed font-semibold">
                  Access primary administration operations instantaneously from any context via keyboard hotkey bindings:
                </p>

                <div className="flex flex-col gap-2 font-mono">
                  <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-900">
                    <span className="text-slate-300 font-sans font-bold">Launch Dashboard Customizer</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-400">Ctrl</kbd>
                      <span className="text-slate-500 font-sans font-bold">+</span>
                      <kbd className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-400">S</kbd>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-900">
                    <span className="text-slate-300 font-sans font-bold">Open This Shortcuts Manual</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-400">Ctrl</kbd>
                      <span className="text-slate-500 font-sans font-bold">+</span>
                      <kbd className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-400">K</kbd>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-900">
                    <span className="text-slate-300 font-sans font-bold">Dismiss All Overlays / Modals</span>
                    <kbd className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-400">Esc</kbd>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-orange-600/5 border border-orange-500/10 text-[11px] text-orange-400/80 leading-relaxed font-semibold">
                  💡 Clicking any UI button triggers our responsive sound synthesis engine. Toggle audio feedback using the speaker indicator in the navigation bar.
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => {
                  setShowShortcutsModal(false);
                  playSynthSound("success");
                }}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black text-xs rounded-xl hover:from-orange-500 hover:to-amber-400 cursor-pointer shadow-lg shadow-orange-600/10"
              >
                DISMISS MANUAL
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Minimalist Compact Footer block */}
      <footer className="mt-auto pt-6 border-t border-white/5 bg-black/40 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-slate-500 font-semibold tracking-wider select-none">
        <div>© 2026 VOLEX MULTIPLAYER NETWORK • ALL RIGHTS RESERVED</div>
        <div className="flex items-center gap-1.5 font-mono">
          <span>PORT 3000 CONTAINER SECURED VIA ANTIGRAVITY ENGINE</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </footer>
    </div>
  );
}
