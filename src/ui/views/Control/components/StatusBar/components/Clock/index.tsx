import React from "react";
import styles from "./style.module.css";
import useSystemTime from "@hooks/useSystemTime";

const Clock = () => {
    const { time } = useSystemTime({ format: "es-MX"});

    return (
        <div className={styles.clock}>
            {time}
        </div>
    );
}
 
export default Clock;