import React from "react";
import style from "./style.module.css";

const DisconnectedView = () => {
    return (
        <div className={style.disconnectedView}>
            <p className={style.title}>This panel is currently disconnected from hardware</p>
            <p className={style.message}>Please check your connection and try again</p>
        </div>
    );
}
 
export default DisconnectedView;