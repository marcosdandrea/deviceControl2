import React, { useEffect, useMemo, useRef, useState } from "react";
import { App, Spin } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import useLocalization from "@hooks/useLocalization";
import useProject from "@hooks/useProject";
import ScreenTitle from "../../../components/ScreenTitle";
import Footer from "../../../components/Footer";
import Button from "../../../components/Button";
import style from "./style.module.css";

const ZonaHoraria = () => {
    const { modal } = App.useApp();
    const { currentTimezone, availableTimezones, loading, refreshTimezone, setTimezone } = useLocalization();
    const { project, setProject } = useProject({ fetchProject: false });
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<string | null>(null);
    const [applying, setApplying] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const activeRowRef = useRef<HTMLDivElement>(null);
    const scrolledToInitial = useRef(false);

    const effectiveSelected = selected ?? currentTimezone?.timezone ?? null;

    const grouped = useMemo(() => {
        const filtered = availableTimezones.filter((tz) =>
            tz.toLowerCase().includes(search.toLowerCase())
        );
        const groups: Record<string, string[]> = {};
        filtered.forEach((tz) => {
            const region = tz.split("/")[0] || "Otros";
            if (!groups[region]) groups[region] = [];
            groups[region].push(tz);
        });
        return Object.keys(groups)
            .sort()
            .map((region) => ({ region, zones: groups[region].sort() }));
    }, [availableTimezones, search]);

    useEffect(() => {
        if (scrolledToInitial.current) return;
        if (!activeRowRef.current || !listRef.current) return;
        activeRowRef.current.scrollIntoView({ block: "center" });
        scrolledToInitial.current = true;
    }, [grouped, effectiveSelected]);

    const handleApply = () => {
        if (!effectiveSelected || effectiveSelected === currentTimezone?.timezone) return;

        modal.confirm({
            title: "¿Confirmar cambio de zona horaria?",
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>Actual: <strong>{currentTimezone?.timezone}</strong></p>
                    <p>Nueva: <strong>{effectiveSelected}</strong></p>
                    <p>Se reiniciará la aplicación para aplicar completamente el cambio.</p>
                </div>
            ),
            okText: "Confirmar cambio",
            cancelText: "Cancelar",
            onOk: async () => {
                setApplying(true);
                try {
                    const success = await setTimezone(effectiveSelected);
                    if (success) {
                        if (project) setProject({ ...project, timezone: effectiveSelected });
                        modal.success({
                            title: "Zona horaria cambiada exitosamente",
                            content: "La aplicación se reiniciará en unos segundos.",
                            onOk: () => setTimeout(() => window.location.reload(), 1000),
                        });
                    }
                } finally {
                    setApplying(false);
                }
            },
        });
    };

    if (loading && !currentTimezone) {
        return (
            <div className={style.loading}>
                <Spin />
            </div>
        );
    }

    return (
        <div className={style.wrapper}>
            <ScreenTitle title="Zona Horaria" description="Selecciona la región y ciudad de referencia horaria." />
            <div className={style.searchBox}>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="#8b8b90" strokeWidth="1.6">
                    <circle cx="9" cy="9" r="6" />
                    <path d="M17 17l-3.5-3.5" />
                </svg>
                <input
                    className={style.searchInput}
                    placeholder="Buscar zona horaria..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={refreshTimezone}
                />
            </div>
            <div className={style.list} ref={listRef}>
                {grouped.map(({ region, zones }) => (
                    <React.Fragment key={region}>
                        <div className={style.regionHeader}>{region.toUpperCase()}</div>
                        {zones.map((tz) => (
                            <div
                                key={tz}
                                ref={tz === effectiveSelected ? activeRowRef : undefined}
                                className={`${style.zoneRow} ${tz === effectiveSelected ? style.zoneRowActive : ""}`}
                                onClick={() => setSelected(tz)}
                            >
                                <span>{tz.split("/").slice(1).join(" / ") || tz}</span>
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </div>
            <div className={style.hint}>Aplicar reiniciará el dispositivo para sincronizar la hora.</div>
            <Footer>
                <Button
                    variant="primary"
                    onClick={handleApply}
                    disabled={!effectiveSelected || effectiveSelected === currentTimezone?.timezone}
                    loading={applying}
                >
                    Aplicar
                </Button>
            </Footer>
        </div>
    );
};

export default ZonaHoraria;
