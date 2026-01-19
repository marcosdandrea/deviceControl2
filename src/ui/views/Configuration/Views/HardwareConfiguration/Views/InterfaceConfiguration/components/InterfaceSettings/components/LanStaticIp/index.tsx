import Ipv4Input from "@views/Builder/components/Ipv4Input";
import React from "react";
import { InterfaceContext, interfaceContextType } from "../../../../context";

const StaticIp = () => {
    const { useDhcp, ipv4 } = React.useContext(InterfaceContext) as interfaceContextType
    const [ipv4Compound, setIpv4Compound] = React.useState<number[]>([0, 0, 0, 0]);
    const [cidr, setCidr] = React.useState<string>("24");

    React.useEffect(() => {
        if (!ipv4.value) {
            setIpv4Compound([0, 0, 0, 0]);
            setCidr("24");
            return;
        }
        
        // Extraer IP y CIDR del formato IP/CIDR
        const parts = ipv4.value.split("/");
        const ipPart = parts[0] || "0.0.0.0";
        const cidrPart = parts[1] || "24";
        
        setCidr(cidrPart);
        
        const segments = ipPart.split(".").map(segment => parseInt(segment, 10));
        if (segments.length === 4 && segments.every(segment => !isNaN(segment) && segment >= 0 && segment <= 255)) {
            setIpv4Compound(segments);
        } else {
            setIpv4Compound([0, 0, 0, 0]);
        }
    }, [ipv4.value]);

    const updateIpv4Compound = (segments: number[]) => {
        const newIpPart = segments.join(".");
        const newIpWithCidr = `${newIpPart}/${cidr}`;
        ipv4.set(newIpWithCidr);
    }

    return (
        <Ipv4Input
            disabled={useDhcp}
            compoundIpv4={ipv4Compound}
            setCompoundIpv4={updateIpv4Compound}
            isValid={ipv4.isValid}
        />
    );
}

export default StaticIp;