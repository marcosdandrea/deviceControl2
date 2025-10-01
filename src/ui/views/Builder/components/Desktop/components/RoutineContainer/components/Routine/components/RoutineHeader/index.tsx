import React, { useContext } from 'react';
import Text from '@components/Text';
import style from './style.module.css';
import { routineContext } from '../..';
import RoutineQuickOptionsButton from './components/RoutineQuickOptionsButon';
import { SortableKnob } from 'react-easy-sort';
import RoutineVisibilityIcon from './components/RoutineVisibilityIcon';
import RoutineEnabledIcon from './components/RoutineEnabledIcon';

const RoutineHeader = () => {

    const { routineData } = useContext(routineContext)

    return (
        <div 
            title={routineData?.name || 'Routine name'}
            className={style.routineHeader}>
            <SortableKnob>
                <div className={style.title}>
                    <div className={style.iconsContainer}>
                    <RoutineVisibilityIcon />
                    <RoutineEnabledIcon />
                    </div>
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
