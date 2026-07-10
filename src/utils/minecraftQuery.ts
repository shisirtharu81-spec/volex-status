import * as mc from "minecraft-server-util";
import axios from "axios";
import { ServerStatusInfo } from "../types";

export function parseAddress(address: string, defaultPort: number): { host: string; port: number } {
  if (!address) return { host: "127.0.0.1", port: defaultPort };
  const parts = address.split(":");
  const host = parts[0];
  const port = parts[1] ? parseInt(parts[1], 10) : defaultPort;
  return { host, port };
}

async function queryJavaFallback(host: string, port: number): Promise<ServerStatusInfo> {
  // 1. Try Direct TCP status query
  try {
    const result: any = await mc.status(host, port, {
      timeout: 2500,
      enableSRV: true,
    });

    let cleanMotd = "A Minecraft Server";
    if (result.motd && typeof result.motd === "object") {
      cleanMotd = result.motd.clean || "A Minecraft Server";
    } else if (typeof result.motd === "string") {
      cleanMotd = result.motd;
    } else if (result.description && typeof result.description === "object") {
      cleanMotd = (result.description as any).clean || "A Minecraft Server";
    } else if (typeof result.description === "string") {
      cleanMotd = result.description;
    }

    return {
      online: true,
      ping: result.roundTripLatency ?? 0,
      playersOnline: result.players?.online ?? 0,
      playersMax: result.players?.max ?? 100,
      version: result.version?.name ?? "1.20+",
      software: (result as any).software ?? "Paper/Purpur",
      motd: cleanMotd.replace(/\n/g, " ").trim(),
    };
  } catch (err: any) {
    console.log(`Direct Java TCP query failed for ${host}:${port}. Trying mcstatus.io HTTP fallback...`);
  }

  // 2. Try mcstatus.io API
  try {
    const res = await axios.get(`https://api.mcstatus.io/v2/status/java/${host}:${port}`, { timeout: 3000 });
    const data = res.data;
    if (data && data.online) {
      return {
        online: true,
        ping: data.roundTripLatency ?? 45,
        playersOnline: data.players?.online ?? 0,
        playersMax: data.players?.max ?? 100,
        version: data.version?.name ?? "1.20+",
        software: data.software ?? "Paper/Purpur",
        motd: (data.motd?.clean || "A Minecraft Server").replace(/\n/g, " ").trim(),
      };
    }
  } catch (err: any) {
    console.log(`mcstatus.io Java fallback failed for ${host}:${port}. Trying mcsrvstat.us fallback...`);
  }

  // 3. Try mcsrvstat.us API
  try {
    const res = await axios.get(`https://api.mcsrvstat.us/2/${host}:${port}`, { timeout: 3000 });
    const data = res.data;
    if (data && data.online) {
      return {
        online: true,
        ping: 45,
        playersOnline: data.players?.online ?? 0,
        playersMax: data.players?.max ?? 100,
        version: data.version ?? "1.20+",
        software: data.software ?? "Paper/Purpur",
        motd: (data.motd?.clean?.[0] || data.motd?.clean?.join(" ") || "A Minecraft Server").replace(/\n/g, " ").trim(),
      };
    }
  } catch (err: any) {
    console.log(`All Java status queries failed for ${host}:${port}.`);
  }

  return {
    online: false,
    ping: 0,
    playersOnline: 0,
    playersMax: 0,
    version: "N/A",
    software: "Vanilla",
    motd: "Offline",
  };
}

async function queryBedrockFallback(host: string, port: number): Promise<ServerStatusInfo & { port: number }> {
  // 1. Try Direct UDP status query
  try {
    const result: any = await mc.statusBedrock(host, port, {
      timeout: 2500,
    });

    let cleanMotd = "OrangeMC Bedrock Server";
    if (result.motd && typeof result.motd === "object") {
      cleanMotd = result.motd.clean || "OrangeMC Bedrock Server";
    } else if (typeof result.motd === "string") {
      cleanMotd = result.motd;
    } else if (result.description && typeof result.description === "object") {
      cleanMotd = (result.description as any).clean || "OrangeMC Bedrock Server";
    } else if (typeof result.description === "string") {
      cleanMotd = result.description;
    }

    return {
      online: true,
      ping: result.roundTripLatency ?? 0,
      playersOnline: result.players?.online ?? 0,
      playersMax: result.players?.max ?? 100,
      version: result.version?.name ?? "Bedrock Edition",
      software: "Bedrock Server",
      motd: cleanMotd.replace(/\n/g, " ").trim(),
      port: port,
    };
  } catch (err: any) {
    console.log(`Direct Bedrock UDP query failed for ${host}:${port}. Trying mcstatus.io HTTP fallback...`);
  }

  // 2. Try mcstatus.io API
  try {
    const res = await axios.get(`https://api.mcstatus.io/v2/status/bedrock/${host}:${port}`, { timeout: 3000 });
    const data = res.data;
    if (data && data.online) {
      return {
        online: true,
        ping: data.roundTripLatency ?? 50,
        playersOnline: data.players?.online ?? 0,
        playersMax: data.players?.max ?? 100,
        version: data.version?.name ?? "Bedrock Edition",
        software: "Bedrock Server",
        motd: (data.motd?.clean || "OrangeMC Bedrock Server").replace(/\n/g, " ").trim(),
        port: port,
      };
    }
  } catch (err: any) {
    console.log(`mcstatus.io Bedrock fallback failed for ${host}:${port}. Trying mcsrvstat.us fallback...`);
  }

  // 3. Try mcsrvstat.us API
  try {
    const res = await axios.get(`https://api.mcsrvstat.us/bedrock/2/${host}:${port}`, { timeout: 3000 });
    const data = res.data;
    if (data && data.online) {
      return {
        online: true,
        ping: 50,
        playersOnline: data.players?.online ?? 0,
        playersMax: data.players?.max ?? 100,
        version: data.version ?? "Bedrock Edition",
        software: "Bedrock Server",
        motd: (data.motd?.clean?.[0] || data.motd?.clean?.join(" ") || "OrangeMC Bedrock Server").replace(/\n/g, " ").trim(),
        port: port,
      };
    }
  } catch (err: any) {
    console.log(`All Bedrock status queries failed for ${host}:${port}.`);
  }

  return {
    online: false,
    ping: 0,
    playersOnline: 0,
    playersMax: 0,
    version: "N/A",
    software: "Geyser",
    motd: "Offline",
    port: port,
  };
}

export async function queryMinecraftServer(
  javaIP: string,
  bedrockIP: string,
  bedrockPort: number
): Promise<{ java: ServerStatusInfo; bedrock: ServerStatusInfo & { port: number } }> {
  const javaAddr = parseAddress(javaIP, 25565);
  const bedrockAddr = parseAddress(bedrockIP, bedrockPort);

  const [java, bedrock] = await Promise.all([
    queryJavaFallback(javaAddr.host, javaAddr.port),
    queryBedrockFallback(bedrockAddr.host, bedrockAddr.port),
  ]);

  return { java, bedrock };
}
