import React, { useContext } from 'react';
import style from './style.module.css'
import Text from '@components/Text';
import { LicenceContext } from '@contexts/LicenceContextProvider';
import { UseLicenseType } from '@hooks/useLicense';
import { Button } from 'antd';

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
            <Text className={style.header}>🔐 Administrador de Licencia</Text>
            <div className={style.licenseBody}>
                {
                    licenseData.isLicensed
                        ? <div className={style.isLicensedBody}>
                            <Text className={style.validLicense}>Esta aplicación está licenciada y expira el <strong>{expiresAtDate}</strong></Text>
                            <Text className={style.fingerprint}>Huella del sistema: <br/><code>{licenseData.systemFingerprint}</code></Text>
                            {confirmDeleting
                                ? <div className={style.confirmDeletingContainer}>
                                    <Text style={{ color: '#faad14', fontWeight: 600 }}>⚠️ ¿Estás seguro? Esta acción no se puede deshacer.</Text>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <Button
                                            onClick={licenseData.deleteLicenseFile}
                                            danger
                                            type='primary'
                                            style={{ flex: 1 }}>
                                            Sí, Eliminar
                                        </Button>
                                        <Button
                                            onClick={() => setConfirmDeleting(false)}
                                            type='default'
                                            style={{ flex: 1 }}>
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                                : <Button
                                    onClick={() => setConfirmDeleting(true)}
                                    type='default'
                                    danger
                                    block
                                    style={{ marginTop: '12px' }}
                                    >
                                    🗑️ Eliminar Licencia
                                </Button>
                            }
                        </div>
                        : <div className={style.notLicensedBody}>
                            <Text>❌ La aplicación no está licenciada</Text>
                            <Text style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.8 }}>Por favor, contacta al administrador para obtener una licencia válida.</Text>
                        </div>
                }
            </div>
        </div>
    );
}

export default LicenseManager;