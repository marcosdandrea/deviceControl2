import useLogs from "@hooks/useLogs";
import style from "./style.module.css";
import Toolbar from "@views/Builder/components/Toolbar";
import ToolbarButton from "@views/Builder/components/Toolbar/components/ToolbarButton";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoTrash } from "react-icons/io5";
import { Tooltip } from "antd";

type Level = "error" | "warning" | "info";

type RawLog = {
    level: Level;
    message?: { message?: string;[k: string]: any };
    ts?: string | number | Date;
    [k: string]: any;
};

type ViewLog = {
    id: string;
    level: Level;
    text: string;
    ts: number;          // timestamp normalizado
    raw: RawLog;         // por si luego querés más datos
};

const levelStyles: Record<Level, React.CSSProperties> = {
    error: {
        color: "#b91c1c",          // rojo
    },
    warning: {
        color: "#c27a16ff",          // ámbar
    },
    info: {
        color: "#24bd52ff",          // teal
    },
};

const LogItem = React.memo(function LogItem({ log }: { log: ViewLog }) {
    return (
        <div style={{ whiteSpace: "pre-wrap", ...levelStyles[log.level] }}>
            <span style={{ opacity: 0.65, marginRight: 8 }}>
                {new Date(log.ts).toLocaleTimeString()}
            </span>
            <strong style={{ textTransform: "uppercase", marginRight: 8 }}>
                {log.level}
            </strong>
            <span>{log.text}</span>
        </div>
    );
});

export default function LogsView() {
    const { lastErrorLog, lastWarningLog, lastInfoLog, clearLogs } = useLogs();
    const containerRef = useRef<HTMLDivElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const logsRef = useRef<ViewLog[]>([]);
    const [tick, setTick] = useState(0);

    // Estado para “autoscroll activo” cuando el usuario está al fondo
    const [stickToBottom, setStickToBottom] = useState(true);

    // Helper para normalizar y pushear un log
    const pushLog = (raw: RawLog | undefined) => {
        if (!raw) return;
        const level = (raw.level ?? "info") as Level;
        const text =
            raw?.message?.message ??
            // fallback defensivo por si cambia el payload
            (typeof raw?.message === "string" ? raw.message : JSON.stringify(raw));

        const ts =
            typeof raw?.ts === "number"
                ? raw.ts
                : raw?.ts
                    ? new Date(raw.ts as any).getTime()
                    : Date.now();

        const id = `${ts}-${logsRef.current.length}`;

        logsRef.current.push({ id, level, text, ts, raw });
    };

    // Agregar logs cuando entra cualquiera de los tres
    useEffect(() => {
        // Batching: si llegan varios en un mismo tick, empujamos todos y renderizamos una sola vez
        let didPush = false;
        if (lastErrorLog) {
            pushLog({ level: "error", ...(lastErrorLog as any) });
            didPush = true;
        }
        if (lastWarningLog) {
            pushLog({ level: "warning", ...(lastWarningLog as any) });
            didPush = true;
        }
        if (lastInfoLog) {
            pushLog({ level: "info", ...(lastInfoLog as any) });
            didPush = true;
        }
        if (didPush) setTick((t) => t + 1);
    }, [lastErrorLog, lastWarningLog, lastInfoLog]);

    // Detectar si el usuario está al fondo o no
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleScroll = () => {
            // margen de tolerancia de 8px
            const atBottom =
                el.scrollHeight - el.scrollTop - el.clientHeight < 8;
            setStickToBottom(atBottom);
        };

        el.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // chequeo inicial
        return () => el.removeEventListener("scroll", handleScroll);
    }, []);

    // Autoscroll solo si el usuario está al fondo
    useEffect(() => {
        if (stickToBottom) {
            endRef.current?.scrollIntoView({ behavior: "auto" });
        }
    }, [tick, stickToBottom]);

    // (Opcional) limitar visibles para performance extrema:
    const visibleLogs = useMemo(() => {
        // por ejemplo, solo mostrar los últimos 5k (ajustable)
        const MAX = 5000;
        const arr = logsRef.current;
        return arr.length > MAX ? arr.slice(arr.length - MAX) : arr;
    }, [tick]);

    const clearLogView = () => {
        logsRef.current = [];
        setTick((t) => t + 1);
    };

    return (
        <div className={style.terminal}>
            <div
                ref={containerRef}
                className={style.logs}>
                {visibleLogs.map((log) => (
                    <LogItem key={log.id} log={log} />
                ))}
                <div
                    ref={endRef} />
            </div>
            <Toolbar
                style={{
                    padding: "0.3rem"
                }}>
                    <ToolbarButton
                        onClick={clearLogView}
                        icon={<IoTrash />
                        } />
            </Toolbar>
        </div >
    );
}
