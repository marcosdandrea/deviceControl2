
import React, { createContext } from 'react';
import { io } from "socket.io-client";
import { useEffect, useState } from 'react';
import { Logger } from '@helpers/logger';

export const SocketIOContext = createContext(null);

const SocketIOProvider = ({ children, mountComponentsOnlyWhenConnect = false, disconnectionViewComponent }) => {
    const socketURL = `http://${window.location.hostname}:80`;

    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(socketURL);

        newSocket.on("connect", () => {
            Logger.log("Connected to Socket.IO server");
            setIsConnected(true);
            setSocket(newSocket);
        });

        newSocket.on("disconnect", () => {
            Logger.log("Disconnected from Socket.IO server");
            setIsConnected(false);
            setSocket(null);
        });


        return () => {
            newSocket.close();
            setSocket(null);
            setIsConnected(false);
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
        <SocketIOContext.Provider value={{ socket, emit, isConnected }}>
            {
                mountComponentsOnlyWhenConnect && !socket
                    ? disconnectionViewComponent
                    : children
            }
        </SocketIOContext.Provider>
    );
}


export default SocketIOProvider;