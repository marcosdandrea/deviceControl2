import React, { createContext, useEffect, useState } from 'react';

export const ProjectContext = createContext(null);

const ProjectContextProvider = ({children}) => {
    const [project, _setProject] = useState(null);
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