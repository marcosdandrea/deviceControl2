import React, { useContext } from "react";
import style from "./style.module.css";
import { Button, Divider } from "antd";
import SettingsSection from "@components/SettingsSection";
import SettingRow from "@components/SettingRow";
import EnableDhcp from "./components/LanEnableDhcp";
import StaticIp from "./components/LanStaticIp";
import Gateway from "./components/LanGateway";
import SubnetMask from "./components/LanSubnetMask";
import DefaultDns from "./components/LanDefaultDns";
import AlternateDns from "./components/LanAlternateDns";
import RedirectCountdown from "./components/RedirectCountdown";
import { InterfaceContext, interfaceContextType } from "../../context";
import { useFloatingWindow } from "@components/FloatingWindow";
import { SocketIOContext } from "@components/SocketIOProvider";
import { NetworkCommands } from "@common/commands/net.commands";
import { NetworkConfiguration, NetworkStatus } from "@common/types/network";
import { useNetworkInterfaces } from "@contexts/NetworkInterfacesContext";

const InterfaceSettings = () => {
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
  const floatingWindow = useFloatingWindow();

  const handleApplyChanges = async () => {
    console.log("🌐 handleApplyChanges called - useDhcp:", useDhcp, "ipv4.value:", ipv4.value);
    
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
      // Si cambia a DHCP, mostrar advertencia ANTES de aplicar cambios
      if (useDhcp) {
        console.log("🌐 Switching to DHCP - showing warning before applying changes");

        // Mostrar advertencia al usuario ANTES de tocar el popup o aplicar nada,
        // para que cancelar realmente cancele (antes se cerraba el popup incluso si el usuario cancelaba).
        const userConfirmed = confirm(
          "⚠️ CAMBIO A DHCP AUTOMÁTICO\n\n" +
          "El sistema obtendrá una nueva dirección IP automáticamente del router.\n\n" +
          "Para volver a acceder al panel de control:\n" +
          "1. Observe la nueva IP que se muestra en la pantalla del dispositivo\n" +
          "2. Ingrese manualmente esa nueva IP en su navegador\n\n" +
          "¿Desea continuar con el cambio a DHCP automático?"
        );

        if (!userConfirmed) {
          console.log("🌐 User cancelled DHCP change");
          return;
        }

        // Aplicar configuración DHCP
        console.log("🌐 Applying DHCP configuration");
        updateNetworkConfiguration(config).catch(error => {
          console.log("🌐 DHCP config failed (expected due to connection loss):", error.message);
        });

        // Recién ahora, con el cambio ya confirmado y disparado, cerrar el panel flotante
        floatingWindow?.close();

        // Desconectar socket después de 3 segundos (sin mostrar temporizador)
        setTimeout(() => {
          console.log("🌐 Disconnecting socket after DHCP change");
          if (socket) {
            socket.disconnect();
          }
        }, 3000);

        return; // Salir aquí para evitar ejecutar el resto del flujo
      }
      
      // Si no usa DHCP y tiene una IP válida, preparar countdown ANTES de aplicar cambios
      if (!useDhcp && ipv4.value) {
        console.log("🌐 Checking for IP redirect - DHCP disabled, IP value:", ipv4.value);
        
        // Extraer IP de manera segura
        const ipWithCidr = ipv4.value;
        const newIp = ipWithCidr.includes("/") ? ipWithCidr.split("/")[0] : ipWithCidr;
        
        console.log("🌐 Extracted new IP:", newIp);
        
        // Obtener la IP actual de la página
        const currentIp = window.location.hostname;
        console.log("🌐 Current IP:", currentIp);
        
        // Si la IP es válida y diferente, iniciar countdown ANTES de aplicar cambios
        if (newIp && newIp !== "0.0.0.0" && newIp !== currentIp) {
          console.log("🌐 Will start countdown for redirect to:", newIp, "after applying network config");
          setRedirectIp(newIp);
          
          // Iniciar la configuración de red sin esperar
          console.log("🌐 Starting network configuration (no await)");
          updateNetworkConfiguration(config).catch(error => {
            console.log("🌐 Network config failed (expected due to connection loss):", error.message);
          });
          
          // Esperar un momento para que se inicie la configuración y luego mostrar countdown
          setTimeout(() => {
            console.log("🌐 Starting countdown for redirect");
            setShowCountdown(true);
          }, 2000);
          
          return; // Salir aquí para evitar ejecutar el resto
        } else {
          console.log("🌐 No redirect needed - same IP or invalid:", { newIp, currentIp, isValid: newIp !== "0.0.0.0" });
        }
      }
      
      // Para casos sin redirección, usar el flujo normal
      console.log("🌐 Using normal flow - applying network configuration");
      await updateNetworkConfiguration(config);
      console.log("🌐 updateNetworkConfiguration completed successfully");
      
    } catch (error) {
      console.error("🌐 Error in try block:", error);
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
      <SettingsSection title="Configuración de Red Cableada">
        <SettingRow label="Usar DHCP">
          <EnableDhcp />
        </SettingRow>
        <SettingRow label="IP Estática">
          <StaticIp />
        </SettingRow>
        <SettingRow label="Puerta de Enlace">
          <Gateway />
        </SettingRow>
        <SettingRow label="Máscara de Subred">
          <SubnetMask />
        </SettingRow>
        <SettingRow label="DNS Principal">
          <DefaultDns />
        </SettingRow>
        <SettingRow label="DNS Alternativo">
          <AlternateDns />
        </SettingRow>
      </SettingsSection>
      <div className={style.footer}>
        <Divider className={style.divider} />
        <div className={style.footerContent}>
          {showCountdown && (
            <div className={style.countdownSection}>
              <RedirectCountdown
                newIp={redirectIp}
                initialSeconds={10}
                onCancel={handleCancelRedirect}
              />
            </div>
          )}
          <div className={style.buttonSection}>
            <Button
              onClick={() => handleApplyChanges()}
              type="primary"
              disabled={!isConfigurationValid || showCountdown}
            >
              Aplicar Cambios
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterfaceSettings;
