import React from "react";
import { Switch } from "antd";
import { WifiContext, wifiContextType } from "../../context";

const EnableDhcp = () => {
    const {useDhcp, setUseDhcp} = React.useContext(WifiContext) as wifiContextType

    return ( 
        <Switch  
            checked={useDhcp}
            onChange={(checked) => setUseDhcp(checked)}
        />
     );
}
 
export default EnableDhcp;
