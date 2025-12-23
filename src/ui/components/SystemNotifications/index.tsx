import systemEvents from '@common/events/system.events';
import { SocketIOContext } from '@components/SocketIOProvider';
import { App } from 'antd';
import React, { useContext, useEffect } from 'react';

const SystemNotifications = () => {
    const {socket} = useContext(SocketIOContext)
    const { message, modal } = App.useApp();
    const lastMessageRef = React.useRef({ message: null, timestamp: 0 });

    const canShowMessage = (messageText) => {
        const now = Date.now();
        const lastMsg = lastMessageRef.current;
        
        // Si es un mensaje diferente, siempre se puede mostrar
        if (lastMsg.message !== messageText) {
            return true;
        }
        
        // Si es el mismo mensaje, verificar si han pasado más de 4 segundos
        return now - lastMsg.timestamp > 4000;
    };

    const updateLastMessage = (messageText) => {
        lastMessageRef.current = {
            message: messageText,
            timestamp: Date.now()
        };
    };

    const handleOnInfoLog = (data) => {
        if (!canShowMessage(data.message)) return;
        
        updateLastMessage(data.message);
        if (data.type === "success") {
            message.success(data.message);
        } else {
            message.info(data.message);
        }
    }

    const handleOnErrorLog = (data) => {
        if (!canShowMessage(data.message)) return;
        
        updateLastMessage(data.message);
        modal.error({
            title: 'Error',
            content: data.message,
            okText: 'OK',
        });
        console.error("Error log received:", data);
    }

    const handleOnWarningLog = (data) => {
        if (!canShowMessage(data.message)) return;
        
        updateLastMessage(data.message);
        message.warning(data.message);
    }


    useEffect(() => {
        if (!socket) return;

        socket.on(systemEvents.appLogInfo , handleOnInfoLog);
        socket.on(systemEvents.appLogError , handleOnErrorLog);
        socket.on(systemEvents.appLogWarning , handleOnWarningLog);

        return () => {
            socket.off(systemEvents.appLogInfo , handleOnInfoLog);
            socket.off(systemEvents.appLogError , handleOnErrorLog);
            socket.off(systemEvents.appLogWarning , handleOnWarningLog);
        }
    }, [socket]);

    return (<></>);
}

export default SystemNotifications;
