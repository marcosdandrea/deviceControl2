import React from "react";
import { Input } from "antd";
import { WifiContext, wifiContextType } from "../../context";

const Ssid = () => {
    const {ssid} = React.useContext(WifiContext) as wifiContextType

    return ( 
        <Input 
            value={ssid.value}
            onChange={(e) => ssid.set(e.target.value)}
            placeholder="Nombre de la red WiFi"
        />
     );
}
 
export default Ssid;
