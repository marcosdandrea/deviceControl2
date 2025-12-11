import React, { useEffect, useState, useMemo } from 'react';
import style from './style.module.css';
import { useParams } from 'react-router-dom';
import PanelHeader from './PanelHeader';
import useProject from '@hooks/useProject';
import PanelBody from './PanelBody';

const Panel = React.memo(() => {
    const {project} = useProject({fetchProject: false})
    const panelSize = 30; // in rem
    const { routineId } = useParams()
    const [showPanel, setShowPanel] = useState(false);

    const panelStyle = useMemo(() => ({
        minWidth: `${panelSize}rem`,
        maxWidth: `${panelSize}rem`,
        width: `${panelSize}rem`,
        marginRight: showPanel ? '0rem' : `-${panelSize}rem`,
    }), [panelSize, showPanel]);

    useEffect(() => {
        if (!routineId || !project)
            setShowPanel(false);
        else
            setShowPanel(true);
    }, [routineId, project]);

    return (
        <div
            style={panelStyle}
            className={style.panel}>
            <PanelHeader />
            <PanelBody />
        </div>
    );
});

Panel.displayName = 'Panel';

export default Panel;