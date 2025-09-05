import React from 'react';
import style from './style.module.css';

const ToolbarButton = ({icon, onClick}) => {
    return ( 
    <div
        onClick={onClick}
        className={style.toolbarButton}>
        {icon}
    </div> 
    );
}
 
export default ToolbarButton;