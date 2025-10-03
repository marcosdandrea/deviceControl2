import React from 'react';
import styles from './style.module.css';
import { Button, Input, message, Modal } from 'antd';
import useLicense from '@hooks/useLicense';

const LicenseBox = () => {

    const { setLicense, systemFingerprint } = useLicense();
    const [newLicenseKey, setNewLicenseKey] = React.useState<string>("");

    console.log("systemFingerprint", systemFingerprint);

    const handleOnSetLicense = async () => {
        const result = await setLicense(newLicenseKey);
        if (result) {
            message.success("Licencia establecida correctamente.");
        }
        else {
            message.error("La licencia proporcionada no es válida. Por favor, inténtelo de nuevo.");
        }
        setNewLicenseKey("");
    };

    return ( 
        <div className={styles.licenseBox}>
    <Modal 
        className={styles.licenseBoxContent}
        open={true} 
        title="Licencia Inválida" 
        onOk={handleOnSetLicense}
        okText="Establecer Licencia"
        cancelButtonProps={{ style: { display: 'none' } }}
        width={500}
        closable={false}>
        <p>Por favor, ingrese una licencia válida para continuar usando Device Control 2.</p>
        <div className={styles.systemFingerprintBox}>
            <strong>Huella del sistema</strong>
            <span>{systemFingerprint || "Cargando..."}</span>
        </div>
        <Input
            addonBefore="Licencia"
            value={newLicenseKey}
            onChange={(e) => setNewLicenseKey(e.target.value)}
            placeholder="Ingrese la nueva clave de licencia"
        />
    </Modal>
    </div>
);
}
 
export default LicenseBox;