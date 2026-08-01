export interface UpdateStatus {
    currentVersion: string;
    latestVersion: string | null;
    updateAvailable: boolean;
    releaseNotes: string | null;
    publishedAt: string | null;
    lastCheckedAt: string | null;
    checking: boolean;
    installing: boolean;
    canInstall: boolean;
    hasBackup: boolean;
    isPrerelease: boolean;
}
