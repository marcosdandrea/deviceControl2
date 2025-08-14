import React, { createContext, useState } from 'react';

export const ProjectContext = createContext(null);

const ProjectContextProvider = ({children}) => {
    const [project, setProject] = useState(null);

    return (
        <ProjectContext.Provider value={{ project, setProject }}>
            {children}
        </ProjectContext.Provider>
    );
}
 


export default ProjectContextProvider;