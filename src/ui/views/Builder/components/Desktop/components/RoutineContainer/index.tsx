import React, { useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import Routine from './components/Routine';
import SortableList, { SortableItem } from 'react-easy-sort'
import arrayMove from 'array-move'
import useRoutines from '@hooks/useRoutines';
import Panel from '../Panel';
import { useParams } from 'react-router-dom';

const RoutineContainer = () => {
    const { routines, setRoutines } = useRoutines()
    const { routineId, groupId } = useParams()
    const containerRef = useRef<HTMLDivElement>(null);
    const [routinesToShow, setRoutinesToShow] = useState(routines);
    const [isShiftPressed, setIsShiftPressed] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift') {
                setIsShiftPressed(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift') {
                setIsShiftPressed(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        if (groupId) {
            setRoutinesToShow(routines.filter(routine => routine.groupId === groupId));
        } else {
            setRoutinesToShow(routines);
        }
    }, [groupId, routines]);

    useEffect(() => {
        if (routineId && containerRef.current) {
            // Espera a que el layout se estabilice antes de hacer scroll
            setTimeout(() => {
                const routineElement = containerRef.current!.querySelector(`#routine-${routineId}`);
                if (routineElement) {
                    (routineElement as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            }, 300); // Ajusta el tiempo si es necesario
        }
    }, [routineId]);

    const onSortEnd = (oldIndex: number, newIndex: number) => {
        const newRoutinesOrder = arrayMove(routines, routines
            .findIndex(r => r.id === routinesToShow[oldIndex].id && r.groupId === routinesToShow[oldIndex].groupId), 
            routines.findIndex(r => r.id === routinesToShow[newIndex].id && r.groupId === routinesToShow[newIndex].groupId));
        setRoutines(newRoutinesOrder);
    };

    return (
        <div 
            className={style.routineContainer}
            ref={containerRef}>
            {!isShiftPressed ? (
                <SortableList
                    dir='horizontal'
                    onSortEnd={onSortEnd}
                    className={style.routineArranger}
                    draggedItemClassName={style.dragging}>
                    {routinesToShow.map((routine) => (
                        <SortableItem 
                            key={routine.id}>
                            <div id={`routine-${routine.id}`}>
                                <Routine routineData={routine} isShiftPressed={isShiftPressed} />
                            </div>
                        </SortableItem>
                    ))}
                    <Routine routineData={null} isShiftPressed={isShiftPressed} />
                </SortableList>
            ) : (
                <div className={style.routineArranger}>
                    {routinesToShow.map((routine) => (
                        <div key={routine.id} id={`routine-${routine.id}`}>
                            <Routine routineData={routine} isShiftPressed={isShiftPressed} />
                        </div>
                    ))}
                    <Routine routineData={null} isShiftPressed={isShiftPressed} />
                </div>
            )}
            <Panel/>       
        </div>
    );
}

export default RoutineContainer;