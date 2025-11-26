import React from 'react';
import style from "./style.module.css";
import { Button, Form } from "antd";
import Text from "@components/Text";
import EnableDhcp from './components/LanEnableDhcp';
import StaticIp from './components/LanStaticIp';
import Gateway from './components/LanGateway';
import SubnetMask from './components/LanSubnetMask';
import { InterfaceContext, interfaceContextType } from '../../context';

const InterfaceSettings = () => {

    const LabelCap = (label: string) => (<Text className={style.label}>{label}</Text>);
    const { applyInterfaceSettings } = React.useContext(InterfaceContext) as interfaceContextType

    return (<div className={style.interfaceSettings}>
        <Text className={style.header}>
            Configuracion de Red Cableada
        </Text>
        <div className={style.body}>
            <Form
                className={style.form}>
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
            <div className={style.footer}>
                <Button 
                    onClick={() => applyInterfaceSettings()}
                    type="primary">
                        Aplicar Cambios
                </Button>
            </div>
        </div>
    </div>);
}

export default InterfaceSettings;