import React from 'react';
import style from "./style.module.css";
import { Button, Form } from "antd";
import Text from "@components/Text";
import EnableDhcp from './components/LanEnableDhcp';
import StaticIp from './components/LanStaticIp';
import Gateway from './components/LanGateway';
import SubnetMask from './components/LanSubnetMask';
import RedirectCountdown from './components/RedirectCountdown';
import { InterfaceContext, interfaceContextType } from '../../context';
import { usePopupWindow } from '@components/PopUpWindow';
import { SocketIOContext } from '@components/SocketIOProvider';

const InterfaceSettings = () => {

    const LabelCap = (label: string) => (<Text className={style.label}>{label}</Text>);
    const { applyInterfaceSettings, ipv4, useDhcp } = React.useContext(InterfaceContext) as interfaceContextType;
    const { socket } = React.useContext(SocketIOContext);
    const [showCountdown, setShowCountdown] = React.useState(false);
    const [redirectIp, setRedirectIp] = React.useState('');
    const popupWindow = usePopupWindow();

    const handleApplyChanges = () => {
        applyInterfaceSettings();
        
        // Si usa DHCP, mostrar alerta y desconectar
        if (useDhcp) {
            // Cerrar el popup si existe (antes de mostrar el alert)
            if (popupWindow && !popupWindow.closed) {
                popupWindow.close();
            }
            
            alert('Sistema configurado en DHCP.\n\nPor favor, verifique la nueva dirección IP en la pantalla de control del dispositivo para volver a acceder al panel.');
            
            // Desconectar el socket
            if (socket) {
                socket.disconnect();
            }
        }
        // Si no usa DHCP y tiene una IP válida, mostrar countdown
        else if (!useDhcp && ipv4.value) {
            const newIp = ipv4.value.split('/')[0]; // Extraer solo la IP sin el CIDR
            setRedirectIp(newIp);
            setShowCountdown(true);
        }
    };

    const handleCancelRedirect = () => {
        setShowCountdown(false);
    };

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
                {showCountdown ? (
                    <RedirectCountdown 
                        newIp={redirectIp}
                        onCancel={handleCancelRedirect}
                        isInPopup={!!popupWindow}
                        popupWindow={popupWindow}
                    />
                ) : (
                    <Button 
                        onClick={() => handleApplyChanges()}
                        type="primary">
                            Aplicar Cambios
                    </Button>
                )}
            </div>
        </div>
    </div>);
}

export default InterfaceSettings;