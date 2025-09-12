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
    const { routineId } = useParams()
    const containerRef = useRef<HTMLDivElement>(null);

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
        setRoutines(arrayMove(routines, oldIndex, newIndex));
    };

    return (
        <div 
            className={style.routineContainer}
            ref={containerRef}>
            <SortableList
                dir='horizontal'
                onSortEnd={onSortEnd}
                className={style.routineArranger}
                draggedItemClassName={style.dragging}>
                {routines.map((routine) => (
                    <SortableItem key={routine.id}>
                        <div id={`routine-${routine.id}`}>
                            <Routine routineData={routine} />
                        </div>
                    </SortableItem>
                ))}
                <Routine routineData={null} />
            </SortableList>
            <Panel/>       
        </div>
    );
}

export default RoutineContainer;