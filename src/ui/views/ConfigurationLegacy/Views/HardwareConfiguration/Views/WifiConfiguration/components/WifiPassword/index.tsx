import React from "react";
import { Input } from "antd";
import { WifiContext, wifiContextType } from "../../context";

const Password = () => {
    const {password, ssid} = React.useContext(WifiContext) as wifiContextType

    return ( 
        <Input.Password 
            value={password.value}
            disabled={!ssid.value || ssid.value.security === "Open"}
            onChange={(e) => password.set(e.target.value)}
            placeholder="Contraseña de la red WiFi"
        />
     );
}
 
export default Password;
