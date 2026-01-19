import React, { useEffect, useState } from 'react';
import { Button, Space } from 'antd';
import Text from '@components/Text';
import style from './style.module.css';
import { Logger } from '@helpers/logger';

interface RedirectCountdownProps {
    newIp: string;
    initialSeconds?: number;
    onCancel: () => void;
    isInPopup?: boolean;
    popupWindow?: Window | null;
}

const RedirectCountdown: React.FC<RedirectCountdownProps> = ({ 
    newIp, 
    initialSeconds = 5, 
    onCancel,
    isInPopup = false,
    popupWindow = null
}) => {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

    useEffect(() => {
        if (secondsLeft <= 0) {
            
            // Ocultar el componente de countdown antes de redirigir
            onCancel();
            
            // Construir la nueva URL
            const protocol = window.location.protocol;
            const port = window.location.port ? `:${window.location.port}` : '';
            const newUrl = `${protocol}//${newIp}${port}`;
            
            Logger.log('Target URL:', newUrl);
            
            // Si estamos en un popup, redirigir la ventana principal y cerrar el popup
            if (isInPopup && popupWindow && !popupWindow.closed) {
                try {
                    // Redirigir la ventana principal
                    window.location.href = newUrl;
                    // Cerrar el popup
                    setTimeout(() => {
                        popupWindow.close();
                    }, 500);
                } catch (error) {
                    Logger.error('Error redirecting or closing popup:', error);
                }
            } else {
                // Si no es popup, redirigir esta ventana
                window.location.href = newUrl;
            }
            return;
        }

        // Countdown timer
        const timer = setInterval(() => {
            setSecondsLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [secondsLeft, newIp, isInPopup, popupWindow]);

    return (
        <div className={style.countdownContainer}>
            <Space direction="horizontal" size="small" style={{ width: '100%' }}>
                <Text className={style.redirect}>
                    Redireccionando a la nueva ubicación en {secondsLeft}...
                </Text>
                <Button 
                    onClick={onCancel}
                    type="default"
                    size="small">
                    Cancelar
                </Button>
            </Space>
        </div>
    );
};

export default RedirectCountdown;
