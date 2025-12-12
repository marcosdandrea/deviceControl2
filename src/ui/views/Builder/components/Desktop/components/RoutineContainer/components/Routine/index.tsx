import style from './style.module.css';
import React, { createContext, forwardRef, useState } from 'react';
import RoutineHeader from './components/RoutineHeader';
import TaskContainer from './components/TaskContainer';
import TriggersContainer from './components/TriggerContainer';
import NewRoutineGhost from './components/NewRoutineGhost';
import { useParams } from 'react-router-dom';
import GrabAndMoveMessage from './components/GrabAndMoveMessage';
import { Logger } from '@helpers/logger';

export const routineContext = createContext(null)

interface RoutineProps {
    routineData: any;
    isShiftPressed: boolean;
}

const Routine = forwardRef<HTMLDivElement, RoutineProps>(({ routineData, isShiftPressed }, ref) => {

    const { routineId } = useParams();
    const [isHovering, setIsHovering] = useState(false);

    const handleOnDragStart = (e: React.DragEvent) => {
        Logger.log('🎯 Drag started, Shift:', e.shiftKey, 'routine:', routineData.id);

        if (e.shiftKey) {
            e.stopPropagation();
            e.dataTransfer.setData('routineId', routineData.id);
            e.dataTransfer.setData('currentGroupId', routineData.groupId || '');
            e.dataTransfer.setData('shiftKey', 'true');
            e.dataTransfer.effectAllowed = 'move';
        }
    }

    if (!routineData)
        return <NewRoutineGhost ref={ref} />

    return (
        <routineContext.Provider value={{ routineData, isShiftPressed }}>
            <div
                ref={ref}
                onMouseEnter={()=>setIsHovering(true)}
                onMouseLeave={()=>setIsHovering(false)}
                draggable={isShiftPressed}
                onDragStart={handleOnDragStart}
                style={{ cursor: isShiftPressed ? "grab" : "default" }}
                className={`${style.routine} ${routineId === routineData.id ? style.selected : ''}`} >
                <RoutineHeader />
                {
                    isShiftPressed && isHovering
                        ? <GrabAndMoveMessage />
                        : <>
                            <div className={style.body} >
                                <TriggersContainer />
                                <TaskContainer />
                            </div>
                        </>
                }

            </div>
        </routineContext.Provider>
    );
});

export default Routine;