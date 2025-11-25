import Ipv4Input from "@views/Builder/components/Ipv4Input";
import React from "react";
import { WifiContext, wifiContextType } from "../../context";

const Gateway = () => {
    const {gatewayIpv4, useDhcp} = React.useContext(WifiContext) as wifiContextType

    return ( 
        <Ipv4Input 
            disabled={useDhcp}
            compoundIpv4={gatewayIpv4.value}
            setCompoundIpv4={gatewayIpv4.set}
            isValid={gatewayIpv4.isValid}
        />
     );
}
 
export default Gateway;
