import React from "react";
import styles from "./styles.module.css";
import useLicense from "@hooks/useLicense";
import { Button } from "antd";
import { FaKey } from "react-icons/fa6";

const LicenseChecker = ({ children }) => {
    const { isLicensed } = useLicense();
    const port = location.port ? `:${location.port}` : '';

    const handleOpenBuilder = () => {
        const url = `http://localhost${port}/builder`;

        // Si estamos en Electron, usar la API de Electron
        if (window.electronAPI?.openExternal) {
            window.electronAPI.openExternal(url);
        } else {
            // Si estamos en el navegador, abrir en una nueva pestaña
            window.open(url, '_blank');
        }
    };

    if (isLicensed) {
        return <>{children}</>;
    }

    return (
        <div className={styles.licenseRequired}>
            <div className={styles.header}>
                <FaKey size={40} color="var(--warning)" />
                <h3>LICENCIA REQUERIDA</h3>
            </div>
            <p style={{
                display: "flex",
                flexDirection: "column",
                rowGap: "1rem"
            }}>
                <p>Active la licencia de <strong>Device Control 2</strong>.</p>
                <Button
                    type="primary"
                    onClick={handleOpenBuilder}>
                    Abrir Builder
                </Button>
            </p>
        </div>
    );
}

export default LicenseChecker