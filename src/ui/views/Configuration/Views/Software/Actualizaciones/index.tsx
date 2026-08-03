import React, { useEffect, useState } from "react";
import { App, Spin, Tooltip } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import useUpdates from "@hooks/useUpdates";
import ScreenTitle from "../../../components/ScreenTitle";
import Row from "../../../components/Row";
import Tag from "../../../components/Tag";
import Banner from "../../../components/Banner";
import Button from "../../../components/Button";
import Footer from "../../../components/Footer";
import style from "./style.module.css";

const formatDate = (isoDate: string | null) => (isoDate ? new Date(isoDate).toLocaleString() : "Nunca");

const Actualizaciones = () => {
    const { modal } = App.useApp();
    const { status, checking, installing, error, checkNow, install, rollback } = useUpdates();
    const [shiftHeld, setShiftHeld] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => e.key === "Shift" && setShiftHeld(true);
        const up = (e: KeyboardEvent) => e.key === "Shift" && setShiftHeld(false);
        const blur = () => setShiftHeld(false);
        window.addEventListener("keydown", down);
        window.addEventListener("keyup", up);
        window.addEventListener("blur", blur);
        return () => {
            window.removeEventListener("keydown", down);
            window.removeEventListener("keyup", up);
            window.removeEventListener("blur", blur);
        };
    }, []);

    const handleInstall = () => {
        modal.confirm({
            title: "¿Instalar la actualización?",
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>Se descargará e instalará la versión <strong>v{status?.latestVersion}</strong>{status?.isPrerelease && <> (<strong>Pre-Release</strong>)</>}.</p>
                    <p>Se reiniciará Device Control. Se guardará una copia de la versión actual antes de aplicar los cambios.</p>
                </div>
            ),
            okText: "Instalar y reiniciar",
            cancelText: "Cancelar",
            onOk: () => install(),
        });
    };

    const handleRollback = () => {
        modal.confirm({
            title: "¿Volver a la versión anterior?",
            icon: <ExclamationCircleOutlined />,
            content: <p>Se descartará la versión actual (v{status?.currentVersion}) y se restaurará la versión previa. Se reiniciará Device Control.</p>,
            okText: "Volver a la versión anterior",
            cancelText: "Cancelar",
            onOk: () => rollback(),
        });
    };

    if (!status) {
        return (
            <div className={style.loading}>
                <Spin />
            </div>
        );
    }

    return (
        <div className={style.wrapper}>
            <ScreenTitle title="Actualizaciones" description="Estado de versión y actualizaciones disponibles." />

            {error && <Banner variant="error" title="Error">{error}</Banner>}

            <div>
                <Row label="Versión actual" padding={10}>
                    <span className={style.value}>v{status.currentVersion}</span>
                </Row>
                <Row label="Último chequeo" padding={10}>
                    <span className={style.value}>{formatDate(status.lastCheckedAt)}</span>
                </Row>
                {status.updateAvailable && (
                    <Row label="Nueva versión disponible" padding={10} bordered={false}>
                        <span className={style.value}>v{status.latestVersion}</span>
                        {status.isPrerelease && <Tag>Pre-Release</Tag>}
                    </Row>
                )}
            </div>

            {status.updateAvailable ? (
                <div className={style.banner}>
                    <Banner variant="info" title="Notas de la versión">
                        <pre className={style.releaseNotes}>{status.releaseNotes || "Sin notas de la versión."}</pre>
                    </Banner>
                </div>
            ) : (
                <div className={style.banner}>
                    <Banner variant="success">Device Control está actualizado</Banner>
                </div>
            )}

            <Footer>
                <Tooltip title={shiftHeld ? "Buscará versiones Pre-Release" : "Mantené Shift para buscar Pre-Release"}>
                    <Button compact onClick={() => checkNow(shiftHeld)} loading={checking}>
                        {shiftHeld ? "Buscar actualizaciones (Pre-Release)" : "Buscar actualizaciones"}
                    </Button>
                </Tooltip>
                {status.updateAvailable && (
                    <Tooltip title={status.canInstall ? "" : "Solo disponible con el servicio headless instalado"}>
                        <Button variant="primary" compact onClick={handleInstall} loading={installing} disabled={!status.canInstall}>
                            Instalar actualización
                        </Button>
                    </Tooltip>
                )}
                {status.hasBackup && (
                    <Tooltip title={status.canInstall ? "" : "Solo disponible con el servicio headless instalado"}>
                        <Button variant="danger" compact onClick={handleRollback} loading={installing} disabled={!status.canInstall}>
                            Volver a la versión anterior
                        </Button>
                    </Tooltip>
                )}
            </Footer>
        </div>
    );
};

export default Actualizaciones;
