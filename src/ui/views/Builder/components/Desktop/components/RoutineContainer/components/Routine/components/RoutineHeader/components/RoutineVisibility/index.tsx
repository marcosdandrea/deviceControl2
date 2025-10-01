import React from "react";
import styles from "./style.module.css"
import { routineContext } from "../../../..";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

const RoutineVisibility = () => {
    const { routineData } = React.useContext(routineContext)

    return (
        <div className={styles.routineVisibility}>
            {
                routineData?.hidden 
                ? <MdVisibilityOff color={"var(--warning)"} size={18} title="Rutina oculta" />
                : null
            }
        </div>
    );
}

export default RoutineVisibility;