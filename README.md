# 🟠 Advanced Discord Minecraft Server Status Bot & Web Dashboard

An ultra-premium Discord bot and custom web control panel to display real-time Minecraft server statuses using a high-fidelity **1920×1080 canvas visual status panel**.

## 🚀 Key Features

* **Glassmorphism Status Card**: Generates a high-quality, modern, custom-rendered 1920x1080 visual status panel image on-demand whenever `/status` (slash) or `!status` (prefix) is executed.
* **Dual-Edition Querying**: Simultaneously polls both Java Edition and Bedrock Edition (PE) servers.
* **Custom Web Dashboard**: Live web UI running on Port 3000 to manage settings, upload graphics, preview card renders, and start/stop the bot client dynamically.
* **Console Streaming**: Real-time console activity log tracker built right into the browser UI.
* **Auto-Fallback Assets**: Automatically draws custom default gradient backgrounds and server monogram logos if none are uploaded, preventing crashes.

---

## 🛠️ Installation

### 1. Prerequisites
* Node.js v22 or higher
* npm or yarn

### 2. Extract and Install Dependencies
Install all package dependencies via your terminal:
```bash
npm install
```

---

## 🤖 Bot Token & Application Setup

1. **Create Discord App**: Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**. Name your bot (e.g. *OrangeMC status*).
2. **Generate Token**:
   * Navigate to the **Bot** tab on the left menu.
   * Click **Reset Token** and copy the resulting secret string. This is your `DISCORD_TOKEN`.
   * Scroll down to **Privileged Gateway Intents** and enable **Message Content Intent** (so legacy prefix commands can be processed).
3. **Copy Client ID**:
   * Navigate to the **General Information** tab.
   * Copy the **Application ID**. This is your `DISCORD_CLIENT_ID`.
4. **Invite Bot**:
   * Go to **OAuth2** → **URL Generator**.
   * Under Scopes, select: `bot` and `applications.commands`.
   * Under Bot Permissions, select: `Send Messages`, `Embed Links`, `Attach Files`, `Use Slash Commands`.
   * Open the generated link in your browser to authorize and invite the bot to your Discord guild!

---

## ⚙️ Configuration (`config.json`)

Settings are saved locally inside `config.json`. You can modify them directly or save them from the Web Dashboard:

```json
{
  "javaIP": "play.orangemc.net",
  "bedrockIP": "play.orangemc.net",
  "bedrockPort": 19132,
  "store": "https://store.orangemc.net",
  "website": "https://orangemc.net",
  "discord": "https://discord.gg/orangemc",
  "logo": "./assets/logo.png",
  "background": "./assets/background.png"
}
```

---

## 🏃 Running the Application

### Development Mode
Boot the Express API + Vite asset bundler dynamically:
```bash
npm run dev
```

### Production Build
Compile both client assets and server bundle:
```bash
npm run build
npm run start
```

---

## 💻 Slash Commands Reference

* `/status` - Render and display the beautiful Minecraft status board.
* `/setbackground` - Upload and download a new card background image.
* `/setlogo` - Upload and download a new brand circular logo.
* `/setip <java_ip>` - Update target Java Edition host address.
* `/setbedrock <bedrock_ip> [port]` - Update target Bedrock Edition host address and port.
* `/setstore <url>` - Set the official store URL.
* `/reload` - Reload settings.
* `/help` - View administrative guide commands.
