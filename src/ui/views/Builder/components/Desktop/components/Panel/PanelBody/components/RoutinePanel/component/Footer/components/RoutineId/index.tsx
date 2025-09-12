import React, { useContext } from 'react';
import style from './style.module.css';
import Text from '@components/Text';
import { routineConfigurationContext } from '../../../..';
import { MdCopyAll } from 'react-icons/md';
import { message } from 'antd';

const RoutineId = () => {
    const { routine } = useContext(routineConfigurationContext)

    const handleOnCopyId = () => {
        if (routine?.id) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(routine.id);
                message.success('ID copiado al portapapeles');
            } else {
                message.error('El portapapeles no es accesible en este navegador');
            }
        }
    }

    return (
        <div
            className={style.routineId}>
            <Text
                style={{ width: 'auto', textAlign: 'center', padding: '8px 0', display: 'block'}}
                size={12}
                color='gray'>
                {"ID:"}
            </Text>
            <Text
                style={{ width: 'auto', textAlign: 'center', padding: '8px 0', display: 'block', userSelect: routine?.id ? "text" : "none" }}
                size={12}
                color='gray'>
                {routine?.id ? routine.id : 'Nueva Rutina'}
            </Text>
{/*             <MdCopyAll
                color="gray"
                className={style.copyIcon}
                onClick={handleOnCopyId}
            /> */}
        </div>
    );
}

export default RoutineId;
