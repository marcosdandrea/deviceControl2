import React, { useEffect, useState } from "react";

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
    },
    applyInterfaceSettings: () => void
}

const InterfaceContextProvider = ({children, netInterface, onApplyChanges}) => {
    const [useDhcp, setUseDhcp] = useState(netInterface.dhcp);
    const [ipv4, setIpv4] = useState(netInterface.ipv4.address);
    const [subnetMaskIpv4, setSubnetMaskIpv4] = useState("0.0.0.0");
    const [gatewayIpv4, setGatewayIpv4] = useState(netInterface.ipv4.gateway);
    const [defaultDnsIpv4, setDefaultDnsIpv4] = useState(netInterface.ipv4.dns[0] || "0.0.0.0");
    const [alternateDnsIpv4, setAlternateDnsIpv4] = useState(netInterface.ipv4.dns[1] || "0.0.0.0");

    useEffect(() =>{
        //calculate subnet mask from ipv4 address
        if (ipv4) {
            const cidr = ipv4.split("/")[1];
            if (cidr) {
                const mask = [];
                let cidrNum = parseInt(cidr, 10);
                for (let i = 0; i < 4; i++) {
                    if (cidrNum >= 8) {
                        mask.push(255);
                        cidrNum -= 8;
                    } else {
                        let val = 0;
                        for (let j = 0; j < cidrNum; j++) {
                            val += Math.pow(2, 7 - j);
                        }
                        mask.push(val);
                        cidrNum = 0;
                    }
                }
                setSubnetMaskIpv4(mask.join("."));
            } else {
                setSubnetMaskIpv4("0.0.0.0");
            }
        } else {
            setSubnetMaskIpv4("0.0.0.0");
        }
    },[netInterface])

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
        },
        applyInterfaceSettings: () => {
            const settings = {
                dhcp: useDhcp,
                ipv4: ipv4,
                gateway: gatewayIpv4,
                dns: [defaultDnsIpv4, alternateDnsIpv4].filter(dns => dns !== "0.0.0.0")
            };
            onApplyChanges(netInterface.device, settings);
        }

    };

    return ( 
    <InterfaceContext.Provider value={value}>
        {children}
    </InterfaceContext.Provider> );
}
 
export default InterfaceContextProvider;