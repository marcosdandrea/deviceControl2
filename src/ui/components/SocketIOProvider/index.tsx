
import React, { createContext } from 'react';
import { io } from "socket.io-client";
import { useEffect, useState } from 'react';
import { Logger } from '@helpers/logger';

export const SocketIOContext = createContext(null);

const SocketIOProvider = ({ children, mountComponentsOnlyWhenConnect = false }) => {
    const socketURL = `http://${window.location.hostname}:3000`;

    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(socketURL);

        newSocket.on("connect", () => {
            Logger.log("Connected to Socket.IO server");
            setSocket(newSocket);
        });

        newSocket.on("disconnect", () => {
            Logger.log("Disconnected from Socket.IO server");
            setSocket(null);
        });


        return () => {
            newSocket.close();
            setSocket(null);
        };
    }, []);

    const emit = (event: string, data?: any, cb?: Function) => {
        if (socket) {
            socket.emit(event, data, cb);
            Logger.log(`Emitted event: ${event}`, data);
        } else {
            Logger.error("Socket is not connected");
        }
    };

    return (
        <SocketIOContext.Provider value={{ socket, emit }}>
            {
                mountComponentsOnlyWhenConnect && !socket
                    ? <div>Waiting for connection...</div>
                    : children
            }
        </SocketIOContext.Provider>
    );
}


export default SocketIOProvider;