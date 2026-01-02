import systemEvents from '@common/events/system.events';
import { SocketIOContext } from '@components/SocketIOProvider';
import { App, message } from 'antd';
import { nanoid } from 'nanoid';
import React, { useContext, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import style from './style.module.css';

const SystemNotifications = () => {
    const {socket} = useContext(SocketIOContext)
    const { modal } = App.useApp();
    const lastMessageRef = React.useRef({ message: null, timestamp: 0 });

    // Configurar posición global de los mensajes
    useEffect(() => {
        message.config({ 
            top: "3rem"
        });
    }, []);

    const closeMessage = (messageId: React.Key) => {
        message.destroy(messageId);
    };

    const MessageContent = ({text, messageId}) => {
        return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{text}</span>
            <MdClose className={style.closeIcon} size={16} onClick={()=>closeMessage(messageId)} />
        </div>;
    }

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

    const handleOnSuccessLog = (data) => {
        if (!canShowMessage(data.message)) return;
        updateLastMessage(data.message);
        const messageId = nanoid()
        message.open({
            type: 'success',
            content: MessageContent({text: data.message, messageId}),
            key: messageId,
        });
    }

    const handleOnInfoLog = (data) => {
        if (!canShowMessage(data.message)) return;
        updateLastMessage(data.message);
        const messageId = nanoid()
        if (data.type === "success") {
            message.open({
                type: 'success',
                content: MessageContent({text: data.message, messageId}),
                key: messageId,
            });
        } else {
            message.open({
                type: 'info',
                content: MessageContent({text: data.message, messageId}),
                key: messageId,
            });
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
        const messageId = nanoid()
        message.open({
            type: 'warning',
            content: MessageContent({text: data.message, messageId}),
            key: messageId,
        });
    }


    useEffect(() => {
        if (!socket) return;

        socket.on(systemEvents.appLogInfo , handleOnInfoLog);
        socket.on(systemEvents.appLogError , handleOnErrorLog);
        socket.on(systemEvents.appLogWarning , handleOnWarningLog);
        socket.on(systemEvents.appLogSuccess , handleOnSuccessLog);

        return () => {
            socket.off(systemEvents.appLogInfo , handleOnInfoLog);
            socket.off(systemEvents.appLogError , handleOnErrorLog);
            socket.off(systemEvents.appLogWarning , handleOnWarningLog);
            socket.off(systemEvents.appLogSuccess , handleOnSuccessLog);
        }
    }, [socket]);

    return (<></>);
}

export default SystemNotifications;
