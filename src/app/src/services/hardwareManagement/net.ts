import { exec } from "child_process";
import {
  NetworkDeviceInfo,
  NetworkDeviceSummary,
  NetworkDeviceType,
  NetworkDeviceState,
  NetworkIPv4Config,
} from "@common/types/network"

// Helper promisificado
const run = (cmd: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        return reject(
          new Error(
            `Command failed: ${cmd}\n${stderr || err.message || "Unknown error"}`
          )
        );
      }
      resolve(stdout.trim());
    });
  });
};

const mapType = (type: string): NetworkDeviceType => {
  switch (type) {
    case "ethernet":
      return "ethernet";
    case "wifi":
      return "wifi";
    case "loopback":
      return "loopback";
    default:
      return "unknown";
  }
};

const mapState = (state: string): NetworkDeviceState => {
  switch (state) {
    case "connected":
      return "connected";
    case "disconnected":
      return "disconnected";
    case "unavailable":
      return "unavailable";
    default:
      return "unknown";
  }
};

export class NetworkManagerService {
  /**
   * Lista todos los dispositivos conocidos por NetworkManager.
   * Usa: `nmcli -t -f DEVICE,TYPE,STATE,CONNECTION device status`
   */
  static async listDevices(): Promise<NetworkDeviceSummary[]> {
    const cmd =
      'nmcli -t -f DEVICE,TYPE,STATE,CONNECTION device status';
    
    try {
      const out = await run(cmd);

      if (!out) {
        console.log("Empty output from nmcli");
        return [];
      }

      const lines = out.split("\n").filter(Boolean);

      const devices = lines.map<NetworkDeviceSummary>((line) => {
        const [device, type, state, connectionRaw] = line.split(":");
        return {
          device,
          type: mapType(type),
          state: mapState(state),
          connection: connectionRaw && connectionRaw !== "--"
            ? connectionRaw
            : null,
        };
      });

      return devices;
    } catch (error) {
      console.error("Error in listDevices:", error);
      throw error;
    }
  }

  /**
   * Devuelve el nombre de la conexión asociada a un device (eth0, wlan0, etc)
   * Usa: `nmcli -t -f GENERAL.CONNECTION device show <device>`
   */
  static async getConnectionNameForDevice(
    device: string
  ): Promise<string | null> {
    const cmd = `nmcli -t -f GENERAL.CONNECTION device show ${device}`;
    const out = await run(cmd); // GENERAL.CONNECTION:Wired connection 1

    const [, value] = out.split(":");
    const connection = value?.trim();
    if (!connection || connection === "--") return null;
    return connection;
  }

  /**
   * Obtiene información detallada de un device.
   * Usa: `nmcli -t device show <device>`
   */
  static async getDeviceInfo(device: string): Promise<NetworkDeviceInfo> {
    const cmd = `nmcli -t device show ${device}`;
    const out = await run(cmd);

    const info: Record<string, string> = {};

    out
      .split("\n")
      .filter(Boolean)
      .forEach((line) => {
        const [key, ...rest] = line.split(":");
        const value = rest.join(":"); // por si el valor incluye ':'
        info[key] = value;
      });

    const type = mapType(info["GENERAL.TYPE"]);
    const state = mapState(
      (info["GENERAL.STATE"] || "").split(" ")[0] // "100 (connected)" → "100"
    );

    // IPv4
    const ipv4: NetworkIPv4Config = {
      method: "unknown",
      dns: [],
    };

    const methodRaw = info["IP4.METHOD"];
    if (methodRaw === "auto") ipv4.method = "auto";
    else if (methodRaw === "manual") ipv4.method = "manual";
    else if (methodRaw === "disabled") ipv4.method = "disabled";

    // La primera IP (si existe)
    const ipv4AddressKey = Object.keys(info).find((key) =>
      key.startsWith("IP4.ADDRESS[")
    );
    if (ipv4AddressKey) {
      ipv4.address = info[ipv4AddressKey];
    }

    if (info["IP4.GATEWAY"]) {
      ipv4.gateway = info["IP4.GATEWAY"];
    }

    // DNS (podría haber varios IP4.DNS[x])
    Object.keys(info)
      .filter((k) => k.startsWith("IP4.DNS["))
      .sort()
      .forEach((k) => {
        if (info[k]) ipv4.dns.push(info[k]);
      });

    const mtu = info["GENERAL.MTU"]
      ? parseInt(info["GENERAL.MTU"], 10)
      : undefined;

    return {
      device,
      type,
      state,
      mac: info["GENERAL.HWADDR"],
      mtu: Number.isNaN(mtu || NaN) ? undefined : mtu,
      connection:
        info["GENERAL.CONNECTION"] && info["GENERAL.CONNECTION"] !== "--"
          ? info["GENERAL.CONNECTION"]
          : null,
      ipv4,
    };
  }

  /**
   * Configura IP estática sobre un device (eth0, wlan0, etc).
   * Obtiene el connectionName automáticamente y modifica la conexión.
   *
   * IMPORTANTE:
   *   - Requiere permisos (sudo o correr como root).
   *   - ipWithPrefix: "192.168.10.50/24"
   *   - dns: array de IPs DNS, se concatenan con coma.
   */
  static async setStaticIP(
    device: string,
    ipWithPrefix: string,
    gateway: string,
    dns: string[]
  ): Promise<void> {
    const connectionName = await this.getConnectionNameForDevice(device);
    if (!connectionName) {
      throw new Error(
        `No se encontró una conexión asociada al device ${device}`
      );
    }

    const dnsJoined = dns.join(",");

    const modifyCmd = [
      `nmcli connection modify "${connectionName}"`,
      `ipv4.addresses ${ipWithPrefix}`,
      `ipv4.gateway ${gateway}`,
      `ipv4.dns ${dnsJoined}`,
      `ipv4.method manual`,
    ].join(" ");

    await run(modifyCmd);

    // Levantar la conexión con la nueva config
    await run(`nmcli connection up "${connectionName}"`);
  }

  /**
   * Configura el device para obtener IP por DHCP (auto).
   */
  static async setDHCP(device: string): Promise<void> {
    const connectionName = await this.getConnectionNameForDevice(device);
    if (!connectionName) {
      throw new Error(
        `No se encontró una conexión asociada al device ${device}`
      );
    }

    const modifyCmd = [
      `nmcli connection modify "${connectionName}"`,
      `ipv4.method auto`,
      `ipv4.addresses ""`,
      `ipv4.gateway ""`,
      `ipv4.dns ""`,
    ].join(" ");

    await run(modifyCmd);
    await run(`nmcli connection up "${connectionName}"`);
  }

  /**
   * Reinicia networking (útil si tocás varias cosas).
   * En la mayoría de los sistemas con NetworkManager, esto es suficiente.
   */
  static async restartNetworking(): Promise<void> {
    try {
      await run("nmcli networking off");
      await run("nmcli networking on");
    } catch (err) {
      // fallback por si nmcli falla (ej: usar systemd)
      await run("sudo systemctl restart NetworkManager");
    }
  }
}
