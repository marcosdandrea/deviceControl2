// src/global.d.ts o src/types/global.d.ts
export {}; // 👈 muy importante para que TypeScript trate esto como un "módulo aislado"

declare global {
  interface Window {
    electronAPI: {
      send: (channel: string, data?: any) => void;
      on: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
      once: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
    };
  }
}
