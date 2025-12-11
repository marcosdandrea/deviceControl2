import { projectType } from '@common/types/project.types';
import React, { createContext, useEffect, useState, useMemo, useCallback } from 'react';

export const ProjectContext = createContext<ProjectContextType | null>(null);

export type ProjectContextType = {
    project: projectType | null;
    setProject: React.Dispatch<React.SetStateAction<projectType | null>>;
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

    const contextValue = useMemo(() => ({
        project,
        setProject,
        unsavedChanges,
        setUnsavedChanges
    }), [project, setProject, unsavedChanges]);

    return (
        <ProjectContext.Provider value={contextValue}>
            {children}
        </ProjectContext.Provider>
    );
}
 


export default ProjectContextProvider;