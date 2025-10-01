import React from 'react';
import style from './style.module.css';
import useRoutines from '@hooks/useRoutines';
import { globalRoutineStatusContext } from '../RoutineList';


const MinifiedTag = ({routineId, id}) => {
    const {globalRoutineStatus} = React.useContext<any>(globalRoutineStatusContext);
    const [color, setColor] = React.useState<string>("#888888");

    React.useEffect(() => {
        const routineStatus = globalRoutineStatus?.find((r:{routineId:string, status:string}) => r.routineId === routineId);
        setColor(routineStatus?.status)
    }, [globalRoutineStatus]);

    return (<div
        id={id}
        key={routineId}
        style={{ backgroundColor: color }}
        className={style.routineTagMinified} />
    );
}

const MinifiedStatusView = () => {
    const { routines } = useRoutines()
    const [routineList, setRoutineList] = React.useState<any[]>([]);

    React.useEffect(() => {
        setRoutineList(routines.filter(r => !r.hidden));
    }, [routines]);

    return (
        <div className={style.minifiedStatusView}>
            {
                routineList.map(routine =>
                    <MinifiedTag key={routine.id} routineId={routine.id} id={routine.id} />
                )
            }
        </div>
    );
}

export default MinifiedStatusView;