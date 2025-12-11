import React from 'react';
import style from './style.module.css'
import { MdOutlineInfo } from 'react-icons/md';
import { Tooltip } from 'antd';

const InfoIcon = React.memo(({ message, blink }:{message: string, blink?: boolean}) => {
    return (
        <Tooltip 
            color='var(--info)'
            className={style.warningIcon}
            title={message}>
                <MdOutlineInfo 
                    className={blink ? style.blink : style.icon}
                    color={"var(--info)"} 
                    size={18} />
        </Tooltip>
    );
});

InfoIcon.displayName = 'InfoIcon';

export default InfoIcon;