import React from "react";
import style from "./style.module.css";
import { Form, Button } from "antd";
import WifiContextProvider from "./context";
import Gateway from "./components/WifiGateway";
import SubnetMask from "./components/WifiSubnetMask";
import EnableDhcp from "./components/WifiEnableDhcp";
import Text from "@components/Text";
import StaticIp from "./components/WifiStaticIp";
import Ssid from "./components/WifiSsid";
import Password from "./components/WifiPassword";
import ConnectionStatus from "./components/WifiConnectionStatus";
import { WifiContext, wifiContextType } from "./context";

const ConnectionButton = ({ onConnect, onDisconnect }: { onConnect: () => void, onDisconnect: () => void }) => {
    const { connectionStatus } = React.useContext(WifiContext) as wifiContextType;
    const status = connectionStatus.value;

    const isConnecting = status === "Conectando";
    const isConnected = status === "Conectado";
    const shouldShowConnect = status === "Desconectado" || status === "Contraseña Incorrecta";

    return (
        <div className={style.footer}>
            <Button
                type="primary"
                disabled={isConnecting}
                onClick={shouldShowConnect ? onConnect : onDisconnect}
            >
                {shouldShowConnect ? "Conectar" : "Desconectar"}
            </Button>
        </div>
    );
};

const WifiConfiguration = () => {

    const LabelCap = (label: string) => (
        <span
            className={style.labels}>
            {label}
        </span>
    );

    const handleOnConnect = () => {
        // TODO: Implementar lógica de conexión
    };

    const handleOnDisconnect = () => {
        // TODO: Implementar lógica de desconexión
    };

    return (
        <WifiContextProvider>
            <div className={style.wifiConfiguration}>
                <Text className={style.header}>
                    Configuracion de Red WiFi
                </Text>
                <div className={style.body}>
                    <Form>
                        <Form.Item
                            className={style.item}
                            label={LabelCap("Estado")}>
                            <ConnectionStatus />
                        </Form.Item>
                        <Form.Item
                            className={style.item}
                            label={LabelCap("SSID")}>
                            <Ssid />
                        </Form.Item>
                        <Form.Item
                            className={style.item}
                            label={LabelCap("Contraseña")}>
                            <Password />
                        </Form.Item>
                        <Form.Item
                            className={style.item}
                            label={LabelCap("Usar DHCP")}>
                            <EnableDhcp />
                        </Form.Item>
                        <Form.Item
                            className={style.item}
                            label={LabelCap("IP Estática")}>
                            <StaticIp />
                        </Form.Item>
                        <Form.Item
                            className={style.item}
                            label={LabelCap("Puerta de Enlace")}>
                            <Gateway />
                        </Form.Item>
                        <Form.Item
                            className={style.item}
                            label={LabelCap("Máscara de Subred")}>
                            <SubnetMask />
                        </Form.Item>
                    </Form>
                </div>
                <ConnectionButton
                    onConnect={handleOnConnect}
                    onDisconnect={handleOnDisconnect}
                />
            </div>
        </WifiContextProvider >);
}

export default WifiConfiguration;