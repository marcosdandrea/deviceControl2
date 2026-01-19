import React, { useContext } from "react";
import style from "./style.module.css";
import { Button, Form } from "antd";
import Text from "@components/Text";
import EnableDhcp from "./components/LanEnableDhcp";
import StaticIp from "./components/LanStaticIp";
import Gateway from "./components/LanGateway";
import SubnetMask from "./components/LanSubnetMask";
import DefaultDns from "./components/LanDefaultDns";
import AlternateDns from "./components/LanAlternateDns";
import RedirectCountdown from "./components/RedirectCountdown";
import { InterfaceContext, interfaceContextType } from "../../context";
import { usePopupWindow } from "@components/PopUpWindow";
import { SocketIOContext } from "@components/SocketIOProvider";
import { NetworkCommands } from "@common/commands/net.commands";
import { NetworkConfiguration, NetworkStatus } from "@common/types/network";
import { useNetworkInterfaces } from "@contexts/NetworkInterfacesContext";

const InterfaceSettings = () => {
  const LabelCap = (label: string) => (
    <Text className={style.label}>{label}</Text>
  );
  const {
    ipv4,
    useDhcp,
    subnetMaskIpv4,
    gatewayIpv4,
    defaultDnsIpv4,
    alternateDnsIpv4,
  } = React.useContext(InterfaceContext) as interfaceContextType;
  const { socket } = React.useContext(SocketIOContext);
  const { updateNetworkConfiguration } = useNetworkInterfaces();
  const [showCountdown, setShowCountdown] = React.useState(false);
  const [redirectIp, setRedirectIp] = React.useState("");
  const popupWindow = usePopupWindow();

  const handleApplyChanges = async () => {
    // Validar que el socket esté disponible
    if (!socket || !socket.connected) {
      console.error("Socket connection not available");
      alert("Error: No hay conexión disponible para aplicar los cambios.");
      return;
    }

    // Validaciones para configuración estática usando las validaciones del contexto
    if (!useDhcp) {
      if (!ipv4.isValid) {
        alert("Por favor, ingrese una dirección IP válida.");
        return;
      }
      if (!subnetMaskIpv4.isValid) {
        alert("Por favor, verifique la máscara de subred.");
        return;
      }
      if (!gatewayIpv4.isValid) {
        alert("Por favor, ingrese una puerta de enlace válida.");
        return;
      }
      if (!defaultDnsIpv4.isValid) {
        alert("Por favor, configure un servidor DNS principal válido.");
        return;
      }
      // DNS alternativo es opcional, pero si está configurado debe ser válido
      if (alternateDnsIpv4.value !== "0.0.0.0" && !alternateDnsIpv4.isValid) {
        alert("La dirección del servidor DNS alternativo no es válida.");
        return;
      }
    }

    // Preparar configuración
    const dnsServers = useDhcp ? [] : 
      [defaultDnsIpv4.value, alternateDnsIpv4.value]
        .filter(dns => dns && dns !== "0.0.0.0" && dns.trim() !== "");

    // Extraer solo la IP sin CIDR para el servidor
    const ipOnly = useDhcp ? "" : (ipv4.value.includes("/") ? ipv4.value.split("/")[0] : ipv4.value);

    const config = {
      interfaceName: "LAN", // Nombre de la interfaz por defecto
      status: NetworkStatus.UNKNOWN, // Estado desconocido hasta que se aplique
      dhcpEnabled: useDhcp,
      ipv4Address: ipOnly,
      subnetMask: useDhcp ? "" : subnetMaskIpv4.value,
      gateway: useDhcp ? "" : gatewayIpv4.value,
      dnsServers,
    } as NetworkConfiguration;

    console.log("Applying network configuration:", config);

    try {
      // Usar el contexto de red para aplicar la configuración
      await updateNetworkConfiguration(config);
      
      // Si usa DHCP, mostrar alerta y desconectar
      if (useDhcp) {
        // Cerrar el popup si existe (antes de mostrar el alert)
        if (popupWindow && !popupWindow.closed) {
          popupWindow.close();
        }

        alert(
          "Sistema configurado en DHCP.\n\nPor favor, verifique la nueva dirección IP en la pantalla de control del dispositivo para volver a acceder al panel.",
        );

        // Desconectar el socket
        if (socket) {
          socket.disconnect();
        }
      }
      // Si no usa DHCP y tiene una IP válida, mostrar countdown
      else if (!useDhcp && ipv4.value) {
        // Extraer IP de manera segura
        const ipWithCidr = ipv4.value;
        const newIp = ipWithCidr.includes("/") ? ipWithCidr.split("/")[0] : ipWithCidr;
        
        // Validar que la IP extraída sea válida
        if (newIp && newIp !== "0.0.0.0") {
          setRedirectIp(newIp);
          setShowCountdown(true);
        } else {
          console.error("Invalid IP address for redirect:", newIp);
        }
      }
    } catch (error) {
      console.error("Error applying network configuration:", error);
      alert(`Error al aplicar configuración de red: ${error.message || error}`);
    }
  };

  const handleCancelRedirect = () => {
    setShowCountdown(false);
  };

  // Validar si todos los campos requeridos son válidos
  // DNS alternativo es opcional, por eso no está en la validación principal
  const isConfigurationValid = useDhcp || (
    ipv4.isValid &&
    subnetMaskIpv4.isValid &&
    gatewayIpv4.isValid &&
    defaultDnsIpv4.isValid &&
    alternateDnsIpv4.isValid  // Debe ser válido pero puede estar vacío
  );

  return (
    <div className={style.interfaceSettings}>
      <Text className={style.header}>Configuracion de Red Cableada</Text>
      <div className={style.body}>
        <Form className={style.form}>
          <Form.Item className={style.item} label={LabelCap("Usar DHCP")}>
            <EnableDhcp />
          </Form.Item>
          <Form.Item className={style.item} label={LabelCap("IP Estática")}>
            <StaticIp />
          </Form.Item>
          <Form.Item
            className={style.item}
            label={LabelCap("Puerta de Enlace")}
          >
            <Gateway />
          </Form.Item>
          <Form.Item
            className={style.item}
            label={LabelCap("Máscara de Subred")}
          >
            <SubnetMask />
          </Form.Item>
          <Form.Item
            className={style.item}
            label={LabelCap("DNS Principal")}
          >
            <DefaultDns />
          </Form.Item>
          <Form.Item
            className={style.item}
            label={LabelCap("DNS Alternativo")}
          >
            <AlternateDns />
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
              type="primary"
              disabled={!isConfigurationValid}
            >
              Aplicar Cambios
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterfaceSettings;
