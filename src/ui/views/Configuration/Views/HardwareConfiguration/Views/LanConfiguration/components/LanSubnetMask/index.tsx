import Ipv4Input from "@views/Builder/components/Ipv4Input";
import React from "react";
import { LanContext, lanContextType } from "../../context";

const SubnetMask = () => {
    const {subnetMaskIpv4, useDhcp} = React.useContext(LanContext) as lanContextType

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