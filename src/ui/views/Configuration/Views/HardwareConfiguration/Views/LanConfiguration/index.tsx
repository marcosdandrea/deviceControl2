import React from "react";
import style from "./style.module.css";
import { Form } from "antd";
import LanContextProvider from "./context";
import Gateway from "./components/LanGateway";
import SubnetMask from "./components/LanSubnetMask";
import EnableDhcp from "./components/LanEnableDhcp";
import Text from "@components/Text";
import StaticIp from "./components/LanStaticIp";

const LanConfiguration = () => {

    const LabelCap = (label: string) => (
        <span
            className={style.labels}>
            {label}
        </span>
    );

    return (
        <LanContextProvider>
            <div className={style.lanConfiguration}>
                <Text className={style.header}>
                    Configuracion de Red Cableada
                </Text>
                <div className={style.body}>
                <Form>
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
            </div>
        </LanContextProvider >);
}

export default LanConfiguration;