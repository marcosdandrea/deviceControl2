import React, { useContext } from 'react';
import Text from '@components/Text';
import style from './style.module.css';
import { routineContext } from '../..';
import RoutineQuickOptionsButton from './components/RoutineQuickOptionsButon';

const RoutineHeader = () => {

    const { routineData } = useContext(routineContext)

    return (
        <div className={style.routineHeader}>
            <Text
                size={14}
                color='white'>
                {routineData?.name || 'Routine name'}
            </Text>
            <RoutineQuickOptionsButton />
        </div>
    );
}

export default RoutineHeader;
