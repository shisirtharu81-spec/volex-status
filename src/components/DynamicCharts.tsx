import React, { useState, useEffect } from "react";
import { Activity, Cpu, Users, Wifi, Radio, ArrowUpRight, Award, Server } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DynamicChartsProps {
  currentPlayers: number;
  maxPlayers: number;
  currentPing: number;
  currentTps: number;
}

export default function DynamicCharts({ currentPlayers, maxPlayers, currentPing, currentTps }: DynamicChartsProps) {
  const [activeTab, setActiveTab] = useState<"players" | "latency" | "cpu" | "ram" | "network">("players");
  
  // Keep arrays of recent stats (maximum 15 data points)
  const [playersHistory, setPlayersHistory] = useState<number[]>([12, 18, 15, 22, 28, 25, 32, 38, 35, 41, 45, 43, 48, 51, 48]);
  const [pingHistory, setPingHistory] = useState<number[]>([15, 14, 18, 16, 14, 15, 13, 14, 12, 14, 15, 16, 14, 13, 14]);
  const [cpuHistory, setCpuHistory] = useState<number[]>([12, 18, 14, 25, 30, 22, 15, 19, 24, 28, 35, 20, 16, 14, 18]);
  const [ramHistory, setRamHistory] = useState<number[]>([4.2, 4.3, 4.3, 4.4, 4.6, 4.7, 4.8, 4.8, 4.9, 5.1, 5.0, 5.2, 5.2, 5.3, 5.4]);
  const [tpsHistory, setTpsHistory] = useState<number[]>([19.98, 19.95, 19.99, 19.98, 19.92, 19.96, 19.97, 19.99, 19.98, 19.95, 19.99, 19.98, 19.97, 19.99, 19.98]);
  const [networkHistory, setNetworkHistory] = useState<number[]>([1.4, 2.5, 3.1, 1.8, 2.9, 4.5, 5.2, 3.8, 2.1, 5.8, 7.2, 6.5, 4.9, 3.2, 4.1]);

  const [hoveredNode, setHoveredNode] = useState<{ index: number; x: number; y: number; val: number } | null>(null);

  // Handle live updates every 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPlayersHistory((prev) => {
        const nextVal = Math.max(0, Math.min(maxPlayers || 150, currentPlayers + Math.floor(Math.random() * 5 - 2)));
        return [...prev.slice(1), nextVal];
      });

      setPingHistory((prev) => {
        const base = currentPing > 0 ? currentPing : 14;
        const nextVal = Math.max(1, base + Math.floor(Math.random() * 4 - 2));
        return [...prev.slice(1), nextVal];
      });

      setCpuHistory((prev) => {
        const last = prev[prev.length - 1];
        const nextVal = Math.max(5, Math.min(95, last + Math.floor(Math.random() * 12 - 6)));
        return [...prev.slice(1), nextVal];
      });

      setRamHistory((prev) => {
        const last = prev[prev.length - 1];
        const nextVal = Math.max(2.0, Math.min(11.8, parseFloat((last + (Math.random() * 0.14 - 0.07)).toFixed(2))));
        return [...prev.slice(1), nextVal];
      });

      setTpsHistory((prev) => {
        const base = currentTps > 0 ? currentTps : 19.98;
        const nextVal = Math.max(18.5, Math.min(20.0, parseFloat((base + (Math.random() * 0.04 - 0.02)).toFixed(2))));
        return [...prev.slice(1), nextVal];
      });

      setNetworkHistory((prev) => {
        const last = prev[prev.length - 1];
        const nextVal = Math.max(0.5, Math.min(12.5, parseFloat((last + (Math.random() * 2.0 - 1.0)).toFixed(1))));
        return [...prev.slice(1), nextVal];
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [currentPlayers, maxPlayers, currentPing, currentTps]);

  // Map category tabs to premium visual settings
  const getActiveData = () => {
    switch (activeTab) {
      case "players":
        return {
          title: "Server Slot Capacity Over Time",
          history: playersHistory,
          color: "#f97316", // neon orange
          badgeColor: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
          icon: <Users className="w-5 h-5 text-orange-500" />,
          unit: " Players",
          maxVal: Math.max(...playersHistory, maxPlayers || 150, 10),
          minVal: 0,
        };
      case "latency":
        return {
          title: "Ping response Latency",
          history: pingHistory,
          color: "#06b6d4", // cyber blue
          badgeColor: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
          icon: <Wifi className="w-5 h-5 text-cyan-400" />,
          unit: " ms",
          maxVal: Math.max(...pingHistory, 35),
          minVal: 0,
        };
      case "cpu":
        return {
          title: "Host CPU Core Utilization",
          history: cpuHistory,
          color: "#a855f7", // cyber purple
          badgeColor: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
          icon: <Cpu className="w-5 h-5 text-purple-400" />,
          unit: "% CPU",
          maxVal: 100,
          minVal: 0,
        };
      case "ram":
        return {
          title: "Host Memory Allocation (GB)",
          history: ramHistory,
          color: "#3b82f6", // sapphire blue
          badgeColor: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
          icon: <Server className="w-5 h-5 text-blue-400" />,
          unit: " GB RAM",
          maxVal: 12.0,
          minVal: 0,
        };
      case "network":
        return {
          title: "Simulated I/O Network Traffic",
          history: networkHistory,
          color: "#facc15", // golden yellow
          badgeColor: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
          icon: <Activity className="w-5 h-5 text-yellow-400" />,
          unit: " MB/s",
          maxVal: Math.max(...networkHistory, 10.0),
          minVal: 0,
        };
    }
  };

  const chart = getActiveData();

  // Generate SVG plotting coordinates
  const generatePathPoints = (dataPoints: number[], max: number, min: number, width: number, height: number) => {
    const range = max - min || 1;
    const paddingX = 30;
    const paddingY = 25;
    const plotWidth = width - paddingX * 2;
    const plotHeight = height - paddingY * 2;
    const stepX = plotWidth / (dataPoints.length - 1);

    return dataPoints.map((val, index) => {
      const x = paddingX + index * stepX;
      const pct = (val - min) / range;
      const y = paddingY + plotHeight - pct * plotHeight;
      return { x, y, val };
    });
  };

  const svgWidth = 600;
  const svgHeight = 220;
  const points = generatePathPoints(chart.history, chart.maxVal, chart.minVal, svgWidth, svgHeight);

  // Build SVG path strings
  const pathString = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPathString = `${pathString} L ${points[points.length - 1].x} ${svgHeight - 25} L ${points[0].x} ${svgHeight - 25} Z`;

  return (
    <div className="glass-panel-glow rounded-2xl p-5 relative overflow-hidden flex flex-col gap-4">
      {/* Top ambient line highlight */}
      <div 
        className="absolute top-0 left-10 w-40 h-[1px] transition-colors duration-500" 
        style={{ backgroundColor: `${chart.color}80` }}
      />

      {/* Title & Navigation Tabs */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 shadow-inner">
            <Radio className="w-5 h-5 text-orange-500 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-sm tracking-wide uppercase flex items-center gap-2">
              REAL-TIME PERFORMANCE TELEMETRY
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Continuous telemetry matrices updated every 2.0 seconds</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-950/80 border border-slate-900 rounded-xl p-1 text-[11px] font-bold self-stretch xl:self-auto overflow-x-auto gap-0.5">
          {(["players", "latency", "cpu", "ram", "network"] as const).map((tab) => {
            const active = tab === activeTab;
            const tabColorMap = {
              players: "bg-orange-600 shadow-orange-600/25 text-white",
              latency: "bg-cyan-600 shadow-cyan-600/25 text-white",
              cpu: "bg-purple-600 shadow-purple-600/25 text-white",
              ram: "bg-blue-600 shadow-blue-600/25 text-white",
              network: "bg-yellow-600 shadow-yellow-600/25 text-white",
            };
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setHoveredNode(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize whitespace-nowrap cursor-pointer ${
                  active ? tabColorMap[tab] + " shadow-md" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Canvas box */}
      <div className="flex-1 min-h-[220px] bg-slate-950/40 border border-slate-900 rounded-xl p-4 flex flex-col relative justify-center">
        {/* Decorative Grid Line System */}
        <div className="absolute inset-x-0 inset-y-8 flex flex-col justify-between pointer-events-none opacity-5">
          <div className="h-[1px] bg-white w-full" />
          <div className="h-[1px] bg-white w-full" />
          <div className="h-[1px] bg-white w-full" />
          <div className="h-[1px] bg-white w-full" />
        </div>

        {/* Animated SVG Graph Container */}
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
          <defs>
            {/* Dynamic primary linear gradient fill */}
            <linearGradient id="chartGlowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chart.color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={chart.color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid vertical reference lines */}
          {points.map((p, i) => (
            i % 2 === 0 && (
              <line
                key={`grid-x-${i}`}
                x1={p.x}
                y1={15}
                x2={p.x}
                y2={svgHeight - 15}
                stroke="rgba(255,255,255,0.03)"
                strokeDasharray="4"
              />
            )
          ))}

          {/* Glowing Area Fill */}
          <motion.path
            d={areaPathString}
            fill="url(#chartGlowGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* Dynamic stroke line path */}
          <motion.path
            d={pathString}
            fill="none"
            stroke={chart.color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0px 6px 12px ${chart.color}35)` }}
          />

          {/* Glowing tracking circles */}
          {points.map((p, i) => (
            <g 
              key={`node-${i}`} 
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode({ index: i, x: p.x, y: p.y, val: p.val })}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Touch Area */}
              <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
              {/* Outer pulsing ring */}
              <circle
                cx={p.x}
                cy={p.y}
                r="6.5"
                fill={chart.color}
                className="opacity-0 hover:opacity-25 transition-opacity duration-200"
              />
              {/* Core interactive dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="#ffffff"
                stroke={chart.color}
                strokeWidth="2.5"
              />
            </g>
          ))}
        </svg>

        {/* Dynamic Tooltip Widget */}
        <AnimatePresence>
          {hoveredNode && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute bg-slate-950/95 border border-slate-900 rounded-lg p-2 font-mono text-[10px] text-white shadow-xl pointer-events-none flex flex-col gap-0.5"
              style={{
                left: `${(hoveredNode.x / svgWidth) * 90}%`,
                top: `${(hoveredNode.y / svgHeight) * 55 + 20}%`,
                borderColor: chart.color,
              }}
            >
              <span className="text-slate-500 uppercase tracking-widest font-black text-[8px]">Metric point</span>
              <span className="font-bold flex items-center gap-1">
                {hoveredNode.val}
                <span className="text-slate-400">{chart.unit}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Top Legend Tag */}
        <div className="absolute top-4 right-4 flex items-center gap-2.5 bg-slate-950/80 border border-slate-900 rounded-lg px-2.5 py-1.5 text-[11px] font-mono shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: chart.color }} />
            <span className="text-slate-400">Current:</span>
            <span className="text-white font-bold font-mono">
              {chart.history[chart.history.length - 1]}
              {chart.unit}
            </span>
          </div>
          <div className="flex items-center gap-1 pl-2 border-l border-slate-900 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>2.0s polling</span>
          </div>
        </div>
      </div>
    </div>
  );
}
