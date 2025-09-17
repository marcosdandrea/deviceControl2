import React from 'react';
import style from './style.module.css'
import { MdOutlineWarning } from 'react-icons/md';
import { Tooltip } from 'antd';

const WarningIcon = ({ message, blink }) => {
    return (
        <Tooltip 
            color='var(--warning)'
            className={style.warningIcon}
            title={message}>
                <MdOutlineWarning 
                    className={`${style.icon} ${blink ? style.blink : ''}`}
                    color={"var(--warning)"} 
                    size={18} />
        </Tooltip>
    );
}

export default WarningIcon;