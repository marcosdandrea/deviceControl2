import React from "react";
import { Switch } from "antd";
import { ScreenContext, screenContextType } from "../../context";

const AutoTurnOff = () => {
    const {autoTurnOff} = React.useContext(ScreenContext) as screenContextType

    return ( 
        <Switch  
            checked={autoTurnOff.value}
            onChange={(checked) => autoTurnOff.set(checked)}
        />
     );
}
 
export default AutoTurnOff;
