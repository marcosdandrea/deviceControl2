import React, { useEffect, useState } from "react";
import { Logger } from '@helpers/logger';

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

const InterfaceContextProvider = ({children, netInterface}) => {
    // Función helper para acceso seguro a propiedades anidadas
    const safeGet = (obj: any, path: string, defaultValue: any) => {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : defaultValue;
        }, obj);
    };

    // Accesos seguros a las propiedades de netInterface
    const dhcpEnabled = safeGet(netInterface, 'dhcpEnabled', false);
    const ipv4Address = safeGet(netInterface, 'ipv4Address', "0.0.0.0/24");
    const gateway = safeGet(netInterface, 'gateway', "0.0.0.0");
    const dnsServers = safeGet(netInterface, 'dnsServers', []);
    const primaryDns = dnsServers[0] || "0.0.0.0";
    const secondaryDns = dnsServers[1] || "0.0.0.0";

    const [useDhcp, setUseDhcp] = useState(dhcpEnabled);
    const [ipv4, setIpv4] = useState(ipv4Address);
    const [subnetMaskIpv4, setSubnetMaskIpv4] = useState("0.0.0.0");
    const [gatewayIpv4, setGatewayIpv4] = useState(gateway);
    const [defaultDnsIpv4, setDefaultDnsIpv4] = useState(primaryDns);
    const [alternateDnsIpv4, setAlternateDnsIpv4] = useState(secondaryDns);

    // Actualizar estados cuando cambie la interfaz de red
    useEffect(() => {
        try {
            const newDhcpEnabled = safeGet(netInterface, 'dhcpEnabled', false);
            const newIpv4Address = safeGet(netInterface, 'ipv4Address', "0.0.0.0/24");
            const newGateway = safeGet(netInterface, 'gateway', "0.0.0.0");
            const newDnsServers = safeGet(netInterface, 'dnsServers', []);
            const newPrimaryDns = Array.isArray(newDnsServers) ? (newDnsServers[0] || "0.0.0.0") : "0.0.0.0";
            const newSecondaryDns = Array.isArray(newDnsServers) ? (newDnsServers[1] || "0.0.0.0") : "0.0.0.0";

            setUseDhcp(newDhcpEnabled);
            setIpv4(newIpv4Address);
            setGatewayIpv4(newGateway);
            setDefaultDnsIpv4(newPrimaryDns);
            setAlternateDnsIpv4(newSecondaryDns);
        } catch (error) {
            console.error("Error updating interface configuration:", error);
            // Usar valores por defecto en caso de error
            setUseDhcp(false);
            setIpv4("0.0.0.0/24");
            setGatewayIpv4("0.0.0.0");
            setDefaultDnsIpv4("0.0.0.0");
            setAlternateDnsIpv4("0.0.0.0");
        }
    }, [
        netInterface?.dhcpEnabled, 
        netInterface?.ipv4Address, 
        netInterface?.gateway, 
        JSON.stringify(netInterface?.dnsServers || [])
    ]);

    useEffect(() => {
        try {
            //calculate subnet mask from ipv4 address
            if (ipv4 && typeof ipv4 === 'string') {
                const parts = ipv4.split("/");
                if (parts.length === 2) {
                    const cidr = parts[1];
                    const cidrNum = parseInt(cidr, 10);
                    
                    if (!isNaN(cidrNum) && cidrNum >= 0 && cidrNum <= 32) {
                        const mask = [];
                        let remainingBits = cidrNum;
                        
                        for (let i = 0; i < 4; i++) {
                            if (remainingBits >= 8) {
                                mask.push(255);
                                remainingBits -= 8;
                            } else if (remainingBits > 0) {
                                let val = 0;
                                for (let j = 0; j < remainingBits; j++) {
                                    val += Math.pow(2, 7 - j);
                                }
                                mask.push(val);
                                remainingBits = 0;
                            } else {
                                mask.push(0);
                            }
                        }
                        setSubnetMaskIpv4(mask.join("."));
                    } else {
                        console.warn("Invalid CIDR notation:", cidr);
                        setSubnetMaskIpv4("255.255.255.0"); // Default subnet mask
                    }
                } else {
                    console.warn("IP address does not contain CIDR notation:", ipv4);
                    setSubnetMaskIpv4("255.255.255.0"); // Default subnet mask
                }
            } else {
                setSubnetMaskIpv4("0.0.0.0");
            }
        } catch (error) {
            console.error("Error calculating subnet mask:", error);
            setSubnetMaskIpv4("255.255.255.0"); // Fallback to default
        }
    }, [ipv4]);

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

    // Funciones de validación
    const isValidIpAddress = (ip: string): boolean => {
        if (!ip || ip === "0.0.0.0") return false;
        
        // Regex mejorada para validar IPv4
        const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    };

    // Función para validar IP con CIDR
    const isValidIpWithCidr = (ipWithCidr: string): boolean => {
        if (!ipWithCidr || ipWithCidr === "0.0.0.0/24") return false;
        
        const parts = ipWithCidr.split("/");
        if (parts.length !== 2) return false;
        
        const ip = parts[0];
        const cidr = parseInt(parts[1]);
        const isValidIp = isValidIpAddress(ip);
        const isValidCidr = cidr >= 0 && cidr <= 32;
        return isValidIp && isValidCidr;
    };

    // Validaciones dinámicas que se recalculan cuando cambian los valores
    const ipv4IsValid = useDhcp || isValidIpWithCidr(ipv4);
    const subnetMaskIsValid = useDhcp || isValidIpAddress(subnetMaskIpv4);
    const gatewayIsValid = useDhcp || isValidIpAddress(gatewayIpv4);
    const defaultDnsIsValid = useDhcp || isValidIpAddress(defaultDnsIpv4);
    // DNS alternativo es válido si está vacío (0.0.0.0) o si es una IP válida
    const alternateDnsIsValid = useDhcp || (alternateDnsIpv4 === "0.0.0.0" || alternateDnsIpv4 === "" || isValidIpAddress(alternateDnsIpv4));

    const value: interfaceContextType = {
        useDhcp,
        setUseDhcp,
        ipv4: {
            value: ipv4,
            set: updateIpv4,
            isValid: ipv4IsValid
        },
        subnetMaskIpv4: {
            value: subnetMaskIpv4,
            set: updateSubnetMaskIpv4,
            isValid: subnetMaskIsValid
        },
        gatewayIpv4: {
            value: gatewayIpv4,
            set: updateGatewayIpv4,
            isValid: gatewayIsValid
        },
        defaultDnsIpv4: {
            value: defaultDnsIpv4,
            set: updateDefaultDnsIpv4,
            isValid: defaultDnsIsValid
        },
        alternateDnsIpv4: {
            value: alternateDnsIpv4,
            set: updateAlternateDnsIpv4,
            isValid: alternateDnsIsValid
        },
        applyInterfaceSettings: () => {
            const settings = {
                dhcp: useDhcp,
                ipv4: ipv4,
                gateway: gatewayIpv4,
                dns: [defaultDnsIpv4, alternateDnsIpv4].filter(dns => dns !== "0.0.0.0")
            };
            Logger.log('Applying interface settings:', settings);
        }

    };

    return ( 
    <InterfaceContext.Provider value={value}>
        {children}
    </InterfaceContext.Provider> );
}
 
export default InterfaceContextProvider;