import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import JSZip from "jszip";

import { getUserDataPath } from "@src/utils/paths";
import { broadcastToClients } from "../ipcServices";
import updateEvents from "@common/events/update.events";
import { UpdateStatus } from "@common/types/update.type";
import appUseCases from "@src/domain/useCases/app";
import { Log } from "@src/utils/log";

const log = Log.createInstance("UpdateService", true);

const GITHUB_OWNER = "marcosdandrea";
const GITHUB_REPO = "deviceControl2";
const GITHUB_API_HEADERS = {
    "User-Agent": "DeviceControl2-UpdateService",
    "Accept": "application/vnd.github+json",
};

const STATE_FILENAME = "update-state.json";
const BACKUP_DIRNAME = ".update-backup";
const STAGING_DIRNAME = ".update-staging";
const SWAPPED_ITEMS = ["main.js", "dist-react", "resources"];

export const isHeadless = process.argv.includes("--headless") || process.argv.includes("--h") || process.env.HEADLESS === "true";

type GithubAsset = { name: string; browser_download_url: string };
type GithubRelease = {
    tag_name: string;
    name: string;
    body: string | null;
    draft: boolean;
    prerelease: boolean;
    published_at: string;
    assets: GithubAsset[];
};

type PersistedState = {
    lastCheckedAt: string | null;
    latestVersion: string | null;
    releaseNotes: string | null;
    publishedAt: string | null;
    downloadUrl: string | null;
    lastNotifiedVersion: string | null;
    hasBackup: boolean;
    previousVersion: string | null;
    latestIsPrerelease: boolean;
    // Criterio usado en el último chequeo: si incluyó pre-releases. installUpdate() reutiliza
    // este valor para volver a seleccionar exactamente el mismo release (incluyendo pre-releases).
    checkedIncludesPrerelease: boolean;
};

const defaultState = (): PersistedState => ({
    lastCheckedAt: null,
    latestVersion: null,
    releaseNotes: null,
    publishedAt: null,
    downloadUrl: null,
    lastNotifiedVersion: null,
    hasBackup: false,
    previousVersion: null,
    latestIsPrerelease: false,
    checkedIncludesPrerelease: false,
});

let inMemoryState: PersistedState = defaultState();

const getStateFilePath = async (): Promise<string> => path.join(await getUserDataPath(), STATE_FILENAME);

const readState = async (): Promise<PersistedState> => {
    try {
        const filePath = await getStateFilePath();
        const content = await fs.readFile(filePath, "utf8");
        inMemoryState = { ...defaultState(), ...JSON.parse(content) };
    } catch {
        // No state persisted yet; keep defaults
    }
    return inMemoryState;
};

const writeState = async (partial: Partial<PersistedState>): Promise<void> => {
    inMemoryState = { ...inMemoryState, ...partial };
    const filePath = await getStateFilePath();
    await fs.writeFile(filePath, JSON.stringify(inMemoryState, null, 2), "utf8");
};

const parseVersion = (version: string): [number, number, number] => {
    const clean = version.trim().replace(/^v/i, "");
    const [major = 0, minor = 0, patch = 0] = clean.split(".").map((part) => parseInt(part, 10) || 0);
    return [major, minor, patch];
};

// Returns >0 if a>b, <0 if a<b, 0 if equal
const compareVersions = (a: string, b: string): number => {
    const [aMajor, aMinor, aPatch] = parseVersion(a);
    const [bMajor, bMinor, bPatch] = parseVersion(b);
    if (aMajor !== bMajor) return aMajor - bMajor;
    if (aMinor !== bMinor) return aMinor - bMinor;
    return aPatch - bPatch;
};

const getCurrentVersion = (): string => appUseCases.getAppVersion().version;

const fetchReleases = async (): Promise<GithubRelease[]> => {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`, {
        headers: GITHUB_API_HEADERS,
    });
    if (!response.ok) {
        throw new Error(`GitHub API respondió ${response.status} al listar releases`);
    }
    return await response.json();
};

// Only considers releases within the same major as currentVersion, newer than currentVersion,
// not draft (prerelease is excluded unless includePrerelease is set). A major bump on GitHub
// is intentionally invisible to this service.
const selectBestRelease = (releases: GithubRelease[], currentVersion: string, includePrerelease = false): GithubRelease | null => {
    const [currentMajor] = parseVersion(currentVersion);

    const candidates = releases.filter((release) => {
        if (release.draft) return false;
        if (release.prerelease && !includePrerelease) return false;
        const [releaseMajor] = parseVersion(release.tag_name);
        if (releaseMajor !== currentMajor) return false;
        return compareVersions(release.tag_name, currentVersion) > 0;
    });

    if (!candidates.length) return null;

    return candidates.reduce((best, candidate) =>
        compareVersions(candidate.tag_name, best.tag_name) > 0 ? candidate : best
    );
};

const findWebpackAssetUrl = (release: GithubRelease): string | null => {
    const asset = release.assets.find((a) => a.name === "webpack.zip");
    return asset?.browser_download_url ?? null;
};

export const checkForUpdates = async (includePrerelease = false): Promise<UpdateStatus> => {
    await readState();
    const currentVersion = getCurrentVersion();

    try {
        const releases = await fetchReleases();
        const best = selectBestRelease(releases, currentVersion, includePrerelease);
        const now = new Date().toISOString();

        if (!best) {
            await writeState({
                lastCheckedAt: now,
                latestVersion: null,
                releaseNotes: null,
                publishedAt: null,
                downloadUrl: null,
                latestIsPrerelease: false,
                checkedIncludesPrerelease: includePrerelease,
            });
            return getUpdateStatus();
        }

        const latestVersion = best.tag_name.replace(/^v/i, "");
        const downloadUrl = findWebpackAssetUrl(best);

        await writeState({
            lastCheckedAt: now,
            latestVersion,
            releaseNotes: best.body ?? null,
            publishedAt: best.published_at,
            downloadUrl,
            latestIsPrerelease: best.prerelease,
            checkedIncludesPrerelease: includePrerelease,
        });

        if (downloadUrl && inMemoryState.lastNotifiedVersion !== latestVersion) {
            await writeState({ lastNotifiedVersion: latestVersion });
            broadcastToClients(updateEvents.updateAvailable, await getUpdateStatus());
        }

        return getUpdateStatus();
    } catch (error) {
        log.error("Error checking for updates:", error);
        return getUpdateStatus();
    }
};

export const getUpdateStatus = async (): Promise<UpdateStatus> => {
    await readState();
    const currentVersion = getCurrentVersion();
    const updateAvailable = Boolean(
        inMemoryState.latestVersion && compareVersions(inMemoryState.latestVersion, currentVersion) > 0
    );

    return {
        currentVersion,
        latestVersion: inMemoryState.latestVersion,
        updateAvailable,
        releaseNotes: inMemoryState.releaseNotes,
        publishedAt: inMemoryState.publishedAt,
        lastCheckedAt: inMemoryState.lastCheckedAt,
        checking: false,
        installing: false,
        canInstall: isHeadless,
        hasBackup: inMemoryState.hasBackup,
        isPrerelease: inMemoryState.latestIsPrerelease,
    };
};

// Coincide con los chunks que webpack emite junto a main.js para los import() dinámicos
// (p. ej. "161.main.js", "938.main.js"). No swapearlos dejaba módulos cargados de forma
// diferida (como ScreenController) con código viejo tras cada actualización.
const MAIN_CHUNK_PATTERN = /^\d+\.main\.js$/;

const copyItems = async (fromDir: string, toDir: string): Promise<void> => {
    await fs.mkdir(toDir, { recursive: true });
    for (const item of SWAPPED_ITEMS) {
        const source = path.join(fromDir, item);
        const destination = path.join(toDir, item);
        try {
            await fs.rm(destination, { recursive: true, force: true });
            await fs.cp(source, destination, { recursive: true });
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
    }

    try {
        const rootEntries = await fs.readdir(fromDir, { withFileTypes: true });
        for (const entry of rootEntries) {
            if (!entry.isFile() || !MAIN_CHUNK_PATTERN.test(entry.name)) continue;
            const source = path.join(fromDir, entry.name);
            const destination = path.join(toDir, entry.name);
            await fs.rm(destination, { force: true });
            await fs.cp(source, destination);
        }
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
};

// Flattens a single top-level "webpack/" folder, matching how dist-webpack.mjs packages the zip
// and how rpiAppliance/scripts/30-download-dc2.sh already handles this on manual installs.
const flattenWebpackFolder = async (stagingDir: string): Promise<string> => {
    const nestedDir = path.join(stagingDir, "webpack");
    try {
        await fs.access(path.join(nestedDir, "main.js"));
        return nestedDir;
    } catch {
        return stagingDir;
    }
};

const extractZip = async (zipBuffer: Buffer, stagingDir: string): Promise<void> => {
    await fs.rm(stagingDir, { recursive: true, force: true });
    await fs.mkdir(stagingDir, { recursive: true });

    const zip = await JSZip.loadAsync(zipBuffer);
    const entries = Object.values(zip.files);

    for (const entry of entries) {
        if (entry.dir) continue;
        const targetPath = path.join(stagingDir, entry.name);
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        const content = await entry.async("nodebuffer");
        await fs.writeFile(targetPath, content);
    }
};

export const installUpdate = async (): Promise<UpdateStatus> => {
    if (!isHeadless) {
        throw new Error("La instalación automática solo está disponible en el servicio headless");
    }

    const installDir = await getUserDataPath();
    const currentVersion = getCurrentVersion();

    try {
        await readState();
        const releases = await fetchReleases();
        const best = selectBestRelease(releases, currentVersion, inMemoryState.checkedIncludesPrerelease);
        if (!best) {
            throw new Error("No hay ninguna actualización disponible dentro de la misma versión mayor");
        }

        const downloadUrl = findWebpackAssetUrl(best);
        if (!downloadUrl) {
            throw new Error("El release seleccionado no contiene el asset webpack.zip");
        }

        const latestVersion = best.tag_name.replace(/^v/i, "");

        broadcastToClients(updateEvents.updateInstallProgress, { stage: "downloading", latestVersion });
        const response = await fetch(downloadUrl, { headers: GITHUB_API_HEADERS });
        if (!response.ok) {
            throw new Error(`No se pudo descargar webpack.zip (HTTP ${response.status})`);
        }
        const zipBuffer = Buffer.from(await response.arrayBuffer());

        broadcastToClients(updateEvents.updateInstallProgress, { stage: "extracting", latestVersion });
        const stagingDir = path.join(installDir, STAGING_DIRNAME);
        await extractZip(zipBuffer, stagingDir);
        const sourceDir = await flattenWebpackFolder(stagingDir);

        broadcastToClients(updateEvents.updateInstallProgress, { stage: "backing-up", latestVersion });
        const backupDir = path.join(installDir, BACKUP_DIRNAME);
        await fs.rm(backupDir, { recursive: true, force: true });
        await copyItems(installDir, backupDir);

        broadcastToClients(updateEvents.updateInstallProgress, { stage: "installing", latestVersion });
        await copyItems(sourceDir, installDir);

        await fs.rm(stagingDir, { recursive: true, force: true });

        await writeState({
            hasBackup: true,
            previousVersion: currentVersion,
            latestVersion,
            lastNotifiedVersion: latestVersion,
        });

        const status = await getUpdateStatus();
        broadcastToClients(updateEvents.updateInstalled, status);
        log.info(`Update installed (v${currentVersion} -> v${latestVersion}), restarting...`);
        setTimeout(() => process.exit(0), 1500);
        return status;
    } catch (error) {
        log.error("Error installing update:", error);
        broadcastToClients(updateEvents.updateInstallFailed, { message: (error as Error).message });
        throw error;
    }
};

export const rollbackUpdate = async (): Promise<UpdateStatus> => {
    if (!isHeadless) {
        throw new Error("El rollback automático solo está disponible en el servicio headless");
    }

    await readState();
    if (!inMemoryState.hasBackup) {
        throw new Error("No hay ninguna versión anterior disponible para restaurar");
    }

    const installDir = await getUserDataPath();
    const backupDir = path.join(installDir, BACKUP_DIRNAME);

    try {
        await copyItems(backupDir, installDir);
        await writeState({ hasBackup: false, latestVersion: null, previousVersion: null });

        const status = await getUpdateStatus();
        broadcastToClients(updateEvents.updateRolledBack, status);
        log.info("Update rolled back, restarting...");
        setTimeout(() => process.exit(0), 1500);
        return status;
    } catch (error) {
        log.error("Error rolling back update:", error);
        broadcastToClients(updateEvents.updateInstallFailed, { message: (error as Error).message });
        throw error;
    }
};

const CHECK_INTERVAL_MS = process.env.UPDATE_CHECK_INTERVAL_HOURS
    ? Number(process.env.UPDATE_CHECK_INTERVAL_HOURS) * 60 * 60 * 1000
    : 3600000;

let autoCheckStarted = false;

export const startAutoCheck = (): void => {
    if (autoCheckStarted) return;
    autoCheckStarted = true;

    const runCheck = async () => {
        try {
            await checkForUpdates();
        } catch (error) {
            log.error("Error during scheduled update check:", error);
        } finally {
            setTimeout(runCheck, CHECK_INTERVAL_MS);
        }
    };

    runCheck();
};

export default {
    checkForUpdates,
    getUpdateStatus,
    installUpdate,
    rollbackUpdate,
    startAutoCheck,
};
