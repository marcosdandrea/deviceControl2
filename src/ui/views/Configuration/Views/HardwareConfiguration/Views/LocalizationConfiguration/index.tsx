import React, { useState } from "react";
import { Button, Spin, Alert, Modal, Divider, Select } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import useLocalization from "@hooks/useLocalization";
import useProject from "@hooks/useProject";
import SettingsSection from "@components/SettingsSection";
import SettingRow from "@components/SettingRow";
import style from "./style.module.css";

const { confirm } = Modal;

const LocalizationConfiguration: React.FC = () => {
    const { 
        currentTimezone, 
        availableTimezones, 
        loading, 
        error, 
        refreshTimezone, 
        setTimezone
    } = useLocalization();
    const { project, setProject } = useProject({ fetchProject: false });

    const [selectedTimezone, setSelectedTimezone] = useState<string>("");
    const [changingTimezone, setChangingTimezone] = useState(false);

    const handleTimezoneChange = (value: string) => {
        setSelectedTimezone(value);
    };

    const handleApplyTimezone = () => {
        if (!selectedTimezone || selectedTimezone === currentTimezone?.timezone) {
            return;
        }

        confirm({
            title: '¿Confirmar cambio de zona horaria?',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>Está a punto de cambiar la zona horaria del sistema de:</p>
                    <p><strong>Actual:</strong> {currentTimezone?.timezone}</p>
                    <p><strong>Nueva:</strong> {selectedTimezone}</p>
                    <Divider />
                    <Alert
                        type="warning"
                        message="Se reiniciará la aplicación"
                        description="Para aplicar completamente el cambio de zona horaria, la aplicación necesitará reiniciarse. Esto puede tomar unos segundos."
                        showIcon
                    />
                </div>
            ),
            okText: 'Confirmar cambio',
            cancelText: 'Cancelar',
            okType: 'primary',
            onOk: async () => {
                setChangingTimezone(true);
                try {
                    const success = await setTimezone(selectedTimezone);
                    if (success) {
                        if (project) {
                            setProject({ ...project, timezone: selectedTimezone });
                        }
                        Modal.success({
                            title: 'Zona horaria cambiada exitosamente',
                            content: 'La aplicación se reiniciará en unos segundos para aplicar los cambios.',
                            onOk: () => {
                                // Reiniciar la aplicación después de 3 segundos
                                setTimeout(() => {
                                    window.location.reload();
                                }, 3000);
                            }
                        });
                    }
                } catch (err) {
                    console.error('Error changing timezone:', err);
                } finally {
                    setChangingTimezone(false);
                }
            },
        });
    };

    const timezoneOptions = React.useMemo(() => {
        if (!availableTimezones.length) return [];

        const grouped = availableTimezones.reduce((acc, timezone) => {
            const region = timezone.split('/')[0] || 'Other';
            if (!acc[region]) acc[region] = [];
            acc[region].push(timezone);
            return acc;
        }, {} as Record<string, string[]>);

        return Object.keys(grouped)
            .sort()
            .map(region => ({
                label: region,
                title: region,
                options: grouped[region]
                    .sort()
                    .map(timezone => ({ label: timezone, value: timezone })),
            }));
    }, [availableTimezones]);

    // Establecer la zona horaria actual como seleccionada cuando se carga
    React.useEffect(() => {
        if (currentTimezone?.timezone && !selectedTimezone) {
            setSelectedTimezone(currentTimezone.timezone);
        }
    }, [currentTimezone?.timezone, selectedTimezone]);

    if (loading && !currentTimezone) {
        return (
            <div className={style.localizationConfiguration}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <Spin size="large" />
                    <span style={{ marginLeft: 12 }}>Cargando información de zona horaria...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={style.localizationConfiguration}>
            {error && (
                <Alert
                    type="error"
                    message="Error de configuración"
                    description={error}
                    style={{ marginBottom: 16 }}
                    showIcon
                />
            )}

            <SettingsSection title="Configuración de Zona Horaria">
                <SettingRow label="Zona horaria" vertical>
                    <Select
                        showSearch
                        style={{ width: "100%" }}
                        placeholder="Seleccione una zona horaria..."
                        value={selectedTimezone || currentTimezone?.timezone || undefined}
                        onChange={handleTimezoneChange}
                        disabled={changingTimezone || loading}
                        options={timezoneOptions}
                        optionFilterProp="label"
                    />
                </SettingRow>
                <div className={style.buttonContainer}>
                    <Button
                        type="primary"
                        onClick={handleApplyTimezone}
                        disabled={!selectedTimezone || selectedTimezone === currentTimezone?.timezone}
                        loading={changingTimezone}
                    >
                        {changingTimezone ? "Aplicando..." : "Aplicar"}
                    </Button>
                </div>
            </SettingsSection>
        </div>
    );
};

export default LocalizationConfiguration;
