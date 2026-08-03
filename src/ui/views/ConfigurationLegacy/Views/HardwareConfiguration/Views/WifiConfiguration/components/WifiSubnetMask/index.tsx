import Ipv4Input from "@views/Builder/components/Ipv4Input";
import React from "react";
import { WifiContext, wifiContextType } from "../../context";

const SubnetMask = () => {
    const {subnetMaskIpv4, useDhcp} = React.useContext(WifiContext) as wifiContextType

    return ( 
        <Ipv4Input 
            disabled={useDhcp}
            compoundIpv4={subnetMaskIpv4.value}
            setCompoundIpv4={subnetMaskIpv4.set}
            isValid={subnetMaskIpv4.isValid}
        />
     );
}
 
export default SubnetMask;
