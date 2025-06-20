import React from 'react';
import style from './style.module.css';

const GroupHandle = ({children, position, id}) => {
    return ( 
    <div 
        id={id}
        style={{}}
        className={style.groupHandle}>
        {children}
    </div> );
}
 
export default GroupHandle;