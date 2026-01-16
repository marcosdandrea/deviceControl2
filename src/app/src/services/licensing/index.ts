import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { getUserDataPath } from "@src/utils/paths";
import { broadcastToClients } from "../ipcServices";
import systemEvents from "@common/events/system.events";
import { loadLastProject } from "@src/domain/useCases/project";
import eventManager from "../eventManager";

const LICENSE_SECRET = process.env.LICENSE_SECRET ?? "devicecontrol-license-secret";
const LICENSE_FILENAME = "license.json";

type LicensePayload = {
  fingerprint: string;
  issuedAt: string;
  expiresAt: string;
};

type StoredLicense = {
  licenseKey: string;
};

const base64UrlDecode = (value: string): string =>
  Buffer.from(value, "base64url").toString("utf8");

const parseLicenseKey = (licenseKey: string): LicensePayload | null => {
  const [data, signature] = licenseKey.split(".");

  if (!data || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", LICENSE_SECRET)
    .update(data)
    .digest("base64url");

  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const parsed: LicensePayload = JSON.parse(base64UrlDecode(data));
    return parsed;
  } catch {
    return null;
  }
};

const getLicenseFilePath = async (): Promise<string> => {
  const userDataPath = await getUserDataPath();
  return path.join(userDataPath, LICENSE_FILENAME);
};

const readFileIfExists = async (filePath: string): Promise<string | null> => {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
};

const getMachineIdentifier = async (): Promise<string> => {
  const platform = os.platform();

  if (platform === "win32") {
    try {
      const output = execSync("wmic csproduct get uuid", { stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (output.length > 1) {
        return output[1];
      }
    } catch {
      // Ignore errors and fallback to generic identifiers
    }
  }

  if (platform === "linux") {
    const candidates = ["/etc/machine-id", "/var/lib/dbus/machine-id"];

    for (const file of candidates) {
      try {
        const content = await fs.readFile(file, "utf8");
        const sanitized = content.trim();
        if (sanitized) {
          return sanitized;
        }
      } catch {
        // Try next candidate
      }
    }
  }

  if (platform === "darwin") {
    try {
      const output = execSync("ioreg -rd1 -c IOPlatformExpertDevice | awk '/IOPlatformUUID/ { print $3; }'", {
        stdio: ["ignore", "pipe", "ignore"],
        shell: "/bin/bash",
      })
        .toString()
        .trim()
        .replace(/\"/g, "");

      if (output) {
        return output;
      }
    } catch {
      // Ignore errors and fallback to generic identifiers
    }
  }

  const genericId = [os.hostname(), os.arch(), os.type()].join("-");
  return genericId;
};

// Returns stable MAC addresses for physical adapters, independent of link state.
const getStablePhysicalMacAddresses = async (): Promise<string[]> => {
  const platform = os.platform();

  const uniqSort = (items: string[]) => Array.from(new Set(items.map((s) => s.toUpperCase()))).sort();

  if (platform === "win32") {
    try {
      const output = execSync(
        // Filter to physical adapters with a non-empty MAC address
        'wmic nic where "PhysicalAdapter=true and MACAddress is not null" get MACAddress',
        { stdio: ["ignore", "pipe", "ignore"] }
      )
        .toString()
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      // First line is the header when using table format; skip if present
      const lines = output[0]?.toLowerCase() === "macaddress" ? output.slice(1) : output;
      return uniqSort(lines.filter((m) => /^[0-9A-Fa-f:]{12,17}$/.test(m)));
    } catch {
      // Try PowerShell if WMIC is unavailable
      try {
        const ps = execSync(
          'powershell -NoProfile -Command "Get-NetAdapter -Physical | Where-Object {$_.MacAddress} | Select-Object -ExpandProperty MacAddress"',
          { stdio: ["ignore", "pipe", "ignore"] }
        )
          .toString()
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (ps.length) return uniqSort(ps.filter((m) => /^[0-9A-Fa-f:]{12,17}$/.test(m)));
      } catch {
        // Fallback to Node's view if both WMIC and PowerShell fail
      }
    }
  }

  if (platform === "linux") {
    try {
      const base = "/sys/class/net";
      const ifaces = await fs.readdir(base);
      const macs: string[] = [];

      for (const iface of ifaces) {
        if (iface === "lo") continue; // skip loopback
        // Physical devices typically have a 'device' symlink present
        try {
          await fs.access(path.join(base, iface, "device"));
        } catch {
          continue; // likely virtual; skip
        }

        try {
          const addr = (await fs.readFile(path.join(base, iface, "address"), "utf8")).trim();
          if (addr && addr !== "00:00:00:00:00:00") macs.push(addr);
        } catch {
          // ignore and continue
        }
      }

      if (macs.length) return uniqSort(macs);
    } catch {
      // Fallback below
    }
  }

  if (platform === "darwin") {
    try {
      const output = execSync("networksetup -listallhardwareports", {
        stdio: ["ignore", "pipe", "ignore"],
        shell: "/bin/bash",
      })
        .toString()
        .split("\n");

      const macs: string[] = [];
      for (const line of output) {
        const m = line.match(/Ethernet Address:\s*([0-9A-Fa-f:]{12,17})/);
        if (m) macs.push(m[1]);
      }
      if (macs.length) return uniqSort(macs);
    } catch {
      // Fallback below
    }
  }

  // Generic fallback: use Node's networkInterfaces, which may be volatile if link state changes.
  try {
    const macs = Object.values(os.networkInterfaces())
      .flatMap((ifaces) => ifaces ?? [])
      .filter((iface) => !iface.internal)
      .map((iface) => iface.mac)
      .filter((m) => m && m !== "00:00:00:00:00:00");
    return uniqSort(macs);
  } catch {
    return [];
  }
};

const buildFingerprintSeed = async (): Promise<string> => {
  const machineId = await getMachineIdentifier();
  const cpus = os.cpus() ?? [];
  const primaryCpu = cpus[0]?.model ?? "unknown";
  // Collect MAC addresses from physical adapters using stable OS sources,
  // avoiding volatility from link state or IP assignment.
  const macAddresses = await getStablePhysicalMacAddresses();

  return [
    machineId,
    os.platform(),
    os.arch(),
    primaryCpu,
    os.totalmem().toString(),
    macAddresses.join(";"),
  ].join("|");
};

export const getSystemFingerprint = async (): Promise<string> => {
  const seed = await buildFingerprintSeed();
  const hash = createHash("sha256");
  hash.update(seed);
  return hash.digest("hex");
};

const validateLicense = async (licenseKey: string): Promise<LicensePayload | null> => {
  const payload = parseLicenseKey(licenseKey);
  if (!payload) {
    return null;
  }

  const fingerprint = await getSystemFingerprint();
  if (payload.fingerprint !== fingerprint) {
    return null;
  }

  if (Date.now() > new Date(payload.expiresAt).getTime()) {
    return null;
  }

  return payload;
};

export const setSystemLicense = async (licenseKey: string): Promise<boolean> => {
  const payload = await validateLicense(licenseKey);

  if (!payload) {
    return false;
  }

  const filePath = await getLicenseFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const storedLicense: StoredLicense = {
    licenseKey,
  };

  await fs.writeFile(filePath, JSON.stringify(storedLicense, null, 2), "utf8");
  broadcastToClients(systemEvents.appLicenseUpdated, {isValid: true});
  eventManager.emit(systemEvents.appLicenseUpdated, {isValid: true});
  
  // Intentar cargar el último proyecto si existe, pero no fallar si no hay ninguno
  try {
    await loadLastProject();
  } catch (error) {
    // Silenciosamente ignorar si no hay proyecto previo para cargar
    console.log("No previous project to load after license activation");
  }
  
  return true;
};

export const checkLicense = async (): Promise<boolean> => {
  const filePath = await getLicenseFilePath();
  const content = await readFileIfExists(filePath);

  if (!content) {
    return false;
  }

  try {
    const stored: StoredLicense = JSON.parse(content);
    const payload = await validateLicense(stored.licenseKey);
    return payload !== null;
  } catch {
    return false;
  }
};

export type LicenseInformation = {
  createdAt: string;
  expiresAt: string;
  data: any;
  isValid: boolean;
  fingerprint: string | null;
};

export const getLicenseInfo = async (): Promise<LicenseInformation | null> => {
  const filePath = await getLicenseFilePath();
  const fingerprint = await getSystemFingerprint();
  const content = await readFileIfExists(filePath);
  if (!content) {
    return null;
  }
  try {
    const stored: StoredLicense = JSON.parse(content);
    const payload = parseLicenseKey(stored.licenseKey);
    if (!payload) {
      return null;
    }
    const isValid = (await validateLicense(stored.licenseKey)) !== null;
    return {
      createdAt: payload.issuedAt,
      expiresAt: payload.expiresAt,
      data: payload,
      fingerprint,
      isValid,
    };
  } catch {
    return null;
  }
};

export const deleteLicenseFile = async (): Promise<void> => {
  const filePath = await getLicenseFilePath();
  await fs.unlink(filePath).catch(() => {
    // Ignore if file does not exist
  });
};

const LICENSE_CHECK_INTERVAL = process.env.AUTOCHECK_LICENSE_INTERVAL_HOURS ? Number(process.env.AUTOCHECK_LICENSE_INTERVAL_HOURS) * 60 * 60 * 1000 : 3600000

const autoCheckLicense = async () => {
  try {
    const isValid = await checkLicense();
    eventManager.emit(systemEvents.appLicenseUpdated, isValid);
    broadcastToClients(systemEvents.appLicenseUpdated, isValid);
  } catch (error) {
    console.error("Error checking license:", error);
  } finally {
    setTimeout(autoCheckLicense, LICENSE_CHECK_INTERVAL);
  }
};

autoCheckLicense();

export const decodeLicenseForDebug = (licenseKey: string): LicensePayload | null => parseLicenseKey(licenseKey);
