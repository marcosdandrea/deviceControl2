import React, { useContext } from 'react';
import style from './style.module.css'
import { Alert, Button, Divider, Typography } from 'antd';
import { LicenceContext } from '@contexts/LicenceContextProvider';
import { UseLicenseType } from '@hooks/useLicense';
import SettingsSection from '@components/SettingsSection';
import SettingRow from '@components/SettingRow';

const LicenseManager = () => {

    const licenseData = useContext(LicenceContext) as UseLicenseType
    const [confirmDeleting, setConfirmDeleting] = React.useState(false);

    const expiresAtDate = licenseData.expiresAt ? new Date(licenseData.expiresAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'N/A';

    return (
        <div className={style.licenseManager}>
            <SettingsSection title="Administrador de Licencia">
                {licenseData.isLicensed ? (
                    <>
                        <SettingRow label="Estado" description={`Expira el ${expiresAtDate}`}>
                            <Typography.Text type="success">Licencia activa</Typography.Text>
                        </SettingRow>
                        <SettingRow label="Huella del sistema">
                            <Typography.Text code copyable>{licenseData.systemFingerprint}</Typography.Text>
                        </SettingRow>
                    </>
                ) : (
                    <Alert
                        type="error"
                        showIcon
                        message="La aplicación no está licenciada"
                        description="Por favor, contactá al administrador para obtener una licencia válida."
                    />
                )}
            </SettingsSection>

            {licenseData.isLicensed && (
                <div className={style.footer}>
                    <Divider className={style.divider} />
                    {confirmDeleting ? (
                        <div className={style.confirmDeleting}>
                            <Alert
                                type="warning"
                                showIcon
                                message="¿Estás seguro? Esta acción no se puede deshacer."
                                style={{ marginBottom: 12 }}
                            />
                            <div className={style.confirmActions}>
                                <Button onClick={() => setConfirmDeleting(false)}>Cancelar</Button>
                                <Button onClick={licenseData.deleteLicenseFile} danger type="primary">
                                    Sí, eliminar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className={style.footerContent}>
                            <Button onClick={() => setConfirmDeleting(true)} danger>
                                Eliminar Licencia
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default LicenseManager;
