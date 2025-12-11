import React from 'react';
import style from './style.module.css';
import useProject from '@hooks/useProject';
import { useParams } from 'react-router-dom';
import RoutinePanel from './components/RoutinePanel';
import TaskPanel from './components/TaskPanel';
import TriggerPanel from './components/TriggerPanel';

const PanelBody = React.memo(() => {
    const { project } = useProject({fetchProject: false});
    const { routineId, taskId, triggerId } = useParams()

    return (
        <div className={style.panelBody}>
            {
                project && routineId && !taskId && !triggerId &&
                <RoutinePanel routineId={routineId} />
            }
            {
                project && routineId && taskId &&
                <TaskPanel />
            }
            {
                project && triggerId &&
                <TriggerPanel />
            }
        </div>
    );
});

PanelBody.displayName = 'PanelBody';

export default PanelBody;