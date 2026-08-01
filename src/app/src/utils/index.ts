export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

export const isLinux = process.platform === 'linux';

export class LinuxOnlyFeatureError extends Error {
  constructor(feature: string) {
    super(`La función "${feature}" solo está disponible en Linux.`);
    this.name = "LinuxOnlyFeatureError";
  }
}

export function assertLinuxFeature(feature: string): void {
  if (!isLinux) {
    throw new LinuxOnlyFeatureError(feature);
  }
}

