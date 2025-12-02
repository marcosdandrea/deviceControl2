import { projectType } from '@common/types/project.types';
import React, { createContext, useEffect, useState } from 'react';

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

    const setProject = (project) => {
        setUnsavedChanges(true);
        _setProject(project);
    }

    return (
        <ProjectContext.Provider value={{ project, setProject, unsavedChanges, setUnsavedChanges }}>
            {children}
        </ProjectContext.Provider>
    );
}
 


export default ProjectContextProvider;