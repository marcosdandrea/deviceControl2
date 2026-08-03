import React, { useEffect, useState } from "react";
import { Alert, Button, Divider, Modal, Spin, Tag, Tooltip, Typography } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import useUpdates from "@hooks/useUpdates";
import SettingsSection from "@components/SettingsSection";
import SettingRow from "@components/SettingRow";
import style from "./style.module.css";

const { confirm } = Modal;

const formatDate = (isoDate: string | null) => {
    if (!isoDate) return "Nunca";
    return new Date(isoDate).toLocaleString();
};

const UpdatesConfiguration: React.FC = () => {
    const { status, checking, installing, error, checkNow, install, rollback } = useUpdates();
    const [shiftHeld, setShiftHeld] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Shift") setShiftHeld(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Shift") setShiftHeld(false);
        };
        // Si la ventana pierde el foco con Shift presionado, el keyup nunca llega.
        const handleBlur = () => setShiftHeld(false);

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleBlur);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("blur", handleBlur);
        };
    }, []);

    const handleInstall = () => {
        confirm({
            title: "¿Instalar la actualización?",
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>
                        Se descargará e instalará la versión <strong>v{status?.latestVersion}</strong>
                        {status?.isPrerelease && <> (<strong>Pre-Release</strong>)</>}.
                    </p>
                    {status?.isPrerelease && (
                        <Alert
                            type="warning"
                            message="Estás instalando una versión de prueba (Pre-Release)"
                            description="Puede ser inestable o contener errores. Solo instalá esta versión si sabés lo que estás haciendo."
                            showIcon
                            style={{ marginBottom: 12 }}
                        />
                    )}
                    <Alert
                        type="warning"
                        message="Se reiniciará Device Control"
                        description="Se guardará una copia de la versión actual antes de aplicar los cambios. El proyecto en uso no se ve afectado."
                        showIcon
                        style={{ marginTop: 12 }}
                    />
                </div>
            ),
            okText: "Instalar y reiniciar",
            cancelText: "Cancelar",
            okType: "primary",
            onOk: () => install(),
        });
    };

    const handleRollback = () => {
        confirm({
            title: "¿Volver a la versión anterior?",
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>Se descartará la versión actual (v{status?.currentVersion}) y se restaurará la versión previa a la última actualización.</p>
                    <Alert
                        type="warning"
                        message="Se reiniciará Device Control"
                        showIcon
                        style={{ marginTop: 12 }}
                    />
                </div>
            ),
            okText: "Volver a la versión anterior",
            cancelText: "Cancelar",
            okType: "danger",
            onOk: () => rollback(),
        });
    };

    if (!status) {
        return (
            <div className={style.updatesConfiguration}>
                <div className={style.centered}>
                    <Spin size="large" />
                    <span style={{ marginLeft: 12 }}>Cargando información de actualizaciones...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={style.updatesConfiguration}>
            {error && (
                <Alert type="error" message="Error" description={error} showIcon style={{ marginBottom: 16 }} />
            )}

            <SettingsSection title="Actualizaciones">
                <SettingRow label="Versión actual">
                    <Typography.Text>v{status.currentVersion}</Typography.Text>
                </SettingRow>
                <SettingRow label="Último chequeo">
                    <Typography.Text type="secondary">{formatDate(status.lastCheckedAt)}</Typography.Text>
                </SettingRow>
                {status.updateAvailable && (
                    <SettingRow label="Nueva versión">
                        <Typography.Text>
                            v{status.latestVersion}
                            {status.isPrerelease && <Tag color="warning" style={{ marginLeft: 8 }}>Pre-Release</Tag>}
                        </Typography.Text>
                    </SettingRow>
                )}
            </SettingsSection>

            {status.updateAvailable ? (
                <Alert
                    type="info"
                    showIcon
                    message={`Hay una actualización disponible: v${status.latestVersion}${status.isPrerelease ? " (Pre-Release)" : ""}`}
                    description={
                        <pre className={style.releaseNotes}>{status.releaseNotes || "Sin notas de la versión."}</pre>
                    }
                    style={{ marginTop: 16 }}
                />
            ) : (
                <Alert type="success" showIcon message="Device Control está actualizado" style={{ marginTop: 16 }} />
            )}

            <div className={style.footer}>
                <Divider className={style.divider} />
                <div className={style.footerContent}>
                    <Tooltip title={shiftHeld ? "Buscará versiones de prueba (Pre-Release), incluso inestables" : "Mantené presionado Shift para buscar versiones Pre-Release"}>
                        <Button
                            onClick={(e) => checkNow(e.shiftKey)}
                            loading={checking}
                            danger={shiftHeld}
                        >
                            {shiftHeld ? "Buscar actualizaciones (Pre-Release)" : "Buscar actualizaciones"}
                        </Button>
                    </Tooltip>

                    {status.updateAvailable && (
                        <Tooltip title={status.canInstall ? "" : "La instalación automática solo está disponible en dispositivos con el servicio headless instalado"}>
                            <Button type="primary" onClick={handleInstall} loading={installing} disabled={!status.canInstall}>
                                Instalar actualización
                            </Button>
                        </Tooltip>
                    )}

                    {status.hasBackup && (
                        <Tooltip title={status.canInstall ? "" : "Solo disponible en dispositivos con el servicio headless instalado"}>
                            <Button danger onClick={handleRollback} loading={installing} disabled={!status.canInstall}>
                                Volver a la versión anterior
                            </Button>
                        </Tooltip>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpdatesConfiguration;
