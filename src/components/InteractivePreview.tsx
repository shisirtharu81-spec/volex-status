import React, { useState } from "react";
import { ImageIcon, RefreshCw, Download, Maximize2, ZoomIn, ZoomOut, Compass, Sparkles, Check, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InteractivePreviewProps {
  previewToken: number;
  onRefresh: () => void;
  accentColor: string;
}

export default function InteractivePreview({ previewToken, onRefresh, accentColor = "#f97316" }: InteractivePreviewProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [imgLoaded, setImgLoaded] = useState<boolean>(true);

  const imageUrl = `/api/render-preview?t=${previewToken}`;

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${imageUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const triggerRefresh = () => {
    setImgLoaded(false);
    onRefresh();
  };

  return (
    <div className="glass-panel-glow rounded-2xl p-5 relative overflow-hidden flex flex-col gap-4">
      {/* Accent glow bar */}
      <div 
        className="absolute top-0 left-20 w-32 h-[1px] transition-colors duration-500" 
        style={{ backgroundColor: accentColor }} 
      />

      {/* Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 shadow-inner">
            <ImageIcon className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-sm tracking-wide uppercase flex items-center gap-2">
              LIVE 1920×1080 CANVAS PREVIEW
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Digital status card compiled in real-time</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex bg-slate-950/80 border border-slate-900 rounded-xl p-0.5 shadow-md">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
              className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 py-1 text-[10px] text-slate-300 font-mono flex items-center justify-center font-bold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={triggerRefresh}
            className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-900 text-slate-300 hover:text-white transition-colors flex items-center justify-center cursor-pointer shadow-md"
            title="Force Re-render Canvas Card"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(true)}
            className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-900 text-slate-300 hover:text-white transition-colors flex items-center justify-center cursor-pointer shadow-md"
            title="Open Interactive Viewport"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Frame */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center group select-none shadow-2xl">
        {/* Subtle decorative grid lines and reticle */}
        <div className="absolute inset-4 border border-dashed border-white/3 pointer-events-none rounded" />
        
        {/* Real-time scanning effect lines */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/10 to-transparent shadow-[0_0_8px_rgba(249,115,22,0.1)] pointer-events-none animate-scan" style={{ animationDuration: "6s", animationIterationCount: "infinite" }} />

        {/* HUD top label */}
        <div className="absolute left-1/2 top-4 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/90 border border-slate-900 text-[9px] font-mono font-black tracking-widest text-slate-400 shadow-xl">
          <Compass className="w-3.5 h-3.5 text-orange-500 animate-spin" style={{ animationDuration: "14s" }} />
          HD DIGITAL RENDER VIEWPORT
        </div>

        {/* Dynamic Image container with Framer Motion fade-transitions */}
        <div
          className="w-full h-full transition-all duration-300 ease-out flex items-center justify-center p-2"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={previewToken}
              src={imageUrl}
              alt="Minecraft Status Board Render"
              initial={{ opacity: 0.1, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0.1 }}
              transition={{ duration: 0.3 }}
              onLoad={() => setImgLoaded(true)}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
        </div>

        {/* Loading overlay indicator */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest">Re-rendering high-DPI layers...</span>
          </div>
        )}

        {/* Interactive Hover Actions Overlay */}
        <div className="absolute inset-0 bg-slate-950/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-5 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20"
          >
            <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
            <span className="text-[10px] font-display font-black text-white tracking-widest uppercase">
              1920×1080 AAA DIGITAL EXPORT ENGINE
            </span>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-2.5">
            <button
              onClick={triggerRefresh}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-600/25 hover:scale-105 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-Render Card
            </button>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl border border-slate-800 flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-all"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5" />}
              {copiedLink ? "Link Copied!" : "Copy Image URL"}
            </button>
            <a
              href={imageUrl}
              download="volex-status-board.png"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl border border-slate-800 flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Save PNG
            </a>
          </div>
        </div>
      </div>

      {/* Fullscreen Interactive Modal popup */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/98 backdrop-blur-md z-[100] flex flex-col p-6 select-none"
          >
            {/* Header Controls */}
            <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-display font-black text-white tracking-wide uppercase">
                  VOLEX HIGH-DPI CANVAS RENDER VIEWPORT
                </h2>
                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-widest mt-0.5">Previewing native 1920x1080 resolution output layers</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.1))}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs text-slate-300 font-bold bg-slate-950 border border-slate-900 px-3 py-1.5 rounded-lg">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.1))}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsFullscreen(false);
                    setZoomLevel(1);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-500 transition-colors cursor-pointer shadow-lg shadow-orange-600/20"
                >
                  Exit Viewport
                </button>
              </div>
            </div>

            {/* Stage frame */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-950/40 border border-slate-900 rounded-2xl relative shadow-inner">
              <div
                className="transition-transform duration-150 ease-out flex items-center justify-center"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={imageUrl}
                  alt="Minecraft Status Board HD full screen"
                  className="max-w-full max-h-[75vh] object-contain shadow-2xl rounded-xl border border-slate-800"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
