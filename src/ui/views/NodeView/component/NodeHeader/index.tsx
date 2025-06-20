import React from 'react';
import style from './style.module.css';

const NodeHeader = ({title, icon}) => {
    return ( 
    <div className={style.nodeHeader}>
        <div className={style.icon}>
            {React.cloneElement(icon, { size: '10px' })}
        </div>
        <div className={style.title}>{title}</div>
    </div> );
}
 
export default NodeHeader;