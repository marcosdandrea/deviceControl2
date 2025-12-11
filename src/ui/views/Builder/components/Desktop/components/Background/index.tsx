import React from 'react';
import style from './style.module.css';

const Background = React.memo(() => {
    return (
        <div className={style.background}/>
    );
});

Background.displayName = 'Background';
 
export default Background;