import React from 'react';
import style from "./style.module.css";
import { Form } from "antd";
import Text from "@components/Text";
import EnableDhcp from './components/LanEnableDhcp';
import StaticIp from './components/LanStaticIp';
import Gateway from './components/LanGateway';
import SubnetMask from './components/LanSubnetMask';

const InterfaceSettings = () => {

    const LabelCap = (label: string) => ( <Text className={style.label}>{label}</Text> );

    return (  <div className={style.interfaceSettings}>
                <Text className={style.header}>
                    Configuracion de Red Cableada
                </Text>
                <div className={style.body}>
                <Form
                    className={style.form}>
                    <Form.Item
                        className={style.item}
                        label={LabelCap("Habilitar DHCP")}>
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
            </div> );
}
 
export default InterfaceSettings;