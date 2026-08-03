import Ipv4Input from "@views/Builder/components/Ipv4Input";
import React from "react";
import { WifiContext, wifiContextType } from "../../context";

const StaticIp = () => {
    const {staticIpv4, useDhcp} = React.useContext(WifiContext) as wifiContextType

    return ( 
        <Ipv4Input 
            disabled={useDhcp}
            compoundIpv4={staticIpv4.value}
            setCompoundIpv4={staticIpv4.set}
            isValid={staticIpv4.isValid}
        />
     );
}
 
export default StaticIp;
