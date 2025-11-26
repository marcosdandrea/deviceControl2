import { exec } from "child_process";
import {
  NetworkDeviceInfo,
  NetworkDeviceSummary,
  NetworkDeviceType,
  NetworkDeviceState,
  NetworkIPv4Config,
} from "@common/types/network"
import dotenv from "dotenv";

dotenv.config();

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
  // Try to run a command, and if it fails for privilege reasons,
  // use SYSTEM_USER_PASSWORD from .env with sudo -S (stdin password).
  private static async runPrivileged(cmd: string): Promise<string> {
    try {
      return await run(cmd);
    } catch (err: any) {
      const msg = String(err?.message || err);
      // If the failure looks like insufficient privileges, use sudo with password from .env
      if (msg.toLowerCase().includes("insufficient privileges") || msg.toLowerCase().includes("permission denied") || msg.toLowerCase().includes("not authorized")) {
        const password = process.env.SYSTEM_USER_PASSWORD;
        if (!password) {
          throw new Error(
            `Insufficient privileges to run command and SYSTEM_USER_PASSWORD is not set in .env. Original error: ${msg}`
          );
        }

        try {
          // Use sudo -S to read password from stdin
          const safe = cmd.replace(/'/g, "'\"'\"'");
          return await run(`echo '${password}' | sudo -S bash -c '${safe}'`);
        } catch (err3: any) {
          throw new Error(
            `Failed to run privileged command with sudo. Ensure SYSTEM_USER_PASSWORD is correct and user has sudo privileges. Original error: ${err3?.message || err3}`
          );
        }
      }

      // If it's a different error, rethrow it
      throw err;
    }
  }
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

      // Obtener nombres de devices y luego pedir info detallada por cada uno
      const deviceNames = lines.map((line) => line.split(":")[0]);

      const details = await Promise.all(
        deviceNames.map(async (device) => {
          try {
            return await this.getDeviceInfo(device);
          } catch (err) {
            console.error(`Failed to getDeviceInfo for ${device}:`, err);
            // Devolver un objeto mínimo para no romper el flujo
            return {
              device,
              type: "unknown" as NetworkDeviceType,
              state: "unknown" as NetworkDeviceState,
              connection: null,
              ipv4: { method: "unknown", dns: [] } as NetworkIPv4Config,
            } as NetworkDeviceInfo;
          }
        })
      );

      const devices = details.map<NetworkDeviceSummary>((d) => {
        const ipv4 = d.ipv4 || ({ method: "unknown", dns: [] } as NetworkIPv4Config);

        // Avoid duplicating gateway/dns at top-level when already present inside ipv4
        return {
          device: d.device,
          type: d.type,
          state: d.state,
          connection: d.connection ?? null,
          dhcp: ipv4.method === "auto",
          ipv4,
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
   * Primero intenta obtener la conexión activa, si no hay, busca cualquier conexión
   * configurada para ese dispositivo.
   */
  static async getConnectionNameForDevice(
    device: string
  ): Promise<string | null> {
    // Intentar obtener la conexión activa
    const cmd = `nmcli -t -f GENERAL.CONNECTION device show ${device}`;
    try {
      const out = await run(cmd);
      const [, value] = out.split(":");
      const connection = value?.trim();
      if (connection && connection !== "--") return connection;
    } catch (err) {
      // Si falla, continuar buscando conexiones disponibles
    }

    // Si no hay conexión activa, buscar conexiones configuradas para este dispositivo
    try {
      const listCmd = `nmcli -t -f NAME,DEVICE connection show`;
      const out = await run(listCmd);
      const lines = out.split("\n").filter(Boolean);
      
      for (const line of lines) {
        const [name, dev] = line.split(":");
        if (dev?.trim() === device || dev?.trim() === "--") {
          // Si el device coincide, o si la conexión no está asignada a ningún device específico
          // verificar si es compatible con este device
          if (dev?.trim() === device) {
            return name?.trim();
          }
        }
      }

      // Como último recurso, buscar conexiones que puedan ser compatibles con este tipo de device
      const typeCmd = `nmcli -t -f GENERAL.TYPE device show ${device}`;
      const typeOut = await run(typeCmd);
      const deviceType = typeOut.split(":")[1]?.trim();

      // Buscar conexiones sin dispositivo asignado del mismo tipo
      for (const line of lines) {
        const [name, dev] = line.split(":");
        if (dev?.trim() === "--" || dev?.trim() === "") {
          // Verificar si esta conexión es del tipo correcto
          try {
            const connTypeCmd = `nmcli -t -f connection.type connection show "${name?.trim()}"`;
            const connTypeOut = await run(connTypeCmd);
            const connType = connTypeOut.split(":")[1]?.trim();
            
            if ((deviceType === "ethernet" && connType === "802-3-ethernet") ||
                (deviceType === "wifi" && connType === "802-11-wireless")) {
              return name?.trim();
            }
          } catch (e) {
            // Ignorar errores al verificar tipo de conexión
          }
        }
      }
    } catch (err) {
      console.error(`Error searching for connections for device ${device}:`, err);
    }

    return null;
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
        const [keyRaw, ...rest] = line.split(":");
        const key = keyRaw.trim();
        const value = rest.join(":").trim(); // por si el valor incluye ':'
        info[key] = value;
      });

    const type = mapType(info["GENERAL.TYPE"]);
    const genStateRaw = info["GENERAL.STATE"] || "";
    const stateMatch = genStateRaw.match(/\(([^)]+)\)/);
    const stateStr = stateMatch ? stateMatch[1] : genStateRaw.trim();
    const state = mapState(stateStr);

    // IPv4
    const ipv4: NetworkIPv4Config = {
      method: "unknown",
      dns: [],
    };

    let methodRaw = (info["IP4.METHOD"] || "").toLowerCase();

    // If nmcli device show doesn't provide IP4.METHOD, try the connection's config
    if (!methodRaw) {
      const connName = info["GENERAL.CONNECTION"];
      if (connName && connName !== "--") {
        try {
          const connOut = await run(
            `nmcli -t -f ipv4.method connection show "${connName}"`
          );
          const parsed = connOut.includes(":") ? connOut.split(":").pop() : connOut;
          methodRaw = (parsed || "").toLowerCase();
        } catch (err) {
          // ignore and fallback below
        }
      }
    }

    if (methodRaw.includes("auto") || methodRaw.includes("dhcp")) ipv4.method = "auto";
    else if (methodRaw.includes("manual")) ipv4.method = "manual";
    else if (methodRaw.includes("disabled")) ipv4.method = "disabled";

    // Fallback heuristics: if still unknown, infer from presence of IP4.ADDRESS
    if (ipv4.method === "unknown") {
      if (ipv4.address) ipv4.method = "manual";
      else ipv4.method = "auto";
    }

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
   * Usa el connectionName provisto o lo obtiene automáticamente.
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
    dns: string[],
    connectionName?: string | null
  ): Promise<void> {
    const connName = connectionName || await this.getConnectionNameForDevice(device);
    
    if (!connName) {
      throw new Error(
        `No se encontró una conexión asociada al device ${device}. Asegúrate de que el dispositivo tenga una conexión de NetworkManager configurada.`
      );
    }

    const dnsJoined = dns.length > 0 ? dns.join(",") : "";

    // El método debe establecerse primero, luego las otras propiedades
    const modifyCmd = [
      `nmcli connection modify "${connName}"`,
      `ipv4.method manual`,
      `ipv4.addresses ${ipWithPrefix}`,
      `ipv4.gateway ${gateway}`,
      dnsJoined ? `ipv4.dns "${dnsJoined}"` : `ipv4.dns ""`,
    ].join(" ");

    await this.runPrivileged(modifyCmd);

    // Levantar la conexión con la nueva config
    await this.runPrivileged(`nmcli connection up "${connName}"`);
  }

  /**
   * Configura el device para obtener IP por DHCP (auto).
   * Usa el connectionName provisto o lo obtiene automáticamente.
   */
  static async setDHCP(device: string, connectionName?: string | null): Promise<void> {
    const connName = connectionName || await this.getConnectionNameForDevice(device);
    
    if (!connName) {
      throw new Error(
        `No se encontró una conexión asociada al device ${device}. Asegúrate de que el dispositivo tenga una conexión de NetworkManager configurada.`
      );
    }

    // El método debe establecerse primero, luego limpiar las otras propiedades
    const modifyCmd = [
      `nmcli connection modify "${connName}"`,
      `ipv4.method auto`,
      `ipv4.addresses ""`,
      `ipv4.gateway ""`,
      `ipv4.dns ""`,
    ].join(" ");

    await this.runPrivileged(modifyCmd);
    await this.runPrivileged(`nmcli connection up "${connName}"`);
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
