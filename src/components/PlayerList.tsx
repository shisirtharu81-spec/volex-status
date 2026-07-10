import React, { useState, useEffect } from "react";
import { Users, Search, ChevronRight, Sparkles, Flame, Shield, Trophy, Zap, AlertCircle, PlusCircle, MinusCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Player {
  uuid: string;
  name: string;
  rank: "OWNER" | "ADMIN" | "VIP" | "MVP" | "PLAYER";
  ping: number;
  playtime: string;
  avatar: string;
}

const PLAYER_PRESETS: Player[] = [
  { uuid: "1", name: "xd_suraj", rank: "OWNER", ping: 14, playtime: "14h 32m", avatar: "https://crafatar.com/avatars/606e2ff0-ed77-4870-9166-ef18ca0b8c0a?size=32&overlay" },
  { uuid: "2", name: "Steve_Builds", rank: "ADMIN", ping: 22, playtime: "4h 12m", avatar: "https://crafatar.com/avatars/853c800f-1c48-4953-97ec-29fa596d4e28?size=32&overlay" },
  { uuid: "3", name: "ChronoTech", rank: "MVP", ping: 8, playtime: "8h 45m", avatar: "https://crafatar.com/avatars/d1a1b412-f04b-4b13-bb11-4cb50ff8e519?size=32&overlay" },
  { uuid: "4", name: "NeonPvP", rank: "VIP", ping: 18, playtime: "2h 30m", avatar: "https://crafatar.com/avatars/f2e15fa1-320c-4395-9762-cb67fc7e8ca3?size=32&overlay" },
  { uuid: "5", name: "MineGamer99", rank: "PLAYER", ping: 34, playtime: "1h 15m", avatar: "https://crafatar.com/avatars/223ff8c1-6677-432b-9833-caab8c0a8c2d?size=32&overlay" },
  { uuid: "6", name: "Sky_Blocker", rank: "PLAYER", ping: 45, playtime: "3h 04m", avatar: "https://crafatar.com/avatars/a11ff5a1-4389-4b11-9122-cca8c0a8d42d?size=32&overlay" }
];

const BACKUP_POOL: Player[] = [
  { uuid: "10", name: "LavaWalker", rank: "MVP", ping: 16, playtime: "12h 05m", avatar: "https://crafatar.com/avatars/22c0fffa-77aa-34df-9112-ef18ca0b8d2d?size=32&overlay" },
  { uuid: "11", name: "Enderman_1", rank: "VIP", ping: 28, playtime: "3h 55m", avatar: "https://crafatar.com/avatars/443ffea1-55bb-234e-8843-cbab8c0a8ca5?size=32&overlay" },
  { uuid: "12", name: "HerobrineGhost", rank: "PLAYER", ping: 4, playtime: "115h 12m", avatar: "https://crafatar.com/avatars/a12bbca3-dd22-4a11-cc22-a1bb22c0a811?size=32&overlay" },
  { uuid: "13", name: "DiamondMiner", rank: "PLAYER", ping: 52, playtime: "1h 45m", avatar: "https://crafatar.com/avatars/fa8b3ff1-332a-43cf-9832-da23fc8c0b22?size=32&overlay" }
];

export default function PlayerList() {
  const [players, setPlayers] = useState<Player[]>(PLAYER_PRESETS);
  const [searchTerm, setSearchTerm] = useState("");
  const [activityFeed, setActivityFeed] = useState<{ id: number; message: string; type: "join" | "leave" } | null>(null);

  // Fluctuating pings and simulated player joins/leaves
  useEffect(() => {
    // 1. Regular ping fluctuation
    const pingTimer = setInterval(() => {
      setPlayers((prev) =>
        prev.map((player) => {
          const deltaPing = Math.floor(Math.random() * 6) - 3;
          const newPing = Math.max(4, Math.min(120, player.ping + deltaPing));
          return {
            ...player,
            ping: newPing
          };
        })
      );
    }, 4000);

    // 2. Simulated join/leave events (Every 16s)
    const joinLeaveTimer = setInterval(() => {
      const triggerType = Math.random() > 0.5 ? "join" : "leave";

      if (triggerType === "join" && players.length < 8) {
        // Grab a candidate that is not online
        const offlineCandidates = BACKUP_POOL.filter(
          (cand) => !players.some((p) => p.name === cand.name)
        );
        if (offlineCandidates.length > 0) {
          const newPlayer = offlineCandidates[Math.floor(Math.random() * offlineCandidates.length)];
          setPlayers((prev) => [...prev, newPlayer]);
          triggerActivityFeed(`${newPlayer.name} connected to the server.`, "join");
        }
      } else if (triggerType === "leave" && players.length > 3) {
        // Exclude Owner or Admin (uuid 1 or 2)
        const candidates = players.filter((p) => p.uuid !== "1" && p.uuid !== "2");
        if (candidates.length > 0) {
          const leavingPlayer = candidates[Math.floor(Math.random() * candidates.length)];
          setPlayers((prev) => prev.filter((p) => p.uuid !== leavingPlayer.uuid));
          triggerActivityFeed(`${leavingPlayer.name} disconnected from the network.`, "leave");
        }
      }
    }, 16000);

    return () => {
      clearInterval(pingTimer);
      clearInterval(joinLeaveTimer);
    };
  }, [players]);

  const triggerActivityFeed = (message: string, type: "join" | "leave") => {
    setActivityFeed({ id: Date.now(), message, type });
    setTimeout(() => setActivityFeed(null), 5000);
  };

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRankBadge = (rank: Player["rank"]) => {
    switch (rank) {
      case "OWNER":
        return {
          label: "OWNER",
          style: "bg-red-500/10 text-red-400 border border-red-500/30",
          icon: <Flame className="w-3 h-3 text-red-400 fill-current" />
        };
      case "ADMIN":
        return {
          label: "ADMIN",
          style: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
          icon: <Shield className="w-3 h-3 text-orange-400" />
        };
      case "MVP":
        return {
          label: "MVP++",
          style: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30",
          icon: <Trophy className="w-3 h-3 text-cyan-400" />
        };
      case "VIP":
        return {
          label: "VIP+",
          style: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
          icon: <Sparkles className="w-3 h-3 text-emerald-400" />
        };
      case "PLAYER":
        return {
          label: "PLAYER",
          style: "bg-slate-800 text-slate-400 border border-slate-700/50",
          icon: <Zap className="w-3 h-3 text-slate-400" />
        };
    }
  };

  return (
    <div className="glass-panel-glow rounded-2xl p-5 relative overflow-hidden flex flex-col gap-4">
      {/* Glow asset */}
      <div className="absolute top-0 right-10 w-40 h-[1px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

      {/* Header Block */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 shadow-inner">
            <Users className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-sm tracking-wide uppercase">
              LIVE ONLINE PLAYERS
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Real-time session network connections</p>
          </div>
        </div>

        {/* Counter */}
        <span className="text-[10px] font-bold font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md">
          {players.length} ONLINE
        </span>
      </div>

      {/* Simulated join/leave alerts feed */}
      <AnimatePresence mode="wait">
        {activityFeed && (
          <motion.div
            key={activityFeed.id}
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className={`p-2 rounded-xl text-[10px] font-semibold border flex items-center gap-2 ${
              activityFeed.type === "join"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                : "bg-red-500/10 text-red-400 border-red-500/25"
            }`}
          >
            {activityFeed.type === "join" ? <PlusCircle className="w-3.5 h-3.5 shrink-0" /> : <MinusCircle className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">{activityFeed.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Filter active players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-900 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors font-mono"
        />
      </div>

      {/* Players List Grid with exit/entrance transitions */}
      <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 italic">
            No matching online players found.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {filteredPlayers.map((player) => {
                const badge = getRankBadge(player.rank);
                return (
                  <motion.div
                    key={player.uuid}
                    layoutId={`player-${player.uuid}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-orange-500/30 hover:bg-slate-900/10 transition-all duration-300 hover:shadow-[0_0_12px_rgba(249,115,22,0.06)] cursor-pointer"
                  >
                    {/* Left side: Avatar + Username */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-800 group-hover:border-orange-500/40 transition-all bg-slate-900 flex items-center justify-center shrink-0">
                        <img
                          src={player.avatar}
                          alt={player.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${player.name}`;
                          }}
                          className="w-full h-full object-cover select-none scale-105 group-hover:scale-115 transition-transform duration-300"
                        />
                      </div>
                      <div>
                        <span className="font-display font-semibold text-xs text-white block group-hover:text-orange-400 transition-colors">
                          {player.name}
                        </span>
                        <span className="text-[10px] text-slate-500">Playtime: {player.playtime}</span>
                      </div>
                    </div>

                    {/* Right side: Rank + Ping */}
                    <div className="flex items-center gap-3">
                      {/* Rank Badge */}
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${badge.style}`}>
                        {badge.icon}
                        {badge.label}
                      </div>

                      {/* Ping bars indicator */}
                      <div className="flex items-center gap-1.5 min-w-[50px] justify-end font-mono">
                        <span className="text-[10px] text-slate-400">{player.ping}ms</span>
                        <div className="flex items-end gap-0.5 h-2.5">
                          <div className={`w-0.5 h-1 rounded-full ${player.ping < 100 ? "bg-green-500" : "bg-red-500"}`} />
                          <div className={`w-0.5 h-1.5 rounded-full ${player.ping < 60 ? "bg-green-500" : player.ping < 100 ? "bg-slate-700" : "bg-red-500"}`} />
                          <div className={`w-0.5 h-2 rounded-full ${player.ping < 30 ? "bg-green-500" : "bg-slate-700"}`} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
