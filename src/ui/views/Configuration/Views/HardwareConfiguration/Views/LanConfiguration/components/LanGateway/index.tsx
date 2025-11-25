import Ipv4Input from "@views/Builder/components/Ipv4Input";
import React from "react";
import { LanContext, lanContextType } from "../../context";

const Gateway = () => {
    const {gatewayIpv4, useDhcp} = React.useContext(LanContext) as lanContextType

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