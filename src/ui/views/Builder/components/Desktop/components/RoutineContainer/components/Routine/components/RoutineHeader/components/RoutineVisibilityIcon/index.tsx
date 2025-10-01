import React from "react";
import styles from "./style.module.css"
import { routineContext } from "../../../..";
import { MdVisibilityOff } from "react-icons/md";

const RoutineVisibilityIcon = () => {
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

export default RoutineVisibilityIcon;