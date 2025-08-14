import { Logger } from '@helpers/logger';
import React, { useEffect } from 'react';
import {dummyProjectData} from '../../helpers/dummy-project';
import useProject from '@hooks/useProject';

const Builder = () => {

    const {project, loadProject} = useProject();

    useEffect(() => {
        loadProject(dummyProjectData)
    }, []);

    return (
        <div>
            <h1>Builder UI</h1>
            <p>Esta es la página de Builder</p>
        </div>
    );
}
 
export default Builder;