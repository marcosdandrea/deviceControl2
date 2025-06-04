interface Window {
  electronAPI: {
    send: (channel: string, data?: any) => void;
    on: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
    once: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
  };
}