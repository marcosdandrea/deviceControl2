import React, { useState } from "react";

export const InterfaceContext = React.createContext({});

export type interfaceContextType = {
    useDhcp: boolean,
    setUseDhcp: (value: boolean) => void,
    ipv4: {
        value: string,
        set: (value: string) => void,
        isValid: boolean
    },
    subnetMaskIpv4: {
        value: string,
        set: (value: string) => void,
        isValid: boolean
    },
    gatewayIpv4: {
        value: string,
        set: (value: string) => void,
        isValid: boolean
    },
    defaultDnsIpv4: {
        value: string,
        set: (value: string) => void,
        isValid: boolean
    },
    alternateDnsIpv4: {
        value: string,
        set: (value: string) => void,
        isValid: boolean
    }
}

const InterfaceContextProvider = ({children, netInterface}) => {
    const [useDhcp, setUseDhcp] = useState(netInterface.useDhcp);
    const [ipv4, setIpv4] = useState(netInterface.ipv4);
    const [subnetMaskIpv4, setSubnetMaskIpv4] = useState(netInterface.subnetMaskIpv4);
    const [gatewayIpv4, setGatewayIpv4] = useState(netInterface.gatewayIpv4);
    const [defaultDnsIpv4, setDefaultDnsIpv4] = useState(netInterface.defaultDnsIpv4);
    const [alternateDnsIpv4, setAlternateDnsIpv4] = useState(netInterface.alternateDnsIpv4);

    const updateIpv4 = (value: string) => {
        setIpv4(value);
    }

    const updateSubnetMaskIpv4 = (value: string) => {
        setSubnetMaskIpv4(value);
    }

    const updateGatewayIpv4 = (value: string) => {
        setGatewayIpv4(value);
    }

    const updateDefaultDnsIpv4 = (value: string) => {
        setDefaultDnsIpv4(value);
    }

    const updateAlternateDnsIpv4 = (value: string) => {
        setAlternateDnsIpv4(value);
    }

    const value: interfaceContextType = {
        useDhcp,
        setUseDhcp,
        ipv4: {
            value: ipv4,
            set: updateIpv4,
            isValid: true
        },
        subnetMaskIpv4: {
            value: subnetMaskIpv4,
            set: updateSubnetMaskIpv4,
            isValid: true
        },
        gatewayIpv4: {
            value: gatewayIpv4,
            set: updateGatewayIpv4,
            isValid: true
        },
        defaultDnsIpv4: {
            value: defaultDnsIpv4,
            set: updateDefaultDnsIpv4,
            isValid: true
        },
        alternateDnsIpv4: {
            value: alternateDnsIpv4,
            set: updateAlternateDnsIpv4,
            isValid: true
        }
    };

    return ( 
    <InterfaceContext.Provider value={value}>
        {children}
    </InterfaceContext.Provider> );
}
 
export default InterfaceContextProvider;