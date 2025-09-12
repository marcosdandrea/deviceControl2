import React from "react";
import style from './style.module.css';

const Toolbar = ({children}) => {
    return (
        <div className={style.toolbar} >
            {children}
        </div>
    );
}

export default Toolbar;