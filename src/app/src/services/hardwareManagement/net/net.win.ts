import { NetworkConfiguration, NetworkStatus } from "@common/types/network";
import { NetworkManager } from "./index.js";
import { getScriptsDir } from "@src/utils/paths.js";
import path from "path";
import { ChildProcess, execFile } from "child_process";
import fs from "fs/promises";
import { broadcastToClients } from "@src/services/ipcServices/index.js";
import { NetworkEvents } from "@common/events/network.events.js";

type eventTypeFields = {
  field: string;
  from: unknown;
  to: unknown;
}

type eventType = {
  topic: string;
  reason: string;
  sourceClass: "Win32_NetworkAdapter" | "Win32_NetworkAdapterConfiguration";
  changeType: string;
  interfaceName: string;
  guid: string;
  mac: string;
  time: string;
  changes: eventTypeFields[];
}

type fetchResultType = {
  interfaceName: string;
  status: 'Up' | 'Down' | 'Connected' | 'Disconnected';
  dhcp: boolean,
  ipv4Address: string,
  subnetMask: string,
  gateway: string,
  dnsServers: any;
}

/**
 * Implementación de NetworkManager para Windows
 * Monitorea ÚNICAMENTE conexiones Ethernet (no WiFi)
 *
 * Estrategia:
 * - On-demand: PowerShell (Get-NetAdapter/Get-NetIPConfiguration/Get-DnsClientServerAddress) -> JSON
 * - On-event: watcher PowerShell con Register-WmiEvent (intrinsic events) -> dispara refresh on-demand
 *
 * Eventos emitidos a clientes:
 * - NETWORK_INTERFACES_UPDATED  (NetworkConfiguration[])
 * - NETWORK_DISCONNECTED        (NetworkConfiguration)
 * - NETWORK_CONNECTING          (NetworkConfiguration)
 * - NETWORK_CONNECTED           (NetworkConfiguration)
 */
export class NetworkManagerWin extends NetworkManager {

  constructor(networkConfig?: NetworkConfiguration) {
    super(networkConfig);
  }

  /**
   * Inicia el monitoreo de cambios en la red mediante un proceso PowerShell
   * Utiliza Register-WmiEvent para escuchar eventos intrínsecos de cambios en adaptadores de red
   * Cuando se detecta un cambio en una interfaz de tipo ethernet, dispara una actualización on-demand de la configuración de red
   */
  protected async watchForNetworkChanges(): Promise<void> {
    const psScriptPath = path.join(await getScriptsDir(), "ps.OnEventSuscribe.ps1");
    try {
      const fileExist = await fs.stat(psScriptPath).then(() => true).catch(() => false);
      if (!fileExist) {
        throw new Error(`PowerShell script not found: ${psScriptPath}`);
      }

      this.log.info("Starting network change monitor using script:", psScriptPath);
      this.networkMonitor = execFile("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psScriptPath], { maxBuffer: 10 * 1024 * 1024 });

      // Escuchar salida de línea en línea (no esperar a que termine el proceso)
      this.networkMonitor.stdout?.on("data", (data) => {
        const output = data.toString().trim();
        if (output) {
          if (output.startsWith("__WMI_WATCHER_STARTED__")) {
            this.log.info(`Started network change monitor with PID: ${this.networkMonitor.pid}`);
            return;
          }
          try {
            const event = JSON.parse(output) as eventType;
            //this.log.info("Network change detected:", event);

            if (event.sourceClass == "Win32_NetworkAdapter" && event.changeType === "link") {
              if (event.changes.find(c => c.field === "netEnabled").to === false)
                this.fetchNetworkStatus()
              else {
                if (event.changes.find(c => c.field === "netEnabled").to === true)
                  this.fetchNetworkStatus()
              }
            }
          } catch (error) {
            this.log.error("Failed to parse network change event:", error);
          }
        }
      });

      this.networkMonitor.stderr?.on("data", (data) => {
        const error = data.toString().trim();
        if (error) {
          this.log.error("Network watcher error:", error);
          console.error("[NET-WATCHER-ERROR]", error);
        }
      });

      this.networkMonitor.on("error", (error) => {
        this.log.error("Network monitor process error:", error);
      });
    } catch (error) {
      this.log.error("Failed to start network change monitor:", (error as Error).message);
      if (this.networkMonitor) {
        this.networkMonitor.kill();
      }
    }
  }


  protected async fetchNetworkStatus(): Promise<void> {
    let fetchTask: ChildProcess = null;
    const psScriptPath = path.join(await getScriptsDir(), "ps.GetAllEthernetConfigs.ps1");
    try {
      const fileExist = await fs.stat(psScriptPath).then(() => true).catch(() => false);
      if (!fileExist) {
        throw new Error(`PowerShell script not found: ${psScriptPath}`);
      }
      fetchTask = execFile("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psScriptPath], { maxBuffer: 10 * 1024 * 1024 });

      fetchTask.stdout?.on("data", (data) => {
        const output = data.toString().trim();
        if (!output) return;
        try {
          const data = JSON.parse(output) as fetchResultType;
          this.updateNetworkConfig({
            interfaceName: data.interfaceName,
            status: data.status === "Up" || data.status === "Connected" ? NetworkStatus.CONNECTED : NetworkStatus.DISCONNECTED,
            dhcpEnabled: data.dhcp,
            ipv4Address: data.ipv4Address,
            subnetMask: data.subnetMask,
            gateway: data.gateway,
            dnsServers: data.dnsServers
          })
        } catch (error) {
          this.log.error("Failed to parse fetch network status output:", error);
          console.log (output)
        }
        fetchTask.kill();
      });

      fetchTask.stderr?.on("data", (data) => {
        const errorOutput = data.toString().trim();
        if (errorOutput) {
          this.log.error("Fetch network status error output:", errorOutput);
        }
      });


      this.log.info("Fetching network status with PID:", fetchTask.pid);
    } catch (error) {
      if (fetchTask) {
        fetchTask.kill();
      }
      this.log.error("Failed to fetch network status:", (error as Error).message);
      throw error;
    }
  }

  async setNetworkConfiguration(config: NetworkConfiguration): Promise<void> {
    // Implementar configuración de red en Windows mediante PowerShell (Set-NetIPConfiguration, Set-DnsClientServerAddress, etc.)
    this.log.info("Setting network configuration (not yet implemented):", config);
    throw new Error("setNetworkConfiguration not yet implemented for Windows");
  }

}
