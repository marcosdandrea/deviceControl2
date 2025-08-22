import React, { useEffect } from 'react';
import {dummyProjectData} from '../../helpers/dummy-project';
import useProject from '@hooks/useProject';
import Button from '@components/Button';

const Builder = () => {

    const {project, loadProject, unloadProject} = useProject();

    const handleOnLoad = () => {
        loadProject(dummyProjectData);
    }

    return (
        <div style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            display: "flex",
            columnGap: "1rem",
            justifyContent: "center",
            alignItems: "center"
        }}>
            <Button
                text='Load Project'
                onClick={handleOnLoad}/>

            <Button
                text='Unload Project'
                onClick={unloadProject}/>
        </div>
    );
}
 
export default Builder;