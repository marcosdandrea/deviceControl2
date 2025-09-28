import React from "react";
import style from "./style.module.css";

const NoProjectOpened = () => {
  return (
    <div className={style.noProjectOpened}>
        <p>Utilice el botón "Nuevo proyecto" o "Cargar proyecto" en la barra de herramientas para comenzar.</p>
    </div>
  );
};

export default NoProjectOpened;
