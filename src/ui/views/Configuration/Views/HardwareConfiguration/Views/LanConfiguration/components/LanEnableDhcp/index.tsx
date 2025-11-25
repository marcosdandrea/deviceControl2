import React from "react";
import { Switch } from "antd";
import { LanContext, lanContextType } from "../../context";

const EnableDhcp = () => {
    const {useDhcp, setUseDhcp} = React.useContext(LanContext) as lanContextType

    return ( 
        <Switch  
            checked={useDhcp}
            onChange={(checked) => setUseDhcp(checked)}
        />
     );
}
 
export default EnableDhcp;