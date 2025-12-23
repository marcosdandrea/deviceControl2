import { EventEmitter } from "stream";

export type ipv4Address = string

export enum NetworkStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  UNKNOWN = 'unknown',
}

export type NetworkConfiguration = {
  interfaceName: string;
  status: NetworkStatus;
  dhcpEnabled: boolean;
  ipv4Address: ipv4Address;
  subnetMask: ipv4Address;
  gateway: ipv4Address;
  dnsServers: ipv4Address[];
}

export interface NetworkManagerInterface extends EventEmitter {
  networkConfig: NetworkConfiguration;
  setNetworkConfiguration(config: NetworkConfiguration): Promise<void>;
  getNetworkStatus(): NetworkConfiguration;
}