import systemCommands from "@common/commands/system.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState, useCallback } from "react";
import { Logger } from "@helpers/logger";

export interface UseLogRetentionReturn {
    retentionDays: number | null;
    loading: boolean;
    saving: boolean;
    cleaning: boolean;
    lastCleanupResult: { deletedCount: number } | null;
    error: string | null;
    refresh: () => void;
    setRetentionDays: (days: number) => Promise<boolean>;
    runCleanupNow: () => Promise<boolean>;
}

const useLogRetention = (): UseLogRetentionReturn => {
    const { emit, isConnected } = useContext(SocketIOContext);
    const [retentionDays, setRetentionDaysState] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [cleaning, setCleaning] = useState<boolean>(false);
    const [lastCleanupResult, setLastCleanupResult] = useState<{ deletedCount: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(() => {
        if (!isConnected) return;

        setLoading(true);
        setError(null);

        emit(systemCommands.getLogRetentionDays, null, (response: { success: boolean; days?: number; error?: string }) => {
            setLoading(false);
            if (response?.success && typeof response.days === "number") {
                setRetentionDaysState(response.days);
            } else {
                const errorMsg = response?.error || "Error al obtener la retención de logs";
                setError(errorMsg);
                Logger.error("Error getting log retention days:", errorMsg);
            }
        });
    }, [emit, isConnected]);

    const setRetentionDays = useCallback((days: number): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!isConnected) {
                resolve(false);
                return;
            }

            setSaving(true);
            setError(null);

            emit(systemCommands.setLogRetentionDays, { days }, (response: { success: boolean; error?: string }) => {
                setSaving(false);
                if (response?.success) {
                    setRetentionDaysState(days);
                    resolve(true);
                } else {
                    const errorMsg = response?.error || "Error al guardar la retención de logs";
                    setError(errorMsg);
                    Logger.error("Error setting log retention days:", errorMsg);
                    resolve(false);
                }
            });
        });
    }, [emit, isConnected]);

    const runCleanupNow = useCallback((): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!isConnected) {
                resolve(false);
                return;
            }

            setCleaning(true);
            setError(null);

            emit(systemCommands.runLogsCleanupNow, null, (response: { success: boolean; deletedCount?: number; error?: string }) => {
                setCleaning(false);
                if (response?.success) {
                    setLastCleanupResult({ deletedCount: response.deletedCount ?? 0 });
                    resolve(true);
                } else {
                    const errorMsg = response?.error || "Error al limpiar los logs";
                    setError(errorMsg);
                    Logger.error("Error running log cleanup:", errorMsg);
                    resolve(false);
                }
            });
        });
    }, [emit, isConnected]);

    useEffect(() => {
        if (isConnected && retentionDays === null) {
            refresh();
        }
    }, [isConnected]);

    return {
        retentionDays,
        loading,
        saving,
        cleaning,
        lastCleanupResult,
        error,
        refresh,
        setRetentionDays,
        runCleanupNow,
    };
};

export default useLogRetention;
