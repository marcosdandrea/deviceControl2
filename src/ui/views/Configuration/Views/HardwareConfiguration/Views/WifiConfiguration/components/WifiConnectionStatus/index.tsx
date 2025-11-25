import React from "react";
import { Input } from "antd";
import { WifiContext, wifiContextType } from "../../context";

const ConnectionStatus = () => {
    const {connectionStatus} = React.useContext(WifiContext) as wifiContextType

    return ( 
        <Input 
            value={connectionStatus.value}
            disabled
            style={{ color: 'inherit' }}
        />
     );
}
 
export default ConnectionStatus;
