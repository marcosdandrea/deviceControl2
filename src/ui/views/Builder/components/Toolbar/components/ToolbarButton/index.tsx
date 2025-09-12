import React from 'react';
import style from './style.module.css';

const ToolbarButton = ({icon, onClick, disabled}:{icon: React.ReactNode, onClick: () => void, disabled?: boolean}) => {
    return ( 
    <div
        onClick={onClick}
        style={{opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto'}}
        className={style.toolbarButton}>
        {icon}
    </div> 
    );
}
 
export default ToolbarButton;