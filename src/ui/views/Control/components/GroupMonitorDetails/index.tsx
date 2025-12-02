import React, { useContext, useEffect, useState } from 'react';
import Style from './style.module.css';
import { globalRoutineStatusContext } from '../RoutineList';
import useProject from '@hooks/useProject';
import { Color } from '@common/theme/colors';
import routineEvents from '@common/events/routine.events';

const GroupMonitorDetails = ({groupId}: {groupId: string}) => {
    const { project } = useProject({ fetchProject: false });
    const { globalRoutineStatus } = useContext(globalRoutineStatusContext);
    const [statusColor, setStatusColor] = useState<string>(Color.unknown);

    useEffect(() => {
        if (!project || !globalRoutineStatus) return;

        // Obtener las rutinas del grupo
        const routinesInGroup = project.routines
            .filter(r => r.groupId === groupId)
            .filter(r => !r.hidden);

        if (routinesInGroup.length === 0) {
            setStatusColor(Color.unknown);
            return;
        }

        // Obtener los estados de las rutinas del grupo
        const groupRoutineStatuses = routinesInGroup
            .map(routine => {
                const status = globalRoutineStatus.find(s => s.routineId === routine.id);
                return status?.status || Color.unknown;
            });

        // Prioridad: rojo (error) > naranja (trabajando) > verde (completado) > gris (unknown)
        const hasError = groupRoutineStatuses.some(status => 
            status === Color.failed || status === routineEvents.routineFailed || status === routineEvents.routineTimeout
        );
        
        const isWorking = groupRoutineStatuses.some(status => 
            status === Color.working || status === Color.running || status === routineEvents.routineRunning || status === routineEvents.routineAutoCheckingConditions
        );

        const allUnknown = groupRoutineStatuses.every(status => 
            status === Color.unknown || status === 'unknown'
        );

        if (hasError) {
            setStatusColor(Color.failed);
        } else if (isWorking) {
            setStatusColor(Color.working);
        } else if (allUnknown) {
            setStatusColor(Color.unknown);
        } else {
            setStatusColor(Color.completed);
        }

    }, [project, globalRoutineStatus, groupId]);

    return ( 
        <div className={Style.groupMonitorDetails}>
            <div 
                className={Style.groupStatus}
                style={{ backgroundColor: statusColor }}
            />
        </div>
     );
}
 
export default GroupMonitorDetails;