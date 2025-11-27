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

  const genericId = [os.hostname(), os.arch(), os.type(), os.release()].join("-");
  return genericId;
};

const buildFingerprintSeed = async (): Promise<string> => {
  const machineId = await getMachineIdentifier();
  const cpus = os.cpus() ?? [];
  const primaryCpu = cpus[0]?.model ?? "unknown";
  const macAddresses = Object.values(os.networkInterfaces())
    .flatMap((ifaces) => ifaces ?? [])
    .filter((iface) => !iface.internal)
    .map((iface) => iface.mac)
    .sort()
    .join(";");

  return [
    machineId,
    os.platform(),
    os.release(),
    os.arch(),
    primaryCpu,
    os.totalmem().toString(),
    macAddresses,
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
