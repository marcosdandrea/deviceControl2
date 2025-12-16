import React from "react";
import styles from "./styles.module.css";
import useLicense from "@hooks/useLicense";
import { Button } from "antd";
import { FaKey } from "react-icons/fa6";
import usePropietaryHardware from "@hooks/usePropietaryHardware";
import useNetworkInterfaces from "@hooks/useNetworkInterfaces";

const LicenseChecker = ({ children }) => {
    const { isLicensed, fetching } = useLicense();
    const { isSignedHardware } = usePropietaryHardware()
    const { networkInterfaces } = useNetworkInterfaces()
    const port = location.port ? `:${location.port}` : '';

    const handleOpenBuilder = () => {
        const url = `http://localhost${port}/#/builder`;

        // Si estamos en Electron, usar la API de Electron
        if (window.electronAPI?.openExternal) {
            window.electronAPI.openExternal(url);
        } else {
            // Si estamos en el navegador, abrir en una nueva pestaña
            window.open(url, '_blank');
        }
    };

    if (isLicensed == undefined || isLicensed) {
        return <>{children}</>;
    }

    if (fetching) {
        return (
            <div className={styles.licenseRequired}>
                <p>Cargando estado de la licencia...</p>
            </div>
        );
    }

    return (
        <div className={styles.licenseRequired}>
            <div className={styles.header}>
                <FaKey size={40} color="var(--warning)" />
                <h3>LICENCIA REQUERIDA</h3>
            </div>
            <div style={{
                display: "flex",
                flexDirection: "column",
                rowGap: "1rem"
            }}>
                <p>Active la licencia de <strong>Device Control 2</strong></p>
                {
                    !isSignedHardware 
                    ? <Button
                        type="primary"
                        onClick={handleOpenBuilder}>
                        Abrir Builder
                    </Button>
                    : <p>{`conectándose al panel builder en ${networkInterfaces.filter((iface) => iface.state === "connected").map((iface) => iface.ipv4.address.split("/")[0]).join(", ")}${port}`}</p>
                }
            </div>
        </div>
    );
}

export default LicenseChecker