import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import { useNetworkInterfaces } from "@contexts/NetworkInterfacesContext";
import { useFloatingWindow } from "@components/FloatingWindow";
import { SocketIOContext } from "@components/SocketIOProvider";
import { NetworkConfiguration, NetworkStatus } from "@common/types/network";
import ScreenTitle from "../../../components/ScreenTitle";
import Row from "../../../components/Row";
import Switch from "../../../components/Switch";
import Ipv4Group from "../../../components/Ipv4Group";
import Button from "../../../components/Button";
import Footer from "../../../components/Footer";
import style from "./style.module.css";

const ipToParts = (ip: string): number[] => {
    const [address] = ip.split("/");
    const parts = address.split(".").map((p) => parseInt(p, 10));
    return parts.length === 4 && parts.every((p) => !isNaN(p)) ? parts : [0, 0, 0, 0];
};

const partsToIp = (parts: number[]) => parts.join(".");

const isValidIp = (parts: number[]) => !(parts[0] === 0 && parts[1] === 0 && parts[2] === 0 && parts[3] === 0);

const cidrToSubnetMask = (cidr: number): string => {
    const mask: number[] = [];
    let remaining = cidr;
    for (let i = 0; i < 4; i++) {
        if (remaining >= 8) {
            mask.push(255);
            remaining -= 8;
        } else if (remaining > 0) {
            let val = 0;
            for (let j = 0; j < remaining; j++) val += 2 ** (7 - j);
            mask.push(val);
            remaining = 0;
        } else {
            mask.push(0);
        }
    }
    return mask.join(".");
};

const Redes = () => {
    const { networkConfiguration, isLoading, updateNetworkConfiguration } = useNetworkInterfaces();
    const { socket } = React.useContext(SocketIOContext);
    const floatingWindow = useFloatingWindow();

    const [dhcp, setDhcp] = useState(networkConfiguration.dhcpEnabled);
    const [ipv4, setIpv4] = useState<number[]>(ipToParts(networkConfiguration.ipv4Address));
    const [cidr, setCidr] = useState<string>(networkConfiguration.ipv4Address.split("/")[1] || "24");
    const [gateway, setGateway] = useState<number[]>(ipToParts(networkConfiguration.gateway || "0.0.0.0"));
    const [dns1, setDns1] = useState<number[]>(ipToParts(networkConfiguration.dnsServers?.[0] || "0.0.0.0"));
    const [dns2, setDns2] = useState<number[]>(ipToParts(networkConfiguration.dnsServers?.[1] || "0.0.0.0"));
    const [showCountdown, setShowCountdown] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(10);
    const [redirectIp, setRedirectIp] = useState("");
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        setDhcp(networkConfiguration.dhcpEnabled);
        setIpv4(ipToParts(networkConfiguration.ipv4Address));
        setCidr(networkConfiguration.ipv4Address.split("/")[1] || "24");
        setGateway(ipToParts(networkConfiguration.gateway || "0.0.0.0"));
        setDns1(ipToParts(networkConfiguration.dnsServers?.[0] || "0.0.0.0"));
        setDns2(ipToParts(networkConfiguration.dnsServers?.[1] || "0.0.0.0"));
    }, [networkConfiguration]);

    useEffect(() => {
        if (!showCountdown) return;
        if (secondsLeft <= 0) {
            const protocol = window.location.protocol;
            const port = window.location.port ? `:${window.location.port}` : "";
            window.location.href = `${protocol}//${redirectIp}${port}`;
            return;
        }
        const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [showCountdown, secondsLeft, redirectIp]);

    const subnetMask = cidrToSubnetMask(Number(cidr) || 24);
    const isConfigValid = dhcp || (isValidIp(ipv4) && isValidIp(gateway) && isValidIp(dns1));

    const handleApply = async () => {
        if (!socket || !socket.connected) {
            message_error("No hay conexión disponible para aplicar los cambios.");
            return;
        }

        if (dhcp) {
            const confirmed = window.confirm(
                "El sistema obtendrá una nueva dirección IP automáticamente del router.\n\n" +
                "Para volver a acceder al panel de control, observe la nueva IP en la pantalla del dispositivo.\n\n" +
                "¿Desea continuar con el cambio a DHCP automático?"
            );
            if (!confirmed) return;

            setApplying(true);
            const config: NetworkConfiguration = {
                interfaceName: "LAN",
                status: NetworkStatus.UNKNOWN,
                dhcpEnabled: true,
                ipv4Address: "",
                subnetMask: "",
                gateway: "",
                dnsServers: [],
            };
            updateNetworkConfiguration(config).catch(() => {});
            floatingWindow?.close();
            setTimeout(() => socket.disconnect(), 3000);
            return;
        }

        const newIp = partsToIp(ipv4);
        const currentIp = window.location.hostname;
        const dnsServers = [partsToIp(dns1), partsToIp(dns2)].filter((d) => d !== "0.0.0.0");

        setApplying(true);
        const config: NetworkConfiguration = {
            interfaceName: "LAN",
            status: NetworkStatus.UNKNOWN,
            dhcpEnabled: false,
            ipv4Address: newIp,
            subnetMask,
            gateway: partsToIp(gateway),
            dnsServers,
        };

        if (newIp && newIp !== "0.0.0.0" && newIp !== currentIp) {
            setRedirectIp(newIp);
            updateNetworkConfiguration(config).catch(() => {});
            setTimeout(() => {
                setApplying(false);
                setShowCountdown(true);
                setSecondsLeft(10);
            }, 2000);
            return;
        }

        try {
            await updateNetworkConfiguration(config);
        } finally {
            setApplying(false);
        }
    };

    const message_error = (msg: string) => window.alert(msg);

    if (isLoading) {
        return (
            <div className={style.loading}>
                <Spin />
            </div>
        );
    }

    return (
        <div className={style.wrapper}>
            <ScreenTitle title="Configuración de Red Cableada" description="Ajustes de la conexión cableada del dispositivo." />
            <div>
                <Row label="Usar DHCP" description="Asignación automática de IP">
                    <Switch checked={dhcp} onChange={setDhcp} />
                </Row>
                <div style={{ opacity: dhcp ? 0.4 : 1 }}>
                    <Row label="IP Estática">
                        <Ipv4Group value={ipv4} onChange={(i, v) => setIpv4((prev) => prev.map((p, idx) => (idx === i ? v : p)))} disabled={dhcp} softBorder />
                    </Row>
                </div>
                <Row label="Puerta de Enlace">
                    <Ipv4Group value={gateway} onChange={(i, v) => setGateway((prev) => prev.map((p, idx) => (idx === i ? v : p)))} />
                </Row>
                <Row label={<>Máscara de Subred <span className={style.calcTag}>calculada</span></>}>
                    <span className={style.calcValue}>{subnetMask}</span>
                </Row>
                <Row label="DNS Principal">
                    <Ipv4Group value={dns1} onChange={(i, v) => setDns1((prev) => prev.map((p, idx) => (idx === i ? v : p)))} placeholder={[8, 8, 8, 8]} />
                </Row>
                <Row label="DNS Alternativo" bordered={false}>
                    <Ipv4Group value={dns2} onChange={(i, v) => setDns2((prev) => prev.map((p, idx) => (idx === i ? v : p)))} placeholder={[8, 8, 4, 4]} />
                </Row>
            </div>
            <div className={style.warning}>Al aplicar, el dispositivo puede cambiar de IP y perder la conexión temporalmente.</div>
            <Footer
                left={showCountdown && (
                    <div className={style.countdown}>
                        Redireccionando a la nueva ubicación en {secondsLeft}...
                        <Button compact onClick={() => setShowCountdown(false)}>Cancelar</Button>
                    </div>
                )}
            >
                <Button variant="primary" onClick={handleApply} disabled={!isConfigValid || showCountdown || applying} loading={applying}>
                    Aplicar Cambios
                </Button>
            </Footer>
        </div>
    );
};

export default Redes;
