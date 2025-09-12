import React, { useEffect, useState } from 'react';
import style from './style.module.css';
import { useParams } from 'react-router-dom';
import PanelHeader from './PanelHeader';
import useProject from '@hooks/useProject';
import PanelBody from './PanelBody';

const Panel = () => {
    const {project} = useProject({fetchProject: false})
    const panelSize = 30; // in rem
    const { routineId } = useParams()
    const [showPanel, setShowPanel] = useState(false);

    useEffect(() => {
        if (!routineId || !project)
            setShowPanel(false);
        else
            setShowPanel(true);
    }, [routineId, project]);

    return (
        <div
            style={{
                minWidth: `${panelSize}rem`,
                maxWidth: `${panelSize}rem`,
                width: `${panelSize}rem`,
                marginRight: showPanel ? '0rem' : `-${panelSize}rem`,
            }}
            className={style.panel}>
            <PanelHeader />
            <PanelBody />
        </div>
    );
}


export default Panel;