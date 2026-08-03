import React, { useEffect, useState } from "react";
import { Alert, Button, Divider, Select, Spin } from "antd";
import useLogRetention from "@hooks/useLogRetention";
import SettingsSection from "@components/SettingsSection";
import SettingRow from "@components/SettingRow";
import style from "./style.module.css";

const RETENTION_OPTIONS = [7, 15, 30, 60, 90, 180];

const LogRetentionConfiguration: React.FC = () => {
    const {
        retentionDays,
        loading,
        saving,
        cleaning,
        lastCleanupResult,
        error,
        setRetentionDays,
        runCleanupNow,
    } = useLogRetention();

    const [selectedDays, setSelectedDays] = useState<number | null>(null);

    useEffect(() => {
        if (retentionDays !== null && selectedDays === null) {
            setSelectedDays(retentionDays);
        }
    }, [retentionDays, selectedDays]);

    if (loading && retentionDays === null) {
        return (
            <div className={style.logRetentionConfiguration}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                    <Spin size="large" />
                    <span style={{ marginLeft: 12 }}>Cargando configuración de registro...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={style.logRetentionConfiguration}>
            {error && (
                <Alert type="error" message="Error" description={error} showIcon style={{ marginBottom: 16 }} />
            )}

            <SettingsSection
                title="Registro"
                description="Los logs de ejecución de rutinas se guardan en disco. Definí cuántos días se conservan para evitar quedarte sin espacio de almacenamiento; una tarea corre una vez al día y borra automáticamente los registros más viejos que ese umbral."
            >
                <SettingRow label="Retención de logs" description="Días que se conservan los registros de ejecución">
                    <Select
                        value={selectedDays ?? undefined}
                        onChange={(value) => setSelectedDays(value)}
                        options={RETENTION_OPTIONS.map((days) => ({ value: days, label: `${days} días` }))}
                        style={{ width: 140 }}
                    />
                </SettingRow>
            </SettingsSection>

            <div className={style.footer}>
                <Divider className={style.divider} />
                <div className={style.footerContent}>
                    <Button onClick={() => runCleanupNow()} loading={cleaning}>
                        Limpiar ahora
                    </Button>
                    <Button
                        type="primary"
                        disabled={selectedDays === null || selectedDays === retentionDays}
                        loading={saving}
                        onClick={() => selectedDays !== null && setRetentionDays(selectedDays)}
                    >
                        Guardar
                    </Button>
                </div>

                {lastCleanupResult && (
                    <Alert
                        className={style.cleanupResult}
                        type="success"
                        showIcon
                        message={
                            lastCleanupResult.deletedCount > 0
                                ? `Se eliminaron ${lastCleanupResult.deletedCount} registro(s) antiguo(s).`
                                : "No había registros antiguos para eliminar."
                        }
                    />
                )}
            </div>
        </div>
    );
};

export default LogRetentionConfiguration;
