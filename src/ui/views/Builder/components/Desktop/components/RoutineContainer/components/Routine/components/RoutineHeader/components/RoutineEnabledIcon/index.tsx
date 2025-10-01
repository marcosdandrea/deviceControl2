import React from "react";
import styles from "./style.module.css"
import { routineContext } from "../../../..";
import { MdOutlineDisabledByDefault } from "react-icons/md";

const RoutineEnabledIcon = () => {
    const { routineData } = React.useContext(routineContext)

    return (
        <div className={styles.routineEnabled}>
            {
                !routineData?.enabled 
                ? <MdOutlineDisabledByDefault color={"var(--error)"} size={18} title="Rutina deshabilitada" />
                : null
            }
        </div>
    );
}

export default RoutineEnabledIcon;