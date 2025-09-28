import systemEvents from '@common/events/system.events';
import { SocketIOContext } from '@components/SocketIOProvider';
import { message } from 'antd';
import React, { useContext, useEffect } from 'react';

const SystemNotifications = () => {
    const {socket} = useContext(SocketIOContext)

    let lastMessage = null;

    message.config({
        top: 50,
        duration: 4,
        maxCount: 3,
    });

    const handleOnInfoLog = (data) => {
        if (data.message === lastMessage) return;
        lastMessage = data.message;
        message.info(data.message);
    }

    const handleOnErrorLog = (data) => {
        if (data.message === lastMessage) return;
        lastMessage = data.message;
        message.error(data.message);
    }

    const handleOnWarningLog = (data) => {
        if (data.message === lastMessage) return;
        lastMessage = data.message;
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
