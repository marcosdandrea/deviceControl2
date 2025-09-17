import React, { createContext, useEffect, useState } from 'react';

export const ProjectContext = createContext(null);

const ProjectContextProvider = ({children}) => {
    const [project, setProject] = useState(null);
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    return (
        <ProjectContext.Provider value={{ project, setProject, unsavedChanges, setUnsavedChanges }}>
            {children}
        </ProjectContext.Provider>
    );
}
 


export default ProjectContextProvider;