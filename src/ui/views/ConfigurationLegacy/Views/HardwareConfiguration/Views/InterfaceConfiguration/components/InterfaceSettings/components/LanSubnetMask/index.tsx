import Ipv4Input from "@views/Builder/components/Ipv4Input";
import React from "react";
import { InterfaceContext, interfaceContextType } from "../../../../context";

const SubnetMask = () => {
    const {subnetMaskIpv4, useDhcp} = React.useContext(InterfaceContext) as interfaceContextType
    const [ipv4Compound, setIpv4Compound] = React.useState<number[]>([0, 0, 0, 0]);

    React.useEffect(() => {
        if (!subnetMaskIpv4.value) {
            setIpv4Compound([0, 0, 0, 0]);
            return;
        }
        const segments = subnetMaskIpv4.value.split(".").map(segment => parseInt(segment, 10));
        if (segments.length === 4 && segments.every(segment => !isNaN(segment) && segment >= 0 && segment <= 255)) {
            setIpv4Compound(segments);
        } else {
            setIpv4Compound([0, 0, 0, 0]);
        }
    }, [subnetMaskIpv4.value]);

    const updateIpv4Compound = (segments: number[]) => {
        // No hacer nada - la máscara se calcula automáticamente desde el CIDR de la IP
        console.log('⚠️ Subnet mask is calculated automatically, manual edit ignored');
    }

    return ( 
        <Ipv4Input 
            disabled={true} // Siempre deshabilitado porque se calcula automáticamente
            compoundIpv4={ipv4Compound}
            setCompoundIpv4={updateIpv4Compound}
            isValid={subnetMaskIpv4.isValid}
            placeholder="Calculado automáticamente"
        />
     );
}
 
export default SubnetMask;