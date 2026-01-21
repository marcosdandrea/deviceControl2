import localizationCommands from "@common/commands/localization.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState, useCallback } from "react";
import { Logger } from "@helpers/logger";
import { TimezoneInfo } from "@common/types/localization.type";

export interface UseLocalizationReturn {
    currentTimezone: TimezoneInfo | null;
    availableTimezones: string[];
    loading: boolean;
    error: string | null;
    refreshTimezone: () => void;
    setTimezone: (timezone: string) => Promise<boolean>;
    loadAvailableTimezones: () => void;
}

const useLocalization = (): UseLocalizationReturn => {
    const { emit, isConnected } = useContext(SocketIOContext);
    const [currentTimezone, setCurrentTimezone] = useState<TimezoneInfo | null>(null);
    const [availableTimezones, setAvailableTimezones] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const refreshTimezone = useCallback(() => {
        if (!isConnected || loading) return;
        
        setLoading(true);
        setError(null);
        
        emit(localizationCommands.getCurrentTimezone, null, (response: { success: boolean; data?: TimezoneInfo; error?: string }) => {
            setLoading(false);
            if (response?.success && response.data) {
                setCurrentTimezone(response.data);
                setError(null);
            } else {
                const errorMsg = response?.error || 'Error al obtener la zona horaria';
                setError(errorMsg);
                Logger.error('Error getting current timezone:', errorMsg);
            }
        });
    }, [emit, isConnected, loading]);

    const loadAvailableTimezones = useCallback(() => {
        if (!isConnected) return;
        
        emit(localizationCommands.listAvailableTimezones, null, (response: { success: boolean; data?: string[]; error?: string }) => {
            if (response?.success && response.data) {
                setAvailableTimezones(response.data);
            } else {
                const errorMsg = response?.error || 'Error al cargar las zonas horarias disponibles';
                setError(errorMsg);
                Logger.error('Error loading available timezones:', errorMsg);
            }
        });
    }, [emit, isConnected]);

    const setTimezone = useCallback((timezone: string): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!isConnected) {
                resolve(false);
                return;
            }

            setLoading(true);
            setError(null);

            emit(localizationCommands.setTimezone, { timezone }, (response: { success: boolean; error?: string }) => {
                setLoading(false);
                if (response?.success) {
                    setError(null);
                    // Actualizar la zona horaria actual después del cambio
                    setTimeout(() => {
                        refreshTimezone();
                    }, 1000);
                    resolve(true);
                } else {
                    const errorMsg = response?.error || 'Error al establecer la zona horaria';
                    setError(errorMsg);
                    Logger.error('Error setting timezone:', errorMsg);
                    resolve(false);
                }
            });
        });
    }, [emit, isConnected]);

    // Cargar datos iniciales cuando se conecte
    useEffect(() => {
        if (isConnected && !currentTimezone && availableTimezones.length === 0) {
            refreshTimezone();
            loadAvailableTimezones();
        }
    }, [isConnected]);

    return {
        currentTimezone,
        availableTimezones,
        loading,
        error,
        refreshTimezone,
        setTimezone,
        loadAvailableTimezones
    };
};

export default useLocalization;