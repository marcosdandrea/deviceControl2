import { exec } from "child_process";
import * as os from "os";
import {
  NetworkDeviceInfo,
  NetworkDeviceSummary,
  NetworkDeviceType,
  NetworkDeviceState,
  NetworkIPv4Config,
} from "@common/types/network"
import dotenv from "dotenv";

dotenv.config();

type Platform = "linux" | "windows" | "darwin" | "unknown";

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
  // Cache para listDevices (persistente durante toda la ejecución)
  private static devicesCache: NetworkDeviceSummary[] | null = null;

  /**
   * Detects the current operating system platform
   */
  private static getPlatform(): Platform {
    const platform = os.platform();
    if (platform === "linux") return "linux";
    if (platform === "win32") return "windows";
    if (platform === "darwin") return "darwin";
    return "unknown";
  }

  /**
   * Checks if the current platform supports write operations
   */
  private static canModifyNetwork(): boolean {
    return this.getPlatform() === "linux";
  }

  /**
   * Throws an error if write operations are not supported on current platform
   */
  private static ensureWriteSupported(): void {
    if (!this.canModifyNetwork()) {
      throw new Error(
        `La modificación de configuración de red no está permitida en ${this.getPlatform()}. Solo se admiten operaciones de lectura.`
      );
    }
  }

  // Try to run a command, and if it fails for privilege reasons,
  // first try with sudo (no password), then with SYSTEM_USER_PASSWORD from .env if needed
  private static async runPrivileged(cmd: string): Promise<string> {
    try {
      return await run(cmd);
    } catch (err: any) {
      const msg = String(err?.message || err);
      // If the failure looks like insufficient privileges, try with sudo
      if (msg.toLowerCase().includes("insufficient privileges") || msg.toLowerCase().includes("permission denied") || msg.toLowerCase().includes("not authorized")) {
        
        // First attempt: try sudo without password (works if user has no password or sudoers is configured)
        try {
          const safe = cmd.replace(/'/g, "'\"'\"'");
          return await run(`sudo bash -c '${safe}'`);
        } catch (sudoErr: any) {
          // If sudo without password fails, try with password from .env
          const password = process.env.SYSTEM_USER_PASSWORD;
          if (!password) {
            throw new Error(
              `Insufficient privileges. Configure sudoers to allow nmcli without password, or set SYSTEM_USER_PASSWORD in .env. Original error: ${msg}`
            );
          }

          try {
            // Use sudo -S to read password from stdin
            const safe = cmd.replace(/'/g, "'\"'\"'");
            return await run(`echo '${password}' | sudo -S bash -c '${safe}'`);
          } catch (err3: any) {
            throw new Error(
              `Failed to run privileged command. Ensure SYSTEM_USER_PASSWORD is correct and user has sudo privileges. Original error: ${err3?.message || err3}`
            );
          }
        }
      }

      // If it's a different error, rethrow it
      throw err;
    }
  }
  /**
   * Lista todos los dispositivos de red en Linux usando NetworkManager.
   * Usa: `nmcli -t -f DEVICE,TYPE,STATE,CONNECTION device status`
   */
  private static async listDevicesLinux(): Promise<NetworkDeviceSummary[]> {
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
            return await this.getDeviceInfoLinux(device);
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
      console.error("Error in listDevicesLinux:", error);
      throw error;
    }
  }

  /**
   * Lista todos los dispositivos de red en Windows usando PowerShell.
   */
  private static async listDevicesWindows(): Promise<NetworkDeviceSummary[]> {
    try {
      // Usar Get-NetAdapter para obtener información de adaptadores
      const cmd = `powershell -Command "Get-NetAdapter | Select-Object Name,InterfaceDescription,Status,MacAddress,ifIndex | ConvertTo-Json"`;
      const out = await run(cmd);
      
      if (!out) {
        return [];
      }

      const adapters = JSON.parse(out);
      const adapterArray = Array.isArray(adapters) ? adapters : [adapters];

      const devices: NetworkDeviceSummary[] = [];

      for (const adapter of adapterArray) {
        try {
          // Obtener configuración IP para cada adaptador
          const ipCmd = `powershell -Command "Get-NetIPAddress -InterfaceIndex ${adapter.ifIndex} -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object IPAddress,PrefixLength | ConvertTo-Json"`;
          const ipOut = await run(ipCmd);
          
          let ipAddress = undefined;
          let prefixLength = undefined;

          if (ipOut) {
            try {
              const ipInfo = JSON.parse(ipOut);
              const ipData = Array.isArray(ipInfo) ? ipInfo[0] : ipInfo;
              ipAddress = ipData?.IPAddress;
              prefixLength = ipData?.PrefixLength;
            } catch (e) {
              // Ignorar errores de parseo
            }
          }

          // Obtener gateway
          const gatewayCmd = `powershell -Command "Get-NetRoute -InterfaceIndex ${adapter.ifIndex} -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue | Select-Object NextHop | ConvertTo-Json"`;
          let gateway = undefined;
          try {
            const gatewayOut = await run(gatewayCmd);
            if (gatewayOut) {
              const gatewayInfo = JSON.parse(gatewayOut);
              gateway = gatewayInfo?.NextHop;
            }
          } catch (e) {
            // Ignorar errores
          }

          // Obtener DNS
          const dnsCmd = `powershell -Command "Get-DnsClientServerAddress -InterfaceIndex ${adapter.ifIndex} -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object ServerAddresses | ConvertTo-Json"`;
          let dns: string[] = [];
          try {
            const dnsOut = await run(dnsCmd);
            if (dnsOut) {
              const dnsInfo = JSON.parse(dnsOut);
              dns = dnsInfo?.ServerAddresses || [];
            }
          } catch (e) {
            // Ignorar errores
          }

          // Determinar tipo de interfaz
          let type: NetworkDeviceType = "unknown";
          const desc = adapter.InterfaceDescription?.toLowerCase() || "";
          if (desc.includes("wireless") || desc.includes("wi-fi") || desc.includes("wifi")) {
            type = "wifi";
          } else if (desc.includes("ethernet") || desc.includes("lan")) {
            type = "ethernet";
          } else if (adapter.Name?.toLowerCase().includes("loopback")) {
            type = "loopback";
          }

          // Determinar estado
          let state: NetworkDeviceState = "unknown";
          if (adapter.Status === "Up") {
            state = "connected";
          } else if (adapter.Status === "Down" || adapter.Status === "Disabled") {
            state = "disconnected";
          } else {
            state = "unavailable";
          }

          // Determinar si usa DHCP
          const dhcpCmd = `powershell -Command "Get-NetIPInterface -InterfaceIndex ${adapter.ifIndex} -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object Dhcp | ConvertTo-Json"`;
          let dhcp = false;
          try {
            const dhcpOut = await run(dhcpCmd);
            if (dhcpOut) {
              const dhcpInfo = JSON.parse(dhcpOut);
              dhcp = dhcpInfo?.Dhcp === "Enabled";
            }
          } catch (e) {
            // Asumir DHCP si hay error
            dhcp = true;
          }

          const ipv4: NetworkIPv4Config = {
            method: dhcp ? "auto" : "manual",
            address: ipAddress && prefixLength ? `${ipAddress}/${prefixLength}` : undefined,
            gateway,
            dns,
          };

          devices.push({
            device: adapter.Name,
            type,
            state,
            connection: adapter.InterfaceDescription || null,
            dhcp,
            ipv4,
          });
        } catch (err) {
          console.error(`Error processing adapter ${adapter.Name}:`, err);
        }
      }

      return devices;
    } catch (error) {
      console.error("Error in listDevicesWindows:", error);
      throw error;
    }
  }

  /**
   * Lista todos los dispositivos de red en macOS.
   */
  private static async listDevicesMac(): Promise<NetworkDeviceSummary[]> {
    try {
      // Obtener lista de servicios de red
      const cmd = `networksetup -listallhardwareports`;
      const out = await run(cmd);

      if (!out) {
        return [];
      }

      const devices: NetworkDeviceSummary[] = [];
      const lines = out.split("\n");
      
      let currentPort: { name?: string; device?: string; mac?: string } = {};

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith("Hardware Port:")) {
          if (currentPort.device) {
            // Procesar el puerto anterior
            await this.processMapPort(currentPort, devices);
          }
          currentPort = { name: line.replace("Hardware Port:", "").trim() };
        } else if (line.startsWith("Device:")) {
          currentPort.device = line.replace("Device:", "").trim();
        } else if (line.startsWith("Ethernet Address:")) {
          currentPort.mac = line.replace("Ethernet Address:", "").trim();
        }
      }

      // Procesar el último puerto
      if (currentPort.device) {
        await this.processMapPort(currentPort, devices);
      }

      return devices;
    } catch (error) {
      console.error("Error in listDevicesMac:", error);
      throw error;
    }
  }

  /**
   * Procesa un puerto de red de macOS y lo agrega a la lista de dispositivos
   */
  private static async processMapPort(
    port: { name?: string; device?: string; mac?: string },
    devices: NetworkDeviceSummary[]
  ): Promise<void> {
    if (!port.device || !port.name) return;

    try {
      // Determinar tipo
      let type: NetworkDeviceType = "unknown";
      const name = port.name.toLowerCase();
      if (name.includes("wi-fi") || name.includes("wifi") || name.includes("wireless")) {
        type = "wifi";
      } else if (name.includes("ethernet") || name.includes("thunderbolt") || name.includes("usb")) {
        type = "ethernet";
      }

      // Obtener información de IP usando ifconfig
      const ifconfigCmd = `ifconfig ${port.device}`;
      let ipAddress = undefined;
      let gateway = undefined;
      let state: NetworkDeviceState = "disconnected";
      
      try {
        const ifconfigOut = await run(ifconfigCmd);
        
        // Verificar si está activo
        if (ifconfigOut.includes("status: active")) {
          state = "connected";
        } else if (ifconfigOut.includes("status: inactive")) {
          state = "disconnected";
        }

        // Extraer dirección IP
        const ipMatch = ifconfigOut.match(/inet\s+(\d+\.\d+\.\d+\.\d+)\s+netmask\s+0x([0-9a-f]+)/);
        if (ipMatch) {
          const ip = ipMatch[1];
          const netmaskHex = ipMatch[2];
          // Convertir netmask hex a CIDR
          const netmaskInt = parseInt(netmaskHex, 16);
          const cidr = netmaskInt.toString(2).split('1').length - 1;
          ipAddress = `${ip}/${cidr}`;
        }
      } catch (e) {
        // Ignorar errores de ifconfig
      }

      // Obtener gateway
      try {
        const routeCmd = `route -n get default`;
        const routeOut = await run(routeCmd);
        const gatewayMatch = routeOut.match(/gateway:\s+(\d+\.\d+\.\d+\.\d+)/);
        if (gatewayMatch) {
          gateway = gatewayMatch[1];
        }
      } catch (e) {
        // Ignorar errores
      }

      // Obtener DNS
      let dns: string[] = [];
      try {
        const dnsCmd = `networksetup -getdnsservers "${port.name}"`;
        const dnsOut = await run(dnsCmd);
        if (dnsOut && !dnsOut.includes("aren't any")) {
          dns = dnsOut.split("\n").filter(line => line.trim().match(/^\d+\.\d+\.\d+\.\d+$/));
        }
      } catch (e) {
        // Ignorar errores
      }

      // Determinar si usa DHCP
      let dhcp = false;
      try {
        const dhcpCmd = `networksetup -getinfo "${port.name}"`;
        const dhcpOut = await run(dhcpCmd);
        dhcp = dhcpOut.includes("DHCP Configuration");
      } catch (e) {
        // Asumir manual si hay error
        dhcp = false;
      }

      const ipv4: NetworkIPv4Config = {
        method: dhcp ? "auto" : "manual",
        address: ipAddress,
        gateway,
        dns,
      };

      devices.push({
        device: port.device,
        type,
        state,
        connection: port.name,
        dhcp,
        ipv4,
      });
    } catch (err) {
      console.error(`Error processing port ${port.device}:`, err);
    }
  }

  /**
   * Lista todos los dispositivos de red según la plataforma.
   * Usa caché persistente durante toda la ejecución de la aplicación.
   */
  static async listDevices(forceRefresh: boolean = false): Promise<NetworkDeviceSummary[]> {
    // Si hay caché y no se fuerza el refresh, retornar caché
    if (!forceRefresh && this.devicesCache !== null) {
      return this.devicesCache;
    }

    const platform = this.getPlatform();
    let devices: NetworkDeviceSummary[];
    
    switch (platform) {
      case "linux":
        devices = await this.listDevicesLinux();
        break;
      case "windows":
        devices = await this.listDevicesWindows();
        break;
      case "darwin":
        devices = await this.listDevicesMac();
        break;
      default:
        throw new Error(`Plataforma no soportada: ${platform}`);
    }

    // Actualizar caché
    this.devicesCache = devices;
    
    return devices;
  }

  /**
   * Limpia el caché de dispositivos de red.
   * Útil cuando se realizan cambios en la configuración de red.
   */
  static clearDevicesCache(): void {
    this.devicesCache = null;
  }

  /**
   * Devuelve el nombre de la conexión asociada a un device (eth0, wlan0, etc)
   * Primero intenta obtener la conexión activa, si no hay, busca cualquier conexión
   * configurada para ese dispositivo.
   * 
   * IMPORTANTE:
   *   - Solo funciona en Linux (NetworkManager).
   */
  static async getConnectionNameForDevice(
    device: string
  ): Promise<string | null> {
    if (this.getPlatform() !== "linux") {
      throw new Error("getConnectionNameForDevice solo está disponible en Linux");
    }
    
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
   * Obtiene información detallada de un device en Linux.
   * Usa: `nmcli -t device show <device>`
   */
  private static async getDeviceInfoLinux(device: string): Promise<NetworkDeviceInfo> {
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
   * Obtiene información detallada de un device en Windows.
   */
  private static async getDeviceInfoWindows(device: string): Promise<NetworkDeviceInfo> {
    try {
      // Buscar el adaptador por nombre
      const cmd = `powershell -Command "Get-NetAdapter | Where-Object { $_.Name -eq '${device}' } | Select-Object Name,InterfaceDescription,Status,MacAddress,ifIndex,MtuSize | ConvertTo-Json"`;
      const out = await run(cmd);

      if (!out) {
        throw new Error(`No se encontró el dispositivo ${device}`);
      }

      const adapter = JSON.parse(out);

      // Obtener configuración IP
      const ipCmd = `powershell -Command "Get-NetIPAddress -InterfaceIndex ${adapter.ifIndex} -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object IPAddress,PrefixLength | ConvertTo-Json"`;
      const ipOut = await run(ipCmd);
      
      let ipAddress = undefined;
      let prefixLength = undefined;

      if (ipOut) {
        try {
          const ipInfo = JSON.parse(ipOut);
          const ipData = Array.isArray(ipInfo) ? ipInfo[0] : ipInfo;
          ipAddress = ipData?.IPAddress;
          prefixLength = ipData?.PrefixLength;
        } catch (e) {
          // Ignorar errores
        }
      }

      // Obtener gateway
      const gatewayCmd = `powershell -Command "Get-NetRoute -InterfaceIndex ${adapter.ifIndex} -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue | Select-Object NextHop | ConvertTo-Json"`;
      let gateway = undefined;
      try {
        const gatewayOut = await run(gatewayCmd);
        if (gatewayOut) {
          const gatewayInfo = JSON.parse(gatewayOut);
          gateway = gatewayInfo?.NextHop;
        }
      } catch (e) {
        // Ignorar errores
      }

      // Obtener DNS
      const dnsCmd = `powershell -Command "Get-DnsClientServerAddress -InterfaceIndex ${adapter.ifIndex} -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object ServerAddresses | ConvertTo-Json"`;
      let dns: string[] = [];
      try {
        const dnsOut = await run(dnsCmd);
        if (dnsOut) {
          const dnsInfo = JSON.parse(dnsOut);
          dns = dnsInfo?.ServerAddresses || [];
        }
      } catch (e) {
        // Ignorar errores
      }

      // Determinar si usa DHCP
      const dhcpCmd = `powershell -Command "Get-NetIPInterface -InterfaceIndex ${adapter.ifIndex} -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object Dhcp | ConvertTo-Json"`;
      let dhcp = false;
      try {
        const dhcpOut = await run(dhcpCmd);
        if (dhcpOut) {
          const dhcpInfo = JSON.parse(dhcpOut);
          dhcp = dhcpInfo?.Dhcp === "Enabled";
        }
      } catch (e) {
        dhcp = true;
      }

      // Determinar tipo
      let type: NetworkDeviceType = "unknown";
      const desc = adapter.InterfaceDescription?.toLowerCase() || "";
      if (desc.includes("wireless") || desc.includes("wi-fi") || desc.includes("wifi")) {
        type = "wifi";
      } else if (desc.includes("ethernet") || desc.includes("lan")) {
        type = "ethernet";
      } else if (adapter.Name?.toLowerCase().includes("loopback")) {
        type = "loopback";
      }

      // Determinar estado
      let state: NetworkDeviceState = "unknown";
      if (adapter.Status === "Up") {
        state = "connected";
      } else if (adapter.Status === "Down" || adapter.Status === "Disabled") {
        state = "disconnected";
      } else {
        state = "unavailable";
      }

      const ipv4: NetworkIPv4Config = {
        method: dhcp ? "auto" : "manual",
        address: ipAddress && prefixLength ? `${ipAddress}/${prefixLength}` : undefined,
        gateway,
        dns,
      };

      return {
        device: adapter.Name,
        type,
        state,
        mac: adapter.MacAddress,
        mtu: adapter.MtuSize,
        connection: adapter.InterfaceDescription || null,
        ipv4,
      };
    } catch (error) {
      console.error(`Error getting device info for ${device} on Windows:`, error);
      throw error;
    }
  }

  /**
   * Obtiene información detallada de un device en macOS.
   */
  private static async getDeviceInfoMac(device: string): Promise<NetworkDeviceInfo> {
    try {
      // Buscar el puerto de hardware que corresponde a este dispositivo
      const portsCmd = `networksetup -listallhardwareports`;
      const portsOut = await run(portsCmd);

      let portName: string | null = null;
      let mac: string | undefined = undefined;

      const lines = portsOut.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("Device:") && line.includes(device)) {
          // Buscar hacia atrás para encontrar el nombre del puerto
          for (let j = i - 1; j >= 0; j--) {
            if (lines[j].startsWith("Hardware Port:")) {
              portName = lines[j].replace("Hardware Port:", "").trim();
              break;
            }
          }
          // Buscar hacia adelante para encontrar la MAC
          for (let j = i + 1; j < lines.length && j < i + 3; j++) {
            if (lines[j].startsWith("Ethernet Address:")) {
              mac = lines[j].replace("Ethernet Address:", "").trim();
              break;
            }
          }
          break;
        }
      }

      if (!portName) {
        throw new Error(`No se encontró el puerto de hardware para ${device}`);
      }

      // Determinar tipo
      let type: NetworkDeviceType = "unknown";
      const name = portName.toLowerCase();
      if (name.includes("wi-fi") || name.includes("wifi") || name.includes("wireless")) {
        type = "wifi";
      } else if (name.includes("ethernet") || name.includes("thunderbolt") || name.includes("usb")) {
        type = "ethernet";
      }

      // Obtener información de IP usando ifconfig
      const ifconfigCmd = `ifconfig ${device}`;
      let ipAddress = undefined;
      let state: NetworkDeviceState = "disconnected";
      let mtu: number | undefined = undefined;

      try {
        const ifconfigOut = await run(ifconfigCmd);
        
        // Verificar estado
        if (ifconfigOut.includes("status: active")) {
          state = "connected";
        } else if (ifconfigOut.includes("status: inactive")) {
          state = "disconnected";
        }

        // Extraer dirección IP
        const ipMatch = ifconfigOut.match(/inet\s+(\d+\.\d+\.\d+\.\d+)\s+netmask\s+0x([0-9a-f]+)/);
        if (ipMatch) {
          const ip = ipMatch[1];
          const netmaskHex = ipMatch[2];
          const netmaskInt = parseInt(netmaskHex, 16);
          const cidr = netmaskInt.toString(2).split('1').length - 1;
          ipAddress = `${ip}/${cidr}`;
        }

        // Extraer MTU
        const mtuMatch = ifconfigOut.match(/mtu\s+(\d+)/);
        if (mtuMatch) {
          mtu = parseInt(mtuMatch[1], 10);
        }
      } catch (e) {
        // Ignorar errores
      }

      // Obtener gateway
      let gateway = undefined;
      try {
        const routeCmd = `route -n get default`;
        const routeOut = await run(routeCmd);
        const gatewayMatch = routeOut.match(/gateway:\s+(\d+\.\d+\.\d+\.\d+)/);
        if (gatewayMatch) {
          gateway = gatewayMatch[1];
        }
      } catch (e) {
        // Ignorar errores
      }

      // Obtener DNS
      let dns: string[] = [];
      try {
        const dnsCmd = `networksetup -getdnsservers "${portName}"`;
        const dnsOut = await run(dnsCmd);
        if (dnsOut && !dnsOut.includes("aren't any")) {
          dns = dnsOut.split("\n").filter(line => line.trim().match(/^\d+\.\d+\.\d+\.\d+$/));
        }
      } catch (e) {
        // Ignorar errores
      }

      // Determinar si usa DHCP
      let dhcp = false;
      try {
        const dhcpCmd = `networksetup -getinfo "${portName}"`;
        const dhcpOut = await run(dhcpCmd);
        dhcp = dhcpOut.includes("DHCP Configuration");
      } catch (e) {
        dhcp = false;
      }

      const ipv4: NetworkIPv4Config = {
        method: dhcp ? "auto" : "manual",
        address: ipAddress,
        gateway,
        dns,
      };

      return {
        device,
        type,
        state,
        mac,
        mtu,
        connection: portName,
        ipv4,
      };
    } catch (error) {
      console.error(`Error getting device info for ${device} on macOS:`, error);
      throw error;
    }
  }

  /**
   * Obtiene información detallada de un device según la plataforma.
   */
  static async getDeviceInfo(device: string): Promise<NetworkDeviceInfo> {
    const platform = this.getPlatform();
    
    switch (platform) {
      case "linux":
        return this.getDeviceInfoLinux(device);
      case "windows":
        return this.getDeviceInfoWindows(device);
      case "darwin":
        return this.getDeviceInfoMac(device);
      default:
        throw new Error(`Plataforma no soportada: ${platform}`);
    }
  }

  /**
   * Configura IP estática sobre un device (eth0, wlan0, etc).
   * Usa el connectionName provisto o lo obtiene automáticamente.
   *
   * IMPORTANTE:
   *   - Solo funciona en Linux.
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
    this.ensureWriteSupported();
    
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
   * 
   * IMPORTANTE:
   *   - Solo funciona en Linux.
   */
  static async setDHCP(device: string, connectionName?: string | null): Promise<void> {
    this.ensureWriteSupported();
    
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
   * 
   * IMPORTANTE:
   *   - Solo funciona en Linux.
   */
  static async restartNetworking(): Promise<void> {
    this.ensureWriteSupported();
    
    try {
      await run("nmcli networking off");
      await run("nmcli networking on");
    } catch (err) {
      // fallback por si nmcli falla (ej: usar systemd)
      await run("sudo systemctl restart NetworkManager");
    }
  }
}
