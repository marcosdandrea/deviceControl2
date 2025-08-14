import React, { useContext, useEffect } from 'react';
import { ProjectContext } from "@contexts/projectContextProvider";
import useProject from "@hooks/useProject";
import useProjectEvents from '@hooks/useProjectEvents';
import projectEvents from '@common/events/project.events';

const ProjectLoader = () => {
    const { project } = useProject();
    const { setProject } = useContext(ProjectContext);
    const lastEvent = useProjectEvents([
        projectEvents.closed,
        projectEvents.loaded
    ]);

    useEffect(() => {
        if (lastEvent?.event == projectEvents.closed){
            console.log("Project Closed");
            setProject(null);
            return;
        }

        console.log("ProjectLoader project:", project);
        setProject(project);
    }, [project, lastEvent])

    return ( <></> );
}
 
export default ProjectLoader;