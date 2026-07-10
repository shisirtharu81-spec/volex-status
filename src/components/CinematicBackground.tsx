import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

interface Firefly {
  x: number;
  y: number;
  size: number;
  speedY: number;
  amplitude: number;
  frequency: number;
  phase: number;
  opacity: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
}

interface CinematicBackgroundProps {
  enabled: boolean;
  accentColor: string; // Hex color e.g., "#f97316"
}

export default function CinematicBackground({ enabled = true, accentColor = "#f97316" }: CinematicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [smoothMouse, setSmoothMouse] = useState({ x: 0, y: 0 });

  // Track mouse coordinates for parallax
  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseMoveEvent) => {
      const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      setMouse({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [enabled]);

  // Smooth lerp for mouse parallax
  useEffect(() => {
    if (!enabled) return;
    let frameId: number;

    const updateLerp = () => {
      setSmoothMouse((prev) => {
        const dx = mouse.x - prev.x;
        const dy = mouse.y - prev.y;
        return {
          x: prev.x + dx * 0.05,
          y: prev.y + dy * 0.05,
        };
      });
      frameId = requestAnimationFrame(updateLerp);
    };
    frameId = requestAnimationFrame(updateLerp);

    return () => cancelAnimationFrame(frameId);
  }, [mouse, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Handle resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Initialize fireflies
    const fireflies: Firefly[] = [];
    const fireflyCount = 40;
    for (let i = 0; i < fireflyCount; i++) {
      fireflies.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 1.2,
        speedY: -(Math.random() * 0.5 + 0.25),
        amplitude: Math.random() * 1.5 + 0.5,
        frequency: Math.random() * 0.01 + 0.005,
        phase: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.7 + 0.2,
        color: Math.random() > 0.4 ? accentColor : "#facc15", // orange/gold fireflies
      });
    }

    // Initialize stars
    const stars: Star[] = [];
    const starCount = 80;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.7), // only in sky
        size: Math.random() * 1.3 + 0.4,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
      });
    }

    let time = 0;

    const drawScene = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Draw Twinkling Stars (Parallax tier 1)
      ctx.save();
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        // Twinkle factor
        s.opacity += s.twinkleSpeed;
        if (s.opacity > 1 || s.opacity < 0.1) {
          s.twinkleSpeed = -s.twinkleSpeed;
        }

        // Apply slow star parallax
        const starX = (s.x - smoothMouse.x * 8 + width) % width;
        const starY = s.y - smoothMouse.y * 4;

        ctx.beginPath();
        ctx.arc(starX, starY, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(1, s.opacity))})`;
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = s.size * 2;
        ctx.fill();
      }
      ctx.restore();

      // Draw Firefly Embers (Parallax tier 4, floating closest to screen)
      ctx.save();
      for (let i = 0; i < fireflies.length; i++) {
        const p = fireflies[i];
        p.y += p.speedY;
        p.phase += p.frequency;
        p.x += Math.sin(p.phase) * p.amplitude * 0.5;

        // Reset if float off top
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10 || p.x > width + 10) {
          p.x = Math.random() * width;
        }

        const fireX = p.x - smoothMouse.x * 25;
        const fireY = p.y - smoothMouse.y * 15;

        ctx.beginPath();
        ctx.arc(fireX, fireY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 3.5;
        ctx.fill();
      }
      ctx.restore();

      // Soft glowing bottom fog (Translucent orange layer)
      ctx.save();
      const fogGrad = ctx.createLinearGradient(0, height - 180, 0, height);
      fogGrad.addColorStop(0, "rgba(249, 115, 22, 0)");
      fogGrad.addColorStop(0.5, "rgba(249, 115, 22, 0.04)"); // glowing orange layer
      fogGrad.addColorStop(1, "rgba(3, 2, 8, 0.4)"); // subtle black baseline fading
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, height - 200, width, 200);
      ctx.restore();

      animationFrameId = requestAnimationFrame(drawScene);
    };

    drawScene();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [enabled, accentColor, smoothMouse]);

  const bgStyle: React.CSSProperties = {
    backgroundImage: "url('/assets/background.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-10 bg-slate-950"
      style={bgStyle}
    >
      {/* 1. Dark Black overlay with subtle blur (65% opacity, 3px blur) */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[3px] pointer-events-none" />

      {/* 2. Soft orange vignette around the edges */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(249,115,22,0.12)_80%,rgba(3,2,8,0.85)_100%)] pointer-events-none" />

      {/* 3. Smooth Canvas for particles and lighting */}
      {enabled && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full mix-blend-screen pointer-events-none" />
      )}
    </motion.div>
  );
}

// Custom simple event type definition for clean compilation
type MouseMoveEvent = {
  clientX: number;
  clientY: number;
};
