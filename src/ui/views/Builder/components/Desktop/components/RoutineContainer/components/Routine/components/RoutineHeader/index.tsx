import React, { useContext } from 'react';
import Text from '@components/Text';
import style from './style.module.css';
import { routineContext } from '../..';
import RoutineQuickOptionsButton from './components/RoutineQuickOptionsButon';
import { SortableKnob } from 'react-easy-sort';
import RoutineVisibility from './components/RoutineVisibility';

const RoutineHeader = () => {

    const { routineData } = useContext(routineContext)

    return (
        <div className={style.routineHeader}>
            <SortableKnob>
                <div className={style.title}>
                    <RoutineVisibility />
                    <Text
                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                        size={14}
                        color='white'>
                        {routineData?.name || 'Routine name'}
                    </Text>
                </div>
            </SortableKnob>
            <RoutineQuickOptionsButton />
        </div>
    );
}

export default RoutineHeader;
