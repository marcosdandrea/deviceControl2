import React from 'react';
import style from './style.module.css';
import { MdOutlineMoveDown } from 'react-icons/md';
import Text from '@components/Text';

const GrabAndMoveMessage = () => {

    return (<div className={style.grabAndMoveMessage}>
        <MdOutlineMoveDown size={30} style={{ transform: 'rotate(-90deg)' }} />
        <Text className={style.message}>
            Mueva desde aquí esta rutina a un grupo diferente
        </Text>
    </div>);
}

export default GrabAndMoveMessage;