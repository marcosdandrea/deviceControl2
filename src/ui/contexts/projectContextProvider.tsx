import projectCommands from '@common/commands/project.commands';
import { projectType } from '@common/types/project.types';
import { SocketIOContext } from '@components/SocketIOProvider';
import React, { createContext, useEffect, useState, useMemo, useCallback, useContext } from 'react';

export const ProjectContext = createContext<ProjectContextType | null>(null);

export type ProjectContextType = {
    project: projectType | null;
    setProject: React.Dispatch<React.SetStateAction<projectType | null>>;
    syncProject: React.Dispatch<React.SetStateAction<projectType | null>>;
    unsavedChanges: boolean;
    setUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
};

const ProjectContextProvider = ({children}) => {
    const [project, _setProject] = useState<projectType | null>(null);
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    const setProject = useCallback((project) => {
        setUnsavedChanges(true);
        _setProject(project);
    }, []);

    // Igual que setProject, pero sin marcar cambios sin guardar: para aplicar cambios que
    // ya llegan confirmados/persistidos desde el backend (p. ej. sincronizados desde otra
    // sesión conectada), no una edición local pendiente de guardar.
    const syncProject = useCallback((project) => {
        _setProject(project);
    }, []);

    const contextValue = useMemo(() => ({
        project,
        setProject,
        syncProject,
        unsavedChanges,
        setUnsavedChanges
    }), [project, setProject, syncProject, unsavedChanges]);

    return (
        <ProjectContext.Provider value={contextValue}>
            {children}
        </ProjectContext.Provider>
    );
}
 


export default ProjectContextProvider;