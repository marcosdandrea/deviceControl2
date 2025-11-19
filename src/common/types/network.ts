// Tipos compartidos para UI / backend

export type NetworkDeviceType = "ethernet" | "wifi" | "loopback" | "unknown";

export type NetworkDeviceState =
  | "connected"
  | "disconnected"
  | "unavailable"
  | "unknown";

export interface NetworkDeviceSummary {
  device: string;          // eth0, wlan0, etc
  type: NetworkDeviceType; // ethernet, wifi, loopback
  state: NetworkDeviceState;
  connection: string | null; // nombre de la conexión NM, o null
}

export interface NetworkIPv4Config {
  method: "auto" | "manual" | "disabled" | "unknown";
  address?: string;        // 192.168.10.50/24
  gateway?: string;        // 192.168.10.1
  dns: string[];           // [ "8.8.8.8", "192.168.10.1" ]
}

export interface NetworkDeviceInfo {
  device: string;
  type: NetworkDeviceType;
  state: NetworkDeviceState;
  mac?: string;
  mtu?: number;
  connection: string | null;
  ipv4: NetworkIPv4Config;
  // si en algún momento querés, se puede extender con ipv6, wifi, etc.
}
