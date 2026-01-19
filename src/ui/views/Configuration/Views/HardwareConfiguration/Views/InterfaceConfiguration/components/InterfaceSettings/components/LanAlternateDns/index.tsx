import Ipv4Input from "@views/Builder/components/Ipv4Input";
import React from "react";
import { InterfaceContext, interfaceContextType } from "../../../../context";

const AlternateDns = () => {
    const {alternateDnsIpv4, useDhcp} = React.useContext(InterfaceContext) as interfaceContextType
    const [ipv4Compound, setIpv4Compound] = React.useState<number[]>([0, 0, 0, 0]);

    React.useEffect(() => {
        if (!alternateDnsIpv4.value || alternateDnsIpv4.value === "0.0.0.0") {
            setIpv4Compound([0, 0, 0, 0]);
            return;
        }
        const segments = alternateDnsIpv4.value.split(".").map(segment => parseInt(segment, 10));
        if (segments.length === 4 && segments.every(segment => !isNaN(segment) && segment >= 0 && segment <= 255)) {
            setIpv4Compound(segments);
        } else {
            setIpv4Compound([0, 0, 0, 0]);
        }
    }, [alternateDnsIpv4.value]);

    const updateIpv4Compound = (segments: number[]) => {
        const newIpv4 = segments.join(".");
        alternateDnsIpv4.set(newIpv4);
    }

    return ( 
        <Ipv4Input 
            disabled={useDhcp}
            compoundIpv4={ipv4Compound}
            setCompoundIpv4={updateIpv4Compound}
            isValid={alternateDnsIpv4.isValid}
            placeholder="8.8.4.4"
        />
     );
}
 
export default AlternateDns;