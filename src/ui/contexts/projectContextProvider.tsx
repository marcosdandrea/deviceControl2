import useProject from '@hooks/useProject';
import React, { createContext, useEffect, useState } from 'react';

export const ProjectContext = createContext(null);

const ProjectContextProvider = ({children}) => {
    const {project: currentProject} = useProject();
    const [project, setProject] = useState(null);

    useEffect(() => {
        setProject(currentProject);
    }, [currentProject]);

    return (
        <ProjectContext.Provider value={{ project, setProject }}>
            {children}
        </ProjectContext.Provider>
    );
}
 


export default ProjectContextProvider;