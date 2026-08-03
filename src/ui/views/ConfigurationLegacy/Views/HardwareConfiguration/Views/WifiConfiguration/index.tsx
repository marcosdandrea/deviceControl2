import React, { useContext } from "react";
import style from "./style.module.css";
import { Form, Button } from "antd";
import WifiContextProvider from "./context";
import Password from "./components/WifiPassword";
import { WifiContext, wifiContextType } from "./context";
import WifiSsidList from "./components/WifiSsidList";
import Text from "@components/Text";
import ConnectionStatusLabel from "./components/ConnectionInProgress";

const ConnectionButton = () => {

    const {availableNetworks, disconnectWifi, connectToWifi, ssid } = useContext(WifiContext) as wifiContextType;

    const shouldShowConnect = availableNetworks.find(network => network.inUse)?.ssid !== ssid.value?.ssid;

    const handleOnClick = () => {
        if (shouldShowConnect) {
            connectToWifi()
        } else {
            disconnectWifi();
        }
    };

    return (
        <div className={style.footer}>
            <ConnectionStatusLabel />
            <Button
                type="primary"
                disabled={false}
                onClick={handleOnClick}>
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
                            label={LabelCap("SSID")}>
                            <WifiSsidList />
                        </Form.Item>
                        <Form.Item
                            className={style.item}
                            label={LabelCap("Contraseña")}>
                            <Password />
                        </Form.Item>
                    </Form>
                </div>
                <ConnectionButton/>
            </div>
        </WifiContextProvider >);
}

export default WifiConfiguration;