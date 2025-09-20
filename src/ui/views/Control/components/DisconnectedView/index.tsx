import React from "react";
import style from "./style.module.css";

const DisconnectedView = () => {
    return (
        <div className={style.disconnectedView}>
            <p className={style.title}>Este panel está actualmente desconectado de Device Control</p>
            <p className={style.message}>Por favor, verifique su conexión e intente nuevamente</p>
        </div>
    );
}
 
export default DisconnectedView;