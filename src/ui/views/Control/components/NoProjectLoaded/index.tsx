import React from 'react';
import style from './style.module.css';

const NoProjectLoaded = () => {
    return ( <div className={style.noProjectLoaded}>
                <div className={style.noRoutines}>
                  <p className={style.noRoutinesTitle}>No hay proyecto</p>
                  <p className={style.noRoutinesSubtitle}>Ve al Builder y crea o carga uno. </p>
                </div>
    </div> );
}
 
export default NoProjectLoaded;