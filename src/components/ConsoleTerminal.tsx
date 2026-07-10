import React, { useState, useEffect, useRef } from "react";
import { Terminal, Trash2, Search, Filter, Download, ArrowDown, ChevronRight, Play, Sparkles, Check, Info } from "lucide-react";
import { LogEntry } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ConsoleTerminalProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

const COMMAND_SUGGESTIONS = [
  "/help",
  "/status",
  "/reload",
  "/tps",
  "/ping",
  "/gc",
  "/whitelist add",
  "/whitelist list",
  "/op",
  "/deop",
  "/restart",
  "/say"
];

export default function ConsoleTerminal({ logs, onClearLogs }: ConsoleTerminalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | "info" | "success" | "warn" | "error">("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const [simulatedCmd, setSimulatedCmd] = useState("");
  const [simulatedLogs, setSimulatedLogs] = useState<LogEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll within the console ONLY, leaving webpage scroll untouched
  useEffect(() => {
    if (autoScroll && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [logs, simulatedLogs, autoScroll]);

  // Handle command submissions
  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedCmd.trim()) return;

    const cmdToSubmit = simulatedCmd;
    setSimulatedCmd("");
    setShowSuggestions(false);
    setIsTyping(true);

    const timestamp = new Date().toLocaleTimeString();
    const newLog: LogEntry = {
      timestamp,
      type: "success",
      message: `RCON_GATEWAY [3000]: Executing cmd "${cmdToSubmit}" on root instance...`
    };

    setSimulatedLogs((prev) => [...prev, newLog]);

    // Simulate RCON typing feedback and delayed execution
    setTimeout(() => {
      let responseMsg = "RCON_GATEWAY: Command compiled successfully. 0 errors detected.";
      let type: LogEntry["type"] = "info";

      const lowercaseCmd = cmdToSubmit.toLowerCase().trim();
      if (lowercaseCmd.includes("help")) {
        responseMsg = "RCON_GATEWAY: Available interfaces: /status, /reload, /tps, /ping, /gc, /help, /whitelist";
      } else if (lowercaseCmd.includes("tps")) {
        responseMsg = "RCON_MONITOR: TPS (1m, 5m, 15m): 20.00, 19.99, 19.98. Health index: 100% (STABLE)";
        type = "success";
      } else if (lowercaseCmd.includes("reload")) {
        responseMsg = "RCON_GATEWAY: Re-reading server properties files... 14 active hooks reloaded.";
        type = "warn";
      } else if (lowercaseCmd.includes("status")) {
        responseMsg = "RCON_MONITOR: Active threads: 42. Connections secured: 8. RAM offset: +0.12GB/s.";
      } else if (lowercaseCmd.includes("ping")) {
        responseMsg = "RCON_MONITOR: RCON connection ping is 3ms (Local container loopback).";
      } else if (lowercaseCmd.includes("whitelist")) {
        responseMsg = "RCON_ADMIN: Whitelist registry updated. 1 changes cached.";
        type = "success";
      } else if (lowercaseCmd.includes("restart")) {
        responseMsg = "RCON_GATEWAY_ALERT: Root container reboot requested. Operation deferred.";
        type = "error";
      }

      setSimulatedLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          type,
          message: responseMsg
        }
      ]);
      setIsTyping(false);
    }, 900);
  };

  const allLogs = [...logs, ...simulatedLogs];

  const filteredLogs = allLogs.filter((log) => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "all" ? true : log.type === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  // Download log file helper
  const handleDownloadLogs = () => {
    const text = filteredLogs
      .map((log) => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `volex-console-logs-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Modern terminal syntax highlighting for parameters, numbers, brackets
  const highlightMessage = (message: string) => {
    const parts = message.split(/(\d+(?:\.\d+)?|\[.*?\]|cmd ".*?"|".*?"|RCON_[A-Z_]+|play\.volex\.net)/g);
    return parts.map((part, index) => {
      if (/^\d+(?:\.\d+)?$/.test(part)) {
        return <span key={index} className="text-cyan-400 font-bold">{part}</span>;
      }
      if (/^\[.*?\]$/.test(part)) {
        return <span key={index} className="text-slate-500 font-semibold">{part}</span>;
      }
      if (/^(cmd ".*?"|".*?")$/.test(part)) {
        return <span key={index} className="text-orange-400 font-medium">{part}</span>;
      }
      if (/^RCON_[A-Z_]+$/.test(part)) {
        return <span key={index} className="text-purple-400 font-bold">{part}</span>;
      }
      if (part === "play.volex.net") {
        return <span key={index} className="text-amber-400 underline">{part}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Get matching command suggestions based on current typing
  const getSuggestions = () => {
    if (!simulatedCmd.trim()) return [];
    const typed = simulatedCmd.toLowerCase();
    return COMMAND_SUGGESTIONS.filter((cmd) => cmd.startsWith(typed) || cmd.includes(typed));
  };

  const suggestions = getSuggestions();

  return (
    <div className="glass-panel-glow rounded-2xl p-5 relative overflow-hidden flex flex-col gap-4">
      {/* Top micro line highlighter */}
      <div className="absolute top-0 left-10 w-40 h-[1px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

      {/* Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 shadow-inner">
            <Terminal className="w-5 h-5 text-orange-500 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-sm tracking-wide uppercase flex items-center gap-2">
              LIVE CONSOLE LOGS & REMOTE RCON
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Secure RCON tunneling secured via container port 3000</p>
          </div>
        </div>

        {/* Console control actions */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onClearLogs}
            className="px-3 py-1.5 rounded-lg bg-slate-950/80 hover:bg-red-500/10 hover:text-red-400 border border-slate-900 transition-all flex items-center gap-1.5 text-slate-400 cursor-pointer text-[11px] font-bold"
            title="Purge logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
          <button
            onClick={handleDownloadLogs}
            disabled={filteredLogs.length === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-900 text-slate-300 hover:text-white disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer text-[11px] font-bold shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Live Log filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search terminal entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-900 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors font-mono"
          />
        </div>

        {/* Severity Filter */}
        <div className="sm:col-span-4 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={severityFilter}
            onChange={(e: any) => setSeverityFilter(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-900 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 font-semibold"
          >
            <option value="all">All Console Entries</option>
            <option value="info">Info Levels</option>
            <option value="success">Success Actions</option>
            <option value="warn">Warnings</option>
            <option value="error">Critical Errors</option>
          </select>
        </div>

        {/* Auto Scroll toggle */}
        <div className="sm:col-span-2 flex items-center justify-end">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-400 select-none hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="accent-orange-500 w-3.5 h-3.5 rounded"
            />
            AutoScroll
          </label>
        </div>
      </div>

      {/* Logs output console box */}
      <div className="relative">
        <div 
          ref={terminalContainerRef} 
          className="h-[210px] bg-slate-950/90 border border-slate-900 rounded-xl p-4 font-mono text-[11px] leading-relaxed overflow-y-auto flex flex-col gap-2 text-slate-300 relative scroll-smooth"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-slate-600 italic text-center py-16 flex flex-col items-center justify-center gap-1">
              <Info className="w-5 h-5 text-slate-700 animate-pulse" />
              <span>Console terminal is active. Waiting for system inputs...</span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filteredLogs.map((log, index) => {
                let pillStyle = "bg-slate-900 text-slate-400 border-slate-800";
                let textStyle = "text-slate-300";

                if (log.type === "error") {
                  pillStyle = "bg-red-500/10 text-red-500 border-red-500/20";
                  textStyle = "text-red-400 font-bold";
                } else if (log.type === "warn") {
                  pillStyle = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
                  textStyle = "text-yellow-400 font-medium";
                } else if (log.type === "success") {
                  pillStyle = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                  textStyle = "text-emerald-400 font-semibold";
                }

                return (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex gap-2.5 items-start hover:bg-white/3 p-0.5 rounded transition-colors"
                  >
                    <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] shrink-0 border font-bold ${pillStyle}`}>
                      {log.type.toUpperCase()}
                    </span>
                    <span className={`${textStyle} whitespace-pre-wrap break-all`}>
                      {highlightMessage(log.message)}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {/* Simulated loading indicator */}
          {isTyping && (
            <div className="flex items-center gap-1.5 text-slate-500 italic mt-1 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: "0.4s" }} />
              <span>Compiling RCON response payload...</span>
            </div>
          )}
        </div>

        {/* Scanline atmospheric visual */}
        <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-slate-950/40 to-transparent pointer-events-none rounded-t-xl" />
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none rounded-b-xl" />

        {/* RCON Secure Seal Tag */}
        <div className="absolute bottom-3 right-4 text-[9px] text-slate-500 select-none bg-slate-950/95 px-2 py-0.5 rounded border border-slate-900 font-bold uppercase tracking-wider">
          TUNNEL: ACTIVE // RCON-SECURE
        </div>
      </div>

      {/* Command RCON Input Form */}
      <div className="relative">
        {/* Floating Autocomplete Suggestions Panel */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 mb-2 w-full max-w-sm bg-slate-950/95 border border-slate-900 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-xl max-h-48 overflow-y-auto"
            >
              <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold px-2 py-1 border-b border-slate-900 mb-1">
                Command Suggestions
              </div>
              <div className="flex flex-col gap-1">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSimulatedCmd(sug);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white hover:bg-orange-500/10 hover:border-orange-500/20 border border-transparent transition-all cursor-pointer flex justify-between items-center"
                  >
                    <span>{sug}</span>
                    <span className="text-[9px] text-slate-500 font-sans">Autocomplete</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSendCommand} className="flex gap-2">
          <div className="flex-1 bg-slate-950/80 border border-slate-900 rounded-lg px-3.5 py-2.5 flex items-center gap-2 focus-within:border-orange-500 transition-colors">
            <ChevronRight className="w-4 h-4 text-orange-500 shrink-0" />
            <input
              type="text"
              placeholder="Type client command (e.g., /status, /reload, /tps, /help)..."
              value={simulatedCmd}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onChange={(e) => {
                setSimulatedCmd(e.target.value);
                setShowSuggestions(true);
              }}
              className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-600 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={!simulatedCmd.trim() || isTyping}
            className="bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-600/10 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Execute</span>
          </button>
        </form>
      </div>
    </div>
  );
}
