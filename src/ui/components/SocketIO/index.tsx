
import React from 'react';
import { io } from "socket.io-client";
import { useEffect, useState } from 'react';


const SocketIO = () => {
    const socketURL = `http://${window.location.hostname}:3030`;

    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(socketURL);

        newSocket.on("connect", () => {
            console.log("Connected to Socket.IO server");
        });

        newSocket.on("disconnect", () => {
            console.log("Disconnected from Socket.IO server");
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    return ( <></> );
}

 
export default SocketIO;