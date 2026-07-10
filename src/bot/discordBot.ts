import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
  ChatInputCommandInteraction,
} from "discord.js";
import path from "path";
import fs from "fs-extra";
import axios from "axios";
import { BotConfig, BotStatus, ServerStatusInfo } from "../types";
import { addLog } from "../utils/logger";
import { queryMinecraftServer } from "../utils/minecraftQuery";
import { generateStatusImage } from "../utils/canvasRenderer";

let client: Client | null = null;
let isStarted = false;

export function isBotRunning(): boolean {
  return isStarted && client !== null && client.user !== null;
}

export function getBotStatus(): BotStatus {
  if (!client || !isStarted) {
    return { running: false, tag: null, guildsCount: 0, latency: 0 };
  }
  return {
    running: true,
    tag: client.user?.tag || "Bot Logging In",
    guildsCount: client.guilds.cache.size,
    latency: client.ws.ping,
  };
}

export async function stopDiscordBot() {
  if (client) {
    addLog("Shutting down Discord bot client...", "info");
    try {
      client.destroy();
    } catch (e) {}
    client = null;
  }
  isStarted = false;
  addLog("Discord Bot has stopped.", "warn");
}

export async function startDiscordBot(configPath: string, token: string, clientId: string) {
  if (isStarted) {
    await stopDiscordBot();
  }

  addLog("Initializing Discord.js client...", "info");

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once("ready", async () => {
    isStarted = true;
    addLog(`Discord Bot logged in successfully as: ${client?.user?.tag}`, "success");
    try {
      await registerSlashCommands(token, clientId, configPath);
    } catch (err: any) {
      addLog(`Failed to register slash commands on startup: ${err.message}`, "error");
    }
  });

  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;

    if (message.content.trim() === "!status") {
      addLog(`Received legacy prefix command "!status" from ${message.author.tag} in ${message.guild?.name || "DM"}`);
      await handleStatusQuery(message, configPath);
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    addLog(`Slash command received: /${interaction.commandName} from ${interaction.user.tag}`);

    try {
      if (interaction.commandName === "status") {
        await handleStatusSlash(interaction, configPath);
      } else if (interaction.commandName === "setbackground") {
        await handleSetBackground(interaction, configPath);
      } else if (interaction.commandName === "setlogo") {
        await handleSetLogo(interaction, configPath);
      } else if (interaction.commandName === "setstore") {
        await handleSetStore(interaction, configPath);
      } else if (interaction.commandName === "setip") {
        await handleSetIP(interaction, configPath);
      } else if (interaction.commandName === "setbedrock") {
        await handleSetBedrock(interaction, configPath);
      } else if (interaction.commandName === "reload") {
        await handleReload(interaction, configPath);
      } else if (interaction.commandName === "help") {
        await handleHelp(interaction);
      }
    } catch (err: any) {
      addLog(`Error executing slash command /${interaction.commandName}: ${err.message}`, "error");
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `❌ There was an error while executing this command: ${err.message}`,
          ephemeral: true,
        });
      }
    }
  });

  try {
    await client.login(token);
  } catch (err: any) {
    client = null;
    isStarted = false;
    addLog(`Discord Client failed to login. Verify Token. Error: ${err.message}`, "error");
    throw err;
  }
}

async function registerSlashCommands(token: string, clientId: string, configPath: string) {
  addLog("Registering slash commands globally...", "info");

  const commands = [
    new SlashCommandBuilder()
      .setName("status")
      .setDescription("Display the beautiful Minecraft server status panel."),

    new SlashCommandBuilder()
      .setName("setbackground")
      .setDescription("Update the custom status card background image.")
      .addAttachmentOption((opt) =>
        opt.setName("image").setDescription("The new background image (PNG/JPG)").setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("setlogo")
      .setDescription("Update the server logo graphic.")
      .addAttachmentOption((opt) =>
        opt.setName("image").setDescription("The new logo image (PNG/JPG)").setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("setstore")
      .setDescription("Set the Minecraft store url link.")
      .addStringOption((opt) =>
        opt.setName("url").setDescription("The full URL (e.g. https://volex-store.onrender.com)").setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("setip")
      .setDescription("Update the Java IP Address.")
      .addStringOption((opt) =>
        opt.setName("ip").setDescription("IP or domain with optional port (rex-2.drexhost.in:19121)").setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("setbedrock")
      .setDescription("Update Bedrock PE connection settings.")
      .addStringOption((opt) =>
        opt.setName("ip").setDescription("IP or domain (e.g. rex-2.drexhost.in)").setRequired(true)
      )
      .addIntegerOption((opt) =>
        opt.setName("port").setDescription("Port (default 19121)").setRequired(false)
      ),

    new SlashCommandBuilder()
      .setName("reload")
      .setDescription("Reload the bot config settings from config.json."),

    new SlashCommandBuilder()
      .setName("help")
      .setDescription("Display list of commands and configurations."),
  ].map((cmd) => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(token);

  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  addLog("Slash commands registered successfully!", "success");
}

// -----------------------------------------------------------------------------
// Command Handlers
// -----------------------------------------------------------------------------

async function handleStatusSlash(interaction: ChatInputCommandInteraction, configPath: string) {
  await interaction.deferReply();

  try {
    const config: BotConfig = await fs.readJson(configPath);
    addLog(`Pinging Minecraft networks: Java (${config.javaIP}), Bedrock (${config.bedrockIP}:${config.bedrockPort})`);

    const { java, bedrock } = await queryMinecraftServer(config.javaIP, config.bedrockIP, config.bedrockPort);

    addLog(`Generating premium status visual panel...`);
    const buffer = await generateStatusImage(config, java, bedrock);
    const attachment = new AttachmentBuilder(buffer, { name: "status-panel.png" });

    const embed = createStatusEmbed(config, java, bedrock);
    const actionRow = createActionRow(config);

    await interaction.editReply({
      embeds: [embed],
      files: [attachment],
      components: [actionRow],
    });
    addLog("Minecraft status panel successfully sent to channel.");
  } catch (err: any) {
    addLog(`Failed to query or render panel: ${err.message}`, "error");
    await interaction.editReply({
      content: `❌ **Failed to retrieve server status:** ${err.message}`,
    });
  }
}

async function handleStatusQuery(message: Message, configPath: string) {
  const replyMsg = await message.reply("🔄 Fetching network status, please wait...");

  try {
    const config: BotConfig = await fs.readJson(configPath);
    const { java, bedrock } = await queryMinecraftServer(config.javaIP, config.bedrockIP, config.bedrockPort);

    const buffer = await generateStatusImage(config, java, bedrock);
    const attachment = new AttachmentBuilder(buffer, { name: "status-panel.png" });

    const embed = createStatusEmbed(config, java, bedrock);
    const actionRow = createActionRow(config);

    await (message.channel as any).send({
      embeds: [embed],
      files: [attachment],
      components: [actionRow],
    });
    await replyMsg.delete();
  } catch (err: any) {
    addLog(`Failed to query legacy status: ${err.message}`, "error");
    await replyMsg.edit(`❌ **Failed to retrieve server status:** ${err.message}`);
  }
}

async function handleSetBackground(interaction: ChatInputCommandInteraction, configPath: string) {
  await interaction.deferReply({ ephemeral: true });

  const attachment = interaction.options.getAttachment("image", true);
  if (!attachment.contentType?.startsWith("image/")) {
    return interaction.editReply("❌ File must be a valid PNG or JPG image.");
  }

  try {
    addLog(`Downloading new background image from ${attachment.url}...`);
    const res = await axios.get(attachment.url, { responseType: "arraybuffer" });
    const bgPath = path.join(process.cwd(), "assets", "background.png");

    await fs.writeFile(bgPath, Buffer.from(res.data));
    addLog(`Custom background successfully updated!`);

    await interaction.editReply("🟢 Custom background image updated successfully!");
  } catch (err: any) {
    addLog(`Failed to save background image: ${err.message}`, "error");
    await interaction.editReply(`❌ Failed to update background: ${err.message}`);
  }
}

async function handleSetLogo(interaction: ChatInputCommandInteraction, configPath: string) {
  await interaction.deferReply({ ephemeral: true });

  const attachment = interaction.options.getAttachment("image", true);
  if (!attachment.contentType?.startsWith("image/")) {
    return interaction.editReply("❌ File must be a valid PNG or JPG image.");
  }

  try {
    addLog(`Downloading new logo image from ${attachment.url}...`);
    const res = await axios.get(attachment.url, { responseType: "arraybuffer" });
    const logoPath = path.join(process.cwd(), "assets", "logo.png");

    await fs.writeFile(logoPath, Buffer.from(res.data));
    addLog(`Custom logo successfully updated!`);

    await interaction.editReply("🟢 Custom server logo updated successfully!");
  } catch (err: any) {
    addLog(`Failed to save logo: ${err.message}`, "error");
    await interaction.editReply(`❌ Failed to update logo: ${err.message}`);
  }
}

async function handleSetStore(interaction: ChatInputCommandInteraction, configPath: string) {
  const url = interaction.options.getString("url", true);
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return interaction.reply({ content: "❌ Store must be a valid HTTP/HTTPS link.", ephemeral: true });
  }

  const config: BotConfig = await fs.readJson(configPath);
  config.store = url;
  await fs.writeJson(configPath, config, { spaces: 2 });

  addLog(`Store link updated to: ${url}`);
  await interaction.reply({ content: `🟢 Store link successfully updated to: \`${url}\``, ephemeral: true });
}

async function handleSetIP(interaction: ChatInputCommandInteraction, configPath: string) {
  const ip = interaction.options.getString("ip", true);

  const config: BotConfig = await fs.readJson(configPath);
  config.javaIP = ip;
  await fs.writeJson(configPath, config, { spaces: 2 });

  addLog(`Java IP updated to: ${ip}`);
  await interaction.reply({ content: `🟢 Java Edition IP successfully set to: \`${ip}\``, ephemeral: true });
}

async function handleSetBedrock(interaction: ChatInputCommandInteraction, configPath: string) {
  const ip = interaction.options.getString("ip", true);
  const port = interaction.options.getInteger("port") ?? 19132;

  const config: BotConfig = await fs.readJson(configPath);
  config.bedrockIP = ip;
  config.bedrockPort = port;
  await fs.writeJson(configPath, config, { spaces: 2 });

  addLog(`Bedrock setting updated to: ${ip}:${port}`);
  await interaction.reply({ content: `🟢 Bedrock IP successfully set to \`${ip}\` on Port \`${port}\``, ephemeral: true });
}

async function handleReload(interaction: ChatInputCommandInteraction, configPath: string) {
  addLog("Manual configuration reload triggered from Discord.");
  await interaction.reply({ content: "🔄 Configuration successfully reloaded from config.json!", ephemeral: true });
}

async function handleHelp(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle("OrangeMC Bot Help Menu")
    .setColor(0xf97316)
    .setDescription("Here is a list of all administrative and status commands available:")
    .addFields(
      { name: "`/status`", value: "Display the premium visual Minecraft status panel." },
      { name: "`/setbackground`", value: "Update the panel background image (Attach image)." },
      { name: "`/setlogo`", value: "Update the server brand logo (Attach logo)." },
      { name: "`/setip <java_ip>`", value: "Set Java server host address." },
      { name: "`/setbedrock <bedrock_ip> [port]`", value: "Set Bedrock server host address & port." },
      { name: "`/setstore <url>`", value: "Update the web store link." },
      { name: "`/reload`", value: "Reload settings from config.json." }
    )
    .setFooter({ text: "OrangeMC Minecraft Bot • 2026" });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// -----------------------------------------------------------------------------
// Embed & Component Helpers
// -----------------------------------------------------------------------------

function createStatusEmbed(config: BotConfig, java: ServerStatusInfo, bedrock: ServerStatusInfo): EmbedBuilder {
  const isOnline = java.online || bedrock.online;
  const playersOnline = isOnline ? Math.max(java.playersOnline, bedrock.playersOnline) : 0;
  const playersMax = isOnline ? Math.max(java.playersMax, bedrock.playersMax) : 100;

  return new EmbedBuilder()
    .setTitle("🟠 VOLEX NETWORK STATUS")
    .setColor(isOnline ? 0x22c55e : 0xef4444)
    .setDescription(
      isOnline
        ? `🟢 **The Minecraft Server is currently Online!**\nCome join the network and start your ultimate adventure!`
        : `🔴 **SERVER OFFLINE**\nThe server is currently under maintenance or updates. Join our Discord for notifications.`
    )
    .addFields(
      {
        name: "👥 Players Online",
        value: `**${playersOnline}** / **${playersMax}**`,
        inline: true,
      },
      {
        name: "📶 Java IP (v1.20+)",
        value: `\`${config.javaIP}\``,
        inline: true,
      },
      {
        name: "📱 Bedrock (PE)",
        value: `\`${config.bedrockIP}:${config.bedrockPort}\``,
        inline: true,
      },
      {
        name: "🛒 Web Store",
        value: `[volex-store.onrender.com](${config.store})`,
        inline: true,
      },
      {
        name: "🌐 Official Website",
        value: `[volex-store.onrender.com](${config.website})`,
        inline: true,
      },
      {
        name: "💬 Discord Server",
        value: `[Join Community](${config.discord})`,
        inline: true,
      }
    )
    .setImage("attachment://status-panel.png")
    .setFooter({ text: `Last updated: ${new Date().toLocaleTimeString()} UTC` });
}

function createActionRow(config: BotConfig): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Join Discord")
      .setStyle(ButtonStyle.Link)
      .setURL(config.discord),
    new ButtonBuilder()
      .setLabel("Open Store")
      .setStyle(ButtonStyle.Link)
      .setURL(config.store),
    new ButtonBuilder()
      .setLabel("Visit Website")
      .setStyle(ButtonStyle.Link)
      .setURL(config.website)
  );
}
