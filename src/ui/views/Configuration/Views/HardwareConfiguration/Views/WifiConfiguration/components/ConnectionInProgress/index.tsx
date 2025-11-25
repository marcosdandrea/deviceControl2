import React, { useContext, useEffect, useState } from "react";
import { Spin } from "antd";
import { WifiContext, wifiContextType } from "../../context";
import style from "./style.module.css";

const ConnectionStatusLabel = () => {
    const { connectionState, wifiStatus } = useContext(WifiContext) as wifiContextType;
    const [countdown, setCountdown] = useState(15);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (connectionState.status === "connecting") {
            setCountdown(15);
            setShowSuccess(false);
        } else if (connectionState.status === "connected") {
            setShowSuccess(true);
            // Ocultar mensaje de éxito después de 2 segundos
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [connectionState.status]);

    useEffect(() => {
        if (connectionState.status === "connecting" && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [connectionState.status, countdown]);

    // Mostrar mensaje de conexión en progreso
    if (connectionState.status === "connecting") {
        return (
            <div className={style.container}>
                <Spin size="small" />
                <span className={style.text}>
                    Conectando a {connectionState.ssid}... ({countdown}s)
                </span>
            </div>
        );
    }

    // Mostrar mensaje de fallback
    if (connectionState.status === "fallback") {
        return (
            <div className={`${style.container} ${style.fadeIn}`}>
                <span className={`${style.text} ${style.warning}`}>
                    ⚠ No se pudo conectar a {connectionState.ssid}. Restaurado a {connectionState.previousSSID}
                </span>
            </div>
        );
    }

    // Mostrar mensaje de éxito temporal
    if (showSuccess && connectionState.ssid) {
        return (
            <div className={`${style.container} ${style.fadeIn}`}>
                <span className={`${style.text} ${style.success}`}>
                    ✓ Conectado exitosamente a {connectionState.ssid}
                </span>
            </div>
        );
    }

    // Mostrar mensaje de error
    if (connectionState.status === "error") {
        return (
            <div className={`${style.container} ${style.fadeIn}`}>
                <span className={`${style.text} ${style.error}`}>
                    ✗ Error al conectar a {connectionState.ssid}
                </span>
            </div>
        );
    }

    // Mostrar estado actual de conexión
    if (wifiStatus.connected && wifiStatus.ssid) {
        return (
            <div className={style.container}>
                <span className={style.text}>
                    Conectado a: <strong>{wifiStatus.ssid}</strong>
                </span>
            </div>
        );
    }

    // Sin conexión
    return (
        <div className={style.container}>
            <span className={`${style.text} ${style.muted}`}>
                Conéctese a una red wifi
            </span>
        </div>
    );
};

export default ConnectionStatusLabel;
