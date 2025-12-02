import style from './style.module.css';
import React, { createContext, forwardRef } from 'react';
import RoutineHeader from './components/RoutineHeader';
import TaskContainer from './components/TaskContainer';
import TriggersContainer from './components/TriggerContainer';
import NewRoutineGhost from './components/NewRoutineGhost';
import { useParams } from 'react-router-dom';
import GrabAndMoveMessage from './components/GrabAndMoveMessage';

export const routineContext = createContext(null)

interface RoutineProps {
    routineData: any;
    isShiftPressed: boolean;
}

const Routine = forwardRef<HTMLDivElement, RoutineProps>(({ routineData, isShiftPressed }, ref) => {

    const { routineId } = useParams();

    const handleOnDragStart = (e: React.DragEvent) => {
        console.log('🎯 Drag started, Shift:', e.shiftKey, 'routine:', routineData.id);

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
                draggable={isShiftPressed}
                onDragStart={handleOnDragStart}
                style={{ cursor: isShiftPressed ? "grab" : "default" }}
                className={`${style.routine} ${routineId === routineData.id ? style.selected : ''}`} >
                <RoutineHeader />
                {
                    isShiftPressed
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