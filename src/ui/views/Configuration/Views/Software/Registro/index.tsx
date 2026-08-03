import React, { useEffect, useState } from "react";
import { App, Spin } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import useLogRetention from "@hooks/useLogRetention";
import ScreenTitle from "../../../components/ScreenTitle";
import Row from "../../../components/Row";
import SimpleSelect from "../../../components/SimpleSelect";
import Banner from "../../../components/Banner";
import Button from "../../../components/Button";
import Footer from "../../../components/Footer";
import style from "./style.module.css";

const RETENTION_OPTIONS = [7, 15, 30, 60, 90, 180].map((d) => ({ value: d, label: `${d} días` }));

const Registro = () => {
    const { modal } = App.useApp();
    const { retentionDays, loading, saving, cleaning, lastCleanupResult, error, setRetentionDays, runCleanupNow } = useLogRetention();
    const [selectedDays, setSelectedDays] = useState<number | null>(null);

    useEffect(() => {
        if (retentionDays !== null && selectedDays === null) setSelectedDays(retentionDays);
    }, [retentionDays, selectedDays]);

    const handleCleanupNow = () => {
        modal.confirm({
            title: "¿Eliminar registros antiguos?",
            icon: <ExclamationCircleOutlined />,
            content: "Esta acción eliminará permanentemente los registros de actividad que superen el período de retención configurado. No se puede deshacer.",
            okText: "Limpiar ahora",
            okButtonProps: { danger: true },
            cancelText: "Cancelar",
            onOk: () => runCleanupNow(),
        });
    };

    if (loading && retentionDays === null) {
        return (
            <div className={style.loading}>
                <Spin />
            </div>
        );
    }

    return (
        <div className={style.wrapper}>
            <ScreenTitle
                title="Registro"
                description="Los registros se limpian automáticamente cada día según el período elegido."
            />

            {error && <Banner variant="error" title="Error">{error}</Banner>}

            <Row label="Días de retención" padding={10} bordered={false}>
                <SimpleSelect value={selectedDays ?? 30} options={RETENTION_OPTIONS} onChange={setSelectedDays} />
            </Row>

            {lastCleanupResult && (
                <div className={style.banner}>
                    <Banner variant="success">
                        {lastCleanupResult.deletedCount > 0
                            ? `${lastCleanupResult.deletedCount} registros eliminados en la última limpieza.`
                            : "No había registros antiguos para eliminar."}
                    </Banner>
                </div>
            )}

            <Footer>
                <Button compact onClick={handleCleanupNow} loading={cleaning}>Limpiar ahora</Button>
                <Button
                    variant="primary"
                    compact
                    disabled={selectedDays === null || selectedDays === retentionDays}
                    loading={saving}
                    onClick={() => selectedDays !== null && setRetentionDays(selectedDays)}
                >
                    Guardar
                </Button>
            </Footer>
        </div>
    );
};

export default Registro;
