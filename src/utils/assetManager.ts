import fs from "fs-extra";
import path from "path";
import { createCanvas } from "@napi-rs/canvas";

export async function ensureAssetsExist() {
  const assetsDir = path.join(process.cwd(), "assets");
  const iconsDir = path.join(assetsDir, "icons");

  await fs.ensureDir(assetsDir);
  await fs.ensureDir(iconsDir);

  const bgPath = path.join(assetsDir, "background.png");
  const logoPath = path.join(assetsDir, "logo.png");
  const overlayPath = path.join(assetsDir, "overlay.png");
  const framePath = path.join(assetsDir, "frame.png");

  if (!(await fs.pathExists(bgPath))) {
    console.log("Generating default premium background.png...");
    await createDefaultBackground(bgPath);
  }

  if (!(await fs.pathExists(logoPath))) {
    console.log("Generating default premium logo.png...");
    await createDefaultLogo(logoPath);
  }

  if (!(await fs.pathExists(overlayPath))) {
    console.log("Generating default overlay.png...");
    await createDefaultOverlay(overlayPath);
  }

  if (!(await fs.pathExists(framePath))) {
    console.log("Generating default frame.png...");
    await createDefaultFrame(framePath);
  }

  // Ensure icons exist
  const iconNames = ["discord.png", "store.png", "website.png", "vote.png"];
  for (const name of iconNames) {
    const iconPath = path.join(iconsDir, name);
    if (!(await fs.pathExists(iconPath))) {
      console.log(`Generating default icon: ${name}...`);
      await createDefaultIcon(iconPath, name.replace(".png", ""));
    }
  }
}

async function createDefaultBackground(filePath: string) {
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext("2d");

  // Create a stunning deep space dark/orange gaming background gradient
  const grad = ctx.createRadialGradient(960, 540, 100, 960, 540, 1100);
  grad.addColorStop(0, "#29150b"); // Warm dark-orange glow center
  grad.addColorStop(0.5, "#0e0811"); // Dark indigo/purple transitions
  grad.addColorStop(1, "#040206"); // Near pitch black at edges
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1920, 1080);

  // Draw some ambient particles/stars
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * 1920;
    const y = Math.random() * 1080;
    const size = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw cyber grids or subtle angled neon beams
  ctx.strokeStyle = "rgba(249, 115, 22, 0.04)"; // Subtle orange grid
  ctx.lineWidth = 2;
  const gridSize = 120;
  for (let x = 0; x < 1920; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1080);
    ctx.stroke();
  }
  for (let y = 0; y < 1080; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1920, y);
    ctx.stroke();
  }

  // Warm ambient light from the bottom
  const bottomGrad = ctx.createLinearGradient(0, 1080, 0, 700);
  bottomGrad.addColorStop(0, "rgba(249, 115, 22, 0.08)");
  bottomGrad.addColorStop(1, "rgba(249, 115, 22, 0)");
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, 700, 1920, 380);

  await fs.writeFile(filePath, canvas.toBuffer("image/png"));
}

async function createDefaultLogo(filePath: string) {
  const canvas = createCanvas(300, 300);
  const ctx = canvas.getContext("2d");

  // Draw a beautifully stylized glowing shield with gold borders and a crown
  ctx.shadowColor = "rgba(249, 115, 22, 0.5)";
  ctx.shadowBlur = 15;

  // Outer orange glow shield
  ctx.fillStyle = "#1e112a";
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(150, 40); // Top Center
  ctx.lineTo(250, 70); // Top Right
  ctx.lineTo(230, 200); // Bottom Right curvature start
  ctx.quadraticCurveTo(150, 270, 150, 270); // Bottom curve
  ctx.quadraticCurveTo(70, 200, 70, 200); // Left curvature
  ctx.lineTo(50, 70); // Top Left
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner details
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fbbf24"; // Amber-gold inner border
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(150, 55);
  ctx.lineTo(235, 80);
  ctx.lineTo(215, 190);
  ctx.quadraticCurveTo(150, 250, 150, 250);
  ctx.quadraticCurveTo(85, 190, 85, 190);
  ctx.lineTo(65, 80);
  ctx.closePath();
  ctx.stroke();

  // Glowing orange logo crown on top of the text
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(110, 100);
  ctx.lineTo(130, 120);
  ctx.lineTo(150, 90);
  ctx.lineTo(170, 120);
  ctx.lineTo(190, 100);
  ctx.lineTo(180, 140);
  ctx.lineTo(120, 140);
  ctx.closePath();
  ctx.fill();

  // Draw elegant brand monogram "OMC"
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("OMC", 150, 185);

  // Subtle subtitle
  ctx.fillStyle = "#f97316";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("ORANGE NETWORK", 150, 225);

  await fs.writeFile(filePath, canvas.toBuffer("image/png"));
}

async function createDefaultOverlay(filePath: string) {
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext("2d");

  // Subtle dark radial gradient overlay to improve text legibility
  const grad = ctx.createRadialGradient(960, 540, 300, 960, 540, 1100);
  grad.addColorStop(0, "rgba(10, 5, 20, 0.45)");
  grad.addColorStop(1, "rgba(4, 2, 8, 0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1920, 1080);

  await fs.writeFile(filePath, canvas.toBuffer("image/png"));
}

async function createDefaultFrame(filePath: string) {
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext("2d");

  // Glowing aesthetic border frame
  ctx.strokeStyle = "rgba(249, 115, 22, 0.4)";
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, 1880, 1040);

  // Highlighted gold/orange corners
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 6;
  const len = 80;

  // Top Left
  ctx.beginPath();
  ctx.moveTo(20, 20 + len);
  ctx.lineTo(20, 20);
  ctx.lineTo(20 + len, 20);
  ctx.stroke();

  // Top Right
  ctx.beginPath();
  ctx.moveTo(1900 - len, 20);
  ctx.lineTo(1900, 20);
  ctx.lineTo(1900, 20 + len);
  ctx.stroke();

  // Bottom Left
  ctx.beginPath();
  ctx.moveTo(20, 1060 - len);
  ctx.lineTo(20, 1060);
  ctx.lineTo(20 + len, 1060);
  ctx.stroke();

  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(1900 - len, 1060);
  ctx.lineTo(1900, 1060);
  ctx.lineTo(1900, 1060 - len);
  ctx.stroke();

  await fs.writeFile(filePath, canvas.toBuffer("image/png"));
}

async function createDefaultIcon(filePath: string, type: string) {
  const canvas = createCanvas(64, 64);
  const ctx = canvas.getContext("2d");

  // Circular orange glassmorphic background
  ctx.fillStyle = "#1e112a";
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (type === "discord") {
    // Render a clean stylized Discord "D"
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("🎮", 32, 32);
  } else if (type === "store") {
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("🛒", 32, 32);
  } else if (type === "website") {
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("🌐", 32, 32);
  } else {
    // vote
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("👍", 32, 32);
  }

  await fs.writeFile(filePath, canvas.toBuffer("image/png"));
}
