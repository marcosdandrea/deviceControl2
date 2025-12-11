import React, { useMemo } from 'react';
import style from './style.module.css';
import useRoutines from '@hooks/useRoutines';
import { globalRoutineStatusContext } from '../RoutineList';


const MinifiedTag = React.memo(({routineId, id}) => {
    const {globalRoutineStatus} = React.useContext<any>(globalRoutineStatusContext);
    const [color, setColor] = React.useState<string>("#888888");

    React.useEffect(() => {
        const routineStatus = globalRoutineStatus?.find((r:{routineId:string, status:string}) => r.routineId === routineId);
        setColor(routineStatus?.status)
    }, [globalRoutineStatus, routineId]);

    return (<div
        id={id}
        key={routineId}
        style={{ backgroundColor: color }}
        className={style.routineTagMinified} />
    );
});

const MinifiedStatusView = React.memo(({groupId}) => {
    const { routines } = useRoutines()
    
    const routineList = useMemo(() => {
        return routines
            .filter(r => r.groupId === groupId)
            .filter(r => !r.hidden);
    }, [routines, groupId]);

    return (
        <div className={style.minifiedStatusView}>
            {
                routineList.map(routine =>
                    <MinifiedTag key={routine.id} routineId={routine.id} id={routine.id} />
                )
            }
        </div>
    );
});

export default MinifiedStatusView;