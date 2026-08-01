import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SocketIOContext } from "@components/SocketIOProvider";
import updateCommands from "@common/commands/update.commands";
import updateEvents from "@common/events/update.events";
import { UpdateStatus } from "@common/types/update.type";

type UpdateContextType = {
    status: UpdateStatus | null;
    checking: boolean;
    installing: boolean;
    error: string | null;
    checkNow: (includePrerelease?: boolean) => void;
    install: () => Promise<boolean>;
    rollback: () => Promise<boolean>;
};

export const UpdateContext = createContext<UpdateContextType>({
    status: null,
    checking: false,
    installing: false,
    error: null,
    checkNow: () => {},
    install: async () => false,
    rollback: async () => false,
});

export const UpdateContextProvider = ({ children }: { children: React.ReactNode }) => {
    const { socket, emit, isConnected } = useContext(SocketIOContext);
    const [status, setStatus] = useState<UpdateStatus | null>(null);
    const [checking, setChecking] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(() => {
        if (!emit) return;
        emit(updateCommands.getUpdateStatus, null, (response: { success: boolean; data?: UpdateStatus }) => {
            if (response?.success && response.data) setStatus(response.data);
        });
    }, [emit]);

    const checkNow = useCallback((includePrerelease = false) => {
        if (!emit) return;
        setChecking(true);
        setError(null);
        emit(updateCommands.checkForUpdates, { includePrerelease }, (response: { success: boolean; data?: UpdateStatus; error?: string }) => {
            setChecking(false);
            if (response?.success && response.data) setStatus(response.data);
            else setError(response?.error || "Error al buscar actualizaciones");
        });
    }, [emit]);

    const install = useCallback((): Promise<boolean> => new Promise((resolve) => {
        if (!emit) {
            resolve(false);
            return;
        }
        setInstalling(true);
        setError(null);
        emit(updateCommands.installUpdate, null, (response: { success: boolean; data?: UpdateStatus; error?: string }) => {
            if (response?.success && response.data) {
                setStatus(response.data);
            } else {
                setInstalling(false);
                setError(response?.error || "Error al instalar la actualización");
            }
            resolve(Boolean(response?.success));
        });
    }), [emit]);

    const rollback = useCallback((): Promise<boolean> => new Promise((resolve) => {
        if (!emit) {
            resolve(false);
            return;
        }
        setInstalling(true);
        setError(null);
        emit(updateCommands.rollbackUpdate, null, (response: { success: boolean; data?: UpdateStatus; error?: string }) => {
            if (response?.success && response.data) {
                setStatus(response.data);
            } else {
                setInstalling(false);
                setError(response?.error || "Error al restaurar la versión anterior");
            }
            resolve(Boolean(response?.success));
        });
    }), [emit]);

    useEffect(() => {
        if (isConnected) fetchStatus();
    }, [isConnected, fetchStatus]);

    useEffect(() => {
        if (!socket) return;

        const handleStatusUpdate = (data: UpdateStatus) => setStatus(data);
        const handleInstallFailed = (data: { message?: string }) => {
            setInstalling(false);
            setError(data?.message || "Error al instalar la actualización");
        };

        socket.on(updateEvents.updateAvailable, handleStatusUpdate);
        socket.on(updateEvents.updateInstalled, handleStatusUpdate);
        socket.on(updateEvents.updateRolledBack, handleStatusUpdate);
        socket.on(updateEvents.updateInstallFailed, handleInstallFailed);

        return () => {
            socket.off(updateEvents.updateAvailable, handleStatusUpdate);
            socket.off(updateEvents.updateInstalled, handleStatusUpdate);
            socket.off(updateEvents.updateRolledBack, handleStatusUpdate);
            socket.off(updateEvents.updateInstallFailed, handleInstallFailed);
        };
    }, [socket]);

    return (
        <UpdateContext.Provider value={{ status, checking, installing, error, checkNow, install, rollback }}>
            {children}
        </UpdateContext.Provider>
    );
};

export default UpdateContextProvider;
