import React, { useContext, useEffect } from 'react';
import { SocketIOContext } from '@components/SocketIOProvider';
import { ProjectContext } from './projectContextProvider';
import projectEvents from '@common/events/project.events';

// Mantiene sincronizado el proyecto compartido entre todas las sesiones conectadas
// (p. ej. el kiosco en /control y una sesión remota en /builder). Sin esto, un cambio
// de configuración hecho desde una sesión nunca llega a las demás, que siguen operando
// con datos viejos en memoria hasta que recargan la página.
const ProjectSyncListener = () => {
    const { socket } = useContext(SocketIOContext);
    const projectContext = useContext(ProjectContext);

    useEffect(() => {
        if (!socket || !projectContext) return;

        const handleScreenSettingsChanged = (payload: { screenAutoOffTimeMs?: number; maxBrightness?: number }) => {
            projectContext.syncProject((prev) => prev ? { ...prev, ...payload } : prev);
        };

        socket.on(projectEvents.screenSettingsChanged, handleScreenSettingsChanged);
        return () => {
            socket.off(projectEvents.screenSettingsChanged, handleScreenSettingsChanged);
        };
    }, [socket, projectContext]);

    return null;
};

export default ProjectSyncListener;
