import express from "express";
import path from "path";
import fs from "fs-extra";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load local environment variables
dotenv.config();

import { ensureAssetsExist } from "./src/utils/assetManager";
import { queryMinecraftServer } from "./src/utils/minecraftQuery";
import { generateStatusImage } from "./src/utils/canvasRenderer";
import { addLog, getLogs, clearLogs } from "./src/utils/logger";
import {
  startDiscordBot,
  stopDiscordBot,
  isBotRunning,
  getBotStatus,
} from "./src/bot/discordBot";
import { BotConfig } from "./src/types";

const PORT = 3000;
const CONFIG_PATH = path.join(process.cwd(), "config.json");

async function startServer() {
  // Ensure default assets (background, logo, overlay, frame, icons) exist
  try {
    await ensureAssetsExist();
    addLog("Assets directory verified and loaded successfully.", "success");
  } catch (err: any) {
    addLog(`Asset preparation error: ${err.message}`, "error");
  }

  const app = express();

  // Parse JSON payloads and expand base64 upload limit for custom 1920x1080 background images
  app.use(express.json({ limit: "25mb" }));

  // Serve local assets directory static files
  app.use("/assets", express.static(path.join(process.cwd(), "assets")));

  // API Route: Server Status and Configuration details
  app.get("/api/config", async (req, res) => {
    try {
      const config: BotConfig = await fs.readJson(CONFIG_PATH);
      // Return config with env-masked credentials so users know if they are loaded
      res.json({
        ...config,
        hasEnvToken: !!process.env.DISCORD_TOKEN,
        hasEnvClientId: !!process.env.DISCORD_CLIENT_ID,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to read config file", details: err.message });
    }
  });

  // API Route: Save configuration settings
  app.post("/api/config", async (req, res) => {
    try {
      const newConfig = req.body as BotConfig;
      const currentConfig: BotConfig = await fs.readJson(CONFIG_PATH);

      const mergedConfig = {
        ...currentConfig,
        javaIP: newConfig.javaIP || currentConfig.javaIP,
        bedrockIP: newConfig.bedrockIP || currentConfig.bedrockIP,
        bedrockPort: Number(newConfig.bedrockPort) || currentConfig.bedrockPort,
        store: newConfig.store || currentConfig.store,
        website: newConfig.website || currentConfig.website,
        discord: newConfig.discord || currentConfig.discord,
      };

      await fs.writeJson(CONFIG_PATH, mergedConfig, { spaces: 2 });
      addLog("Bot settings successfully updated via Web Dashboard.", "success");
      res.json({ message: "Configuration updated successfully", config: mergedConfig });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to save config file", details: err.message });
    }
  });

  // API Route: Live test-ping to Minecraft Network (Java + Bedrock)
  app.get("/api/ping-test", async (req, res) => {
    try {
      const config: BotConfig = await fs.readJson(CONFIG_PATH);
      addLog(`Manual test ping requested for Java: ${config.javaIP} and Bedrock: ${config.bedrockIP}`);
      const data = await queryMinecraftServer(config.javaIP, config.bedrockIP, config.bedrockPort);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to ping server", details: err.message });
    }
  });

  // API Route: Dynamically generate and stream the 1920x1080 PNG status card
  app.get("/api/render-preview", async (req, res) => {
    try {
      const config: BotConfig = await fs.readJson(CONFIG_PATH);
      const { java, bedrock } = await queryMinecraftServer(config.javaIP, config.bedrockIP, config.bedrockPort);

      const buffer = await generateStatusImage(config, java, bedrock);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "no-store, must-revalidate");
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to generate status preview image", details: err.message });
    }
  });

  // API Route: Upload custom base64 logo/background asset
  app.post("/api/upload-asset", async (req, res) => {
    try {
      const { type, data } = req.body; // type = 'logo' or 'background', data = base64 data string
      if (!type || !data) {
        return res.status(400).json({ error: "Missing asset type or data payload" });
      }

      const cleanData = data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(cleanData, "base64");

      const fileName = type === "logo" ? "logo.png" : "background.png";
      const targetPath = path.join(process.cwd(), "assets", fileName);

      await fs.writeFile(targetPath, buffer);
      addLog(`Custom ${type} asset uploaded and saved locally to: ${fileName}`, "success");
      res.json({ message: `${type} asset updated successfully`, path: `./assets/${fileName}` });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to write asset file", details: err.message });
    }
  });

  // API Route: Get console logs
  app.get("/api/logs", (req, res) => {
    res.json(getLogs());
  });

  app.post("/api/logs/clear", (req, res) => {
    clearLogs();
    res.json({ message: "Logs cleared" });
  });

  // API Route: Query Discord Bot connection and telemetry metrics
  app.get("/api/bot-status", (req, res) => {
    res.json(getBotStatus());
  });

  // API Route: Start/Stop Discord Bot
  app.post("/api/bot-start", async (req, res) => {
    try {
      const { token, clientId } = req.body;
      const botToken = token || process.env.DISCORD_TOKEN;
      const botClientId = clientId || process.env.DISCORD_CLIENT_ID;

      if (!botToken || !botClientId) {
        return res.status(400).json({
          error: "Missing credentials. Provide Discord Bot Token and Client ID.",
        });
      }

      addLog("Starting Discord Status Bot process dynamically...", "info");
      await startDiscordBot(CONFIG_PATH, botToken, botClientId);
      res.json({ message: "Discord Bot started successfully", status: getBotStatus() });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to login Discord bot", details: err.message });
    }
  });

  app.post("/api/bot-stop", async (req, res) => {
    try {
      await stopDiscordBot();
      res.json({ message: "Discord Bot stopped successfully", status: getBotStatus() });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to stop Discord bot", details: err.message });
    }
  });

  // Auto-start bot on boot if env credentials are present
  const defaultToken = process.env.DISCORD_TOKEN;
  const defaultClientId = process.env.DISCORD_CLIENT_ID;
  if (defaultToken && defaultClientId) {
    addLog("Default Discord credentials discovered in environment, auto-connecting bot...", "info");
    startDiscordBot(CONFIG_PATH, defaultToken, defaultClientId).catch((err) => {
      addLog(`Auto-start of Discord bot failed: ${err.message}`, "warn");
    });
  } else {
    addLog("No environment tokens discovered. Bot is idling. Configure via Dashboard to connect.", "warn");
  }

  // Vite middleware setup for Development vs Static distribution for Production
  if (process.env.NODE_ENV !== "production") {
    addLog("Loading Vite development middleware on port 3000...", "info");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    addLog(`Running in Production. Serving compiled bundle from: ${distPath}`, "info");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    addLog(`Web Dashboard and API server active on http://0.0.0.0:${PORT}`, "success");
  });
}

startServer();
