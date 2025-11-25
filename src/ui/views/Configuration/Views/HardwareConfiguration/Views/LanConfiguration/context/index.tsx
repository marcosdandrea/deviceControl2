import React from "react";

export const LanContext = React.createContext({});

export type lanContextType = {
    staticIpv4: {
        value: number[],
        set: React.Dispatch<React.SetStateAction<number[]>>
        isValid: boolean
    },
    gatewayIpv4: {
        value: number[],
        set: React.Dispatch<React.SetStateAction<number[]>>
        isValid: boolean
    },
    subnetMaskIpv4: {
        value: number[],
        set: React.Dispatch<React.SetStateAction<number[]>>
        isValid: boolean
    },
    preferedDnsIpv4: {
        value: number[],
        set: React.Dispatch<React.SetStateAction<number[]>>
        isValid: boolean
    },
    alternateDnsIpv4: {
        value: number[],
        set: React.Dispatch<React.SetStateAction<number[]>>
        isValid: boolean
    },
    useDhcp?: boolean,
    setUseDhcp?: React.Dispatch<React.SetStateAction<boolean>>
};

const LanContextProvider = ({children}) => {
    const [statitIpv4, setStaticIpv4] = React.useState([192, 168, 1, 100]);
    const [ipv4IsValid, setStaticIpv4IsValid] = React.useState(true);

    const [gatewayIpv4, setGatewayIpv4] = React.useState([192, 168, 1, 1]);
    const [gatewayIpv4IsValid, setGatewayIpv4IsValid] = React.useState(true);

    const [subnetMaskIpv4, setSubnetMaskIpv4] = React.useState([255, 255, 255, 0]);
    const [subnetMaskIpv4IsValid, setSubnetMaskIpv4IsValid] = React.useState(true);

    const [preferedDnsIpv4, setPreferedDnsIpv4] = React.useState([8, 8, 8, 8]);
    const [preferedDnsIpv4IsValid, setPreferedDnsIpv4IsValid] = React.useState(true);

    const [alternateDnsIpv4, setAlternateDnsIpv4] = React.useState([8, 8, 4, 4]);
    const [alternateDnsIpv4IsValid, setAlternateDnsIpv4IsValid] = React.useState(true);

    const [useDhcp, setUseDhcp] = React.useState(false);

    const updateIpv4 = (newIpv4: number[]) => {
        const isValid = newIpv4.every(frag => frag >=0 && frag <=255);  
        setStaticIpv4IsValid(isValid);
        setStaticIpv4(newIpv4);
    }

    const updateMaskIpv4 = (newIpv4: number[]) => {
        const isValid = newIpv4.every(frag => frag >=0 && frag <=255);  
        setSubnetMaskIpv4IsValid(isValid);
        setSubnetMaskIpv4(newIpv4);
    }

    const updateGatewayIpv4 = (newIpv4: number[]) => {
        const isValid = newIpv4.every(frag => frag >=0 && frag <=255);  
        setGatewayIpv4IsValid(isValid);
        setGatewayIpv4(newIpv4);
    }

    const updatePreferedDnsIpv4 = (newIpv4: number[]) => {
        const isValid = newIpv4.every(frag => frag >=0 && frag <=255);  
        setPreferedDnsIpv4IsValid(isValid);
        setPreferedDnsIpv4(newIpv4);
    }

    const updateAlternateDnsIpv4 = (newIpv4: number[]) => {
        const isValid = newIpv4.every(frag => frag >=0 && frag <=255);  
        setAlternateDnsIpv4IsValid(isValid);
        setAlternateDnsIpv4(newIpv4);
    }

    const value = {
        staticIpv4: {
            value: statitIpv4,
            set: updateIpv4,
            isValid: ipv4IsValid
        },
        gatewayIpv4: {
            value: gatewayIpv4,
            set: updateGatewayIpv4,
            isValid: gatewayIpv4IsValid
        },
        subnetMaskIpv4: {
            value: subnetMaskIpv4,
            set: updateMaskIpv4,
            isValid: subnetMaskIpv4IsValid
        },
        preferedDnsIpv4: {
            value: preferedDnsIpv4,
            set: updatePreferedDnsIpv4,
            isValid: preferedDnsIpv4IsValid
        },
        alternateDnsIpv4: {
            value: alternateDnsIpv4,
            set: updateAlternateDnsIpv4,
            isValid: alternateDnsIpv4IsValid
        },
        useDhcp,
        setUseDhcp
    } as lanContextType;

    return ( 
    <LanContext.Provider value={value}>
        {children}
    </LanContext.Provider> );
}
 
export default LanContextProvider;