import React from "react";
import { Slider } from "antd";
import { ScreenContext, screenContextType } from "../../context";
import styles from "./style.module.css";

const Brightness = () => {
    const {brightness} = React.useContext(ScreenContext) as screenContextType

    return ( 
        <Slider 
            className={styles.screenBrightness}
            min={1}
            max={10}
            value={brightness.value}
            onChange={(value) => brightness.set(value)}
            marks={{
                1: '1',
                5: '5',
                10: '10'
            }}
            style={{ width: '100%' }}
        />
     );
}
 
export default Brightness;
