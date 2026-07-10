import { createCanvas, loadImage, Canvas, CanvasRenderingContext2D } from "@napi-rs/canvas";
import path from "path";
import fs from "fs-extra";
import { BotConfig, ServerStatusInfo } from "../types";

export async function generateStatusImage(
  config: BotConfig,
  javaStatus: ServerStatusInfo,
  bedrockStatus: ServerStatusInfo & { port: number }
): Promise<Buffer> {
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext("2d");

  // Enable high-quality anti-aliasing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 1. Draw Background Image (or fallback)
  try {
    const bgExists = await fs.pathExists(config.background);
    if (bgExists) {
      const bgImg = await loadImage(config.background);
      ctx.drawImage(bgImg, 0, 0, 1920, 1080);
    } else {
      drawFallbackBackground(ctx);
    }
  } catch (err) {
    console.error("Failed to load background image, falling back:", err);
    drawFallbackBackground(ctx);
  }

  // 2. Draw Semi-Transparent Dark Overlay (Vignette & blur effect simulation)
  try {
    const overlayPath = path.join(process.cwd(), "assets", "overlay.png");
    if (await fs.pathExists(overlayPath)) {
      const overlayImg = await loadImage(overlayPath);
      ctx.drawImage(overlayImg, 0, 0, 1920, 1080);
    } else {
      drawFallbackOverlay(ctx);
    }
  } catch (err) {
    drawFallbackOverlay(ctx);
  }

  // 3. Draw Frame/Borders
  try {
    const framePath = path.join(process.cwd(), "assets", "frame.png");
    if (await fs.pathExists(framePath)) {
      const frameImg = await loadImage(framePath);
      ctx.drawImage(frameImg, 0, 0, 1920, 1080);
    } else {
      drawFallbackFrame(ctx);
    }
  } catch (err) {
    drawFallbackFrame(ctx);
  }

  // 4. Draw Header (Logo, Server Name, Online status indicator)
  let logoX = 90;
  let logoY = 70;
  let logoSize = 140;

  try {
    const logoExists = await fs.pathExists(config.logo);
    if (logoExists) {
      const logoImg = await loadImage(config.logo);
      // Draw shadow under logo
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      ctx.shadowBlur = 0; // Reset
      ctx.shadowOffsetY = 0;
    }
  } catch (err) {
    console.error("Failed to load logo, skipping drawing image:", err);
  }

  // Server Name Text & Subtitle
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("VOLEX NETWORK", logoX + logoSize + 40, logoY + 45);

  ctx.fillStyle = "#9ca3af";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("PREMIUM MULTIPLAYER MINECRAFT NETWORK", logoX + logoSize + 40, logoY + 100);

  // Status Pill (🟢 Online or 🔴 Offline)
  const isOnline = javaStatus.online || bedrockStatus.online;
  const pillX = 1600;
  const pillY = logoY + 40;
  const pillWidth = 230;
  const pillHeight = 60;

  drawGlassCard(ctx, pillX, pillY, pillWidth, pillHeight, 30, "rgba(255,255,255,0.02)", "rgba(255,255,255,0.08)");

  ctx.beginPath();
  ctx.arc(pillX + 45, pillY + 30, 10, 0, Math.PI * 2);
  ctx.fillStyle = isOnline ? "#22c55e" : "#ef4444";
  ctx.fill();
  // Draw glow around status circle
  ctx.shadowColor = isOnline ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.6)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(pillX + 45, pillY + 30, 6, 0, Math.PI * 2);
  ctx.fillStyle = isOnline ? "#4ade80" : "#f87171";
  ctx.fill();
  ctx.shadowBlur = 0; // Reset

  ctx.fillStyle = isOnline ? "#4ade80" : "#f87171";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(isOnline ? "ONLINE" : "OFFLINE", pillX + 75, pillY + 30);

  // -------------------------------------------------------------
  // Column 1: Server Status Info Card
  // -------------------------------------------------------------
  const card1X = 90;
  const card1Y = 260;
  const card1W = 1060;
  const card1H = 640;

  // Draw background glassmorphic panel
  drawGlassCard(ctx, card1X, card1Y, card1W, card1H, 24, "rgba(18, 10, 28, 0.45)", "rgba(249, 115, 22, 0.15)");

  // Left Card Title
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText("SERVER STATS", card1X + 40, card1Y + 55);

  // Accent divider
  ctx.strokeStyle = "rgba(249, 115, 22, 0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(card1X + 40, card1Y + 90);
  ctx.lineTo(card1X + card1W - 40, card1Y + 90);
  ctx.stroke();

  // Grid Info Items (Version, Ping, Software)
  const items = [
    { label: "VERSION", value: isOnline ? javaStatus.version : "N/A", x: card1X + 80 },
    { label: "PING", value: isOnline ? `${javaStatus.ping || bedrockStatus.ping} ms` : "--", x: card1X + 440 },
    { label: "SOFTWARE", value: isOnline ? javaStatus.software || "Paper MC" : "N/A", x: card1X + 800 },
  ];

  for (const item of items) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(item.label, item.x, card1Y + 145);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(item.value, item.x, card1Y + 195);
  }

  // Players Counter Progress Bar
  const playersOnline = isOnline ? Math.max(javaStatus.playersOnline, bedrockStatus.playersOnline) : 0;
  const playersMax = isOnline ? Math.max(javaStatus.playersMax, bedrockStatus.playersMax) : 100;
  const capacityRatio = playersMax > 0 ? playersOnline / playersMax : 0;

  ctx.fillStyle = "#9ca3af";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("PLAYERS ONLINE", card1X + 80, card1Y + 280);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px sans-serif";
  ctx.fillText(`${playersOnline} / ${playersMax}`, card1X + 80, card1Y + 340);

  // Capacity Percent Tag
  ctx.fillStyle = "#f97316";
  ctx.font = "bold 18px sans-serif";
  const pctText = `${(capacityRatio * 100).toFixed(1)}% Capacity`;
  ctx.fillText(pctText, card1X + card1W - 240, card1Y + 340);

  // Render Premium Progress Bar Track
  const barX = card1X + 80;
  const barY = card1Y + 380;
  const barW = card1W - 160;
  const barH = 22;

  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  drawRoundedRect(ctx, barX, barY, barW, barH, 11);
  ctx.fill();

  // Progress Bar Fill (Warm orange to bright golden gradient)
  if (playersOnline > 0) {
    const fillW = Math.min(barW, Math.max(barH, barW * capacityRatio));
    const fillGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    fillGrad.addColorStop(0, "#ea580c"); // Darker orange
    fillGrad.addColorStop(0.5, "#f97316"); // Brighter orange
    fillGrad.addColorStop(1, "#fbbf24"); // Golden yellow head

    ctx.fillStyle = fillGrad;

    // Glowing shadow for progress bar
    ctx.shadowColor = "rgba(249, 115, 22, 0.35)";
    ctx.shadowBlur = 10;
    drawRoundedRect(ctx, barX, barY, fillW, barH, 11);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset
  }

  // MOTD Container
  const motdBoxY = card1Y + 450;
  const motdBoxW = card1W - 160;
  const motdBoxH = 130;

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  drawRoundedRect(ctx, barX, motdBoxY, motdBoxW, motdBoxH, 12);
  ctx.fill();

  // MOTD Title
  ctx.fillStyle = "#f97316";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("MESSAGE OF THE DAY (MOTD)", barX + 25, motdBoxY + 30);

  // MOTD Text
  const motdText = isOnline ? javaStatus.motd : "🔴 SERVER OFFLINE - Join our Discord server for updates and maintenance logs.";
  ctx.fillStyle = isOnline ? "#e5e7eb" : "#f87171";
  ctx.font = isOnline ? "22px sans-serif" : "bold 20px sans-serif";
  wrapAndDrawText(ctx, motdText, barX + 25, motdBoxY + 75, motdBoxW - 50, 30);

  // -------------------------------------------------------------
  // Column 2: Connection Info & Action Cards
  // -------------------------------------------------------------
  const card2X = 1200;
  const card2Y = card1Y;
  const card2W = 630;
  const card2H = card1H;

  // Draw card2 background panel
  drawGlassCard(ctx, card2X, card2Y, card2W, card2H, 24, "rgba(18, 10, 28, 0.45)", "rgba(249, 115, 22, 0.15)");

  // Title
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText("SERVER ADDRESSES", card2X + 40, card2Y + 55);

  // Accent divider
  ctx.beginPath();
  ctx.moveTo(card2X + 40, card2Y + 90);
  ctx.lineTo(card2X + card2W - 40, card2Y + 90);
  ctx.stroke();

  // 1. Java Edition IP Card
  const box1Y = card2Y + 115;
  const boxW = card2W - 80;
  const boxH = 110;

  ctx.fillStyle = "rgba(249, 115, 22, 0.05)";
  ctx.strokeStyle = "rgba(249, 115, 22, 0.15)";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, card2X + 40, box1Y, boxW, boxH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f97316";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("JAVA EDITION IP", card2X + 65, box1Y + 30);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px monospace";
  ctx.fillText(config.javaIP, card2X + 65, box1Y + 70);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "14px sans-serif";
  ctx.fillText("📋 Copy on Click", card2X + boxW - 50, box1Y + 35);

  // 2. Bedrock Edition IP Card
  const box2Y = box1Y + boxH + 20;
  ctx.fillStyle = "rgba(249, 115, 22, 0.05)";
  drawRoundedRect(ctx, card2X + 40, box2Y, boxW, boxH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f97316";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("BEDROCK EDITION (PE)", card2X + 65, box2Y + 30);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px monospace";
  ctx.fillText(config.bedrockIP, card2X + 65, box2Y + 70);

  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 20px monospace";
  ctx.fillText(`Port: ${config.bedrockPort}`, card2X + boxW - 100, box2Y + 70);

  // 3. Official Store URL Card
  const box3Y = box2Y + boxH + 20;
  ctx.fillStyle = "rgba(249, 115, 22, 0.05)";
  drawRoundedRect(ctx, card2X + 40, box3Y, boxW, boxH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f97316";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("OFFICIAL WEB STORE", card2X + 65, box3Y + 30);

  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 24px monospace";
  ctx.fillText(config.store.replace("https://", ""), card2X + 65, box3Y + 70);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "14px sans-serif";
  ctx.fillText("🛒 store.volex.net", card2X + boxW - 110, box3Y + 35);

  // 4. Discord Community Card
  const box4Y = box3Y + boxH + 20;
  ctx.fillStyle = "rgba(249, 115, 22, 0.05)";
  drawRoundedRect(ctx, card2X + 40, box4Y, boxW, boxH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f97316";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("COMMUNITY DISCORD INVITE", card2X + 65, box4Y + 30);

  ctx.fillStyle = "#38bdf8"; // Light Blue
  ctx.font = "bold 24px monospace";
  ctx.fillText(config.discord.replace("https://", ""), card2X + 65, box4Y + 70);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "14px sans-serif";
  ctx.fillText("💬 discord.gg/volex", card2X + boxW - 130, box4Y + 35);

  // -------------------------------------------------------------
  // Footer: Social Buttons & Credit Watermark
  // -------------------------------------------------------------
  const footerY = 975;
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(90, footerY);
  ctx.lineTo(1830, footerY);
  ctx.stroke();

  // Watermark credit text
  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  ctx.font = "15px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("GENERATED LIVE BY VOLEX BOT • SECURED POWER", 1830, footerY + 45);

  // Draw Social Buttons on bottom left
  const icons = [
    { name: "discord.png", label: "Discord", x: 120 },
    { name: "store.png", label: "Web Store", x: 280 },
    { name: "website.png", label: "Website", x: 450 },
    { name: "vote.png", label: "Vote List", x: 610 },
  ];

  ctx.textAlign = "left";
  for (const item of icons) {
    const iconPath = path.join(process.cwd(), "assets", "icons", item.name);
    try {
      if (await fs.pathExists(iconPath)) {
        const iconImg = await loadImage(iconPath);
        ctx.drawImage(iconImg, item.x - 30, footerY + 20, 42, 42);
      }
    } catch (err) {
      // Fallback circular shape
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(item.x - 9, footerY + 41, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(item.label, item.x + 24, footerY + 43);
  }

  return canvas.toBuffer("image/png");
}

function drawFallbackBackground(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createRadialGradient(960, 540, 100, 960, 540, 1100);
  grad.addColorStop(0, "#23112c");
  grad.addColorStop(0.6, "#0d0614");
  grad.addColorStop(1, "#040107");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1920, 1080);
}

function drawFallbackOverlay(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createRadialGradient(960, 540, 400, 960, 540, 1100);
  grad.addColorStop(0, "rgba(5, 2, 10, 0.4)");
  grad.addColorStop(1, "rgba(2, 1, 4, 0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1920, 1080);
}

function drawFallbackFrame(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "rgba(249, 115, 22, 0.3)";
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, 1880, 1040);
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGlassCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillColor: string,
  borderColor: string
) {
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2.5;

  ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;

  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.stroke();

  // Reset shadow
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function wrapAndDrawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}
