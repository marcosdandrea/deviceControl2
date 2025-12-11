import React from "react";
import style from './style.module.css';

const StatusBar = React.memo(() => {
    return (
    <div className={style.statusBar} >
    </div>
);
});

StatusBar.displayName = 'StatusBar';
 
export default StatusBar;