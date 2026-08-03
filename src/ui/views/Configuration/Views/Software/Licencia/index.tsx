import React, { useState } from "react";
import { LicenceContext } from "@contexts/LicenceContextProvider";
import { UseLicenseType } from "@hooks/useLicense";
import ScreenTitle from "../../../components/ScreenTitle";
import Button from "../../../components/Button";
import Footer from "../../../components/Footer";
import Banner from "../../../components/Banner";
import style from "./style.module.css";

const Licencia = () => {
    const licenseData = React.useContext(LicenceContext) as UseLicenseType;
    const [confirmDeleting, setConfirmDeleting] = useState(false);
    const [copied, setCopied] = useState(false);

    const expiresAtDate = licenseData.expiresAt
        ? new Date(licenseData.expiresAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
        : "N/A";

    const handleCopy = () => {
        if (licenseData.systemFingerprint) {
            navigator.clipboard.writeText(licenseData.systemFingerprint);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    return (
        <div className={style.wrapper}>
            <ScreenTitle title="Administrador de Licencia" description="Estado de la licencia activa en este dispositivo." />

            {licenseData.isLicensed ? (
                <>
                    <div className={style.statusRow}>
                        <span className={style.dot} />
                        <span className={style.statusText}>Licencia activa</span>
                        <span className={style.expires}>Expira {expiresAtDate}</span>
                    </div>
                    <div className={style.fingerprintBlock}>
                        <div className={style.fingerprintLabel}>Huella del sistema</div>
                        <div className={style.fingerprintRow}>
                            <div className={style.fingerprintValue}>{licenseData.systemFingerprint}</div>
                            <div className={style.copyButton} onClick={handleCopy} title={copied ? "¡Copiado!" : "Copiar"}>
                                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="#b8b8bc" strokeWidth="1.6">
                                    <rect x="7" y="7" width="10" height="10" rx="1.5" />
                                    <path d="M13 7V4.5a1 1 0 00-1-1H4a1 1 0 00-1 1V12a1 1 0 001 1h2.5" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    {confirmDeleting && (
                        <div className={style.confirmBanner}>
                            <Banner variant="warning">¿Estás seguro? Esta acción no se puede deshacer.</Banner>
                        </div>
                    )}
                    <Footer marginTop={6}>
                        {confirmDeleting ? (
                            <>
                                <Button onClick={() => setConfirmDeleting(false)}>Cancelar</Button>
                                <Button variant="danger" onClick={licenseData.deleteLicenseFile}>Sí, eliminar</Button>
                            </>
                        ) : (
                            <Button variant="danger" onClick={() => setConfirmDeleting(true)}>Eliminar Licencia</Button>
                        )}
                    </Footer>
                </>
            ) : (
                <Banner variant="error" title="La aplicación no está licenciada">
                    Por favor, contactá al administrador para obtener una licencia válida.
                </Banner>
            )}
        </div>
    );
};

export default Licencia;
