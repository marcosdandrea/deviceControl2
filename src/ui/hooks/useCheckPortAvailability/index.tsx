import systemCommands from "@common/commands/system.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext } from "react";

const useCheckPortAvailability = () => {
    const {emit, socket} = useContext(SocketIOContext);

    const checkTCPPort = (port: number): Promise<{ isAvailable: boolean }> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                return reject(new Error("Socket.IO not connected"));
            }
            emit(systemCommands.checkTCPPortAvailability, { port }, (response: { isAvailable: boolean }) => {
                resolve(response);
            });
        });
    }

    const checkUDPPort = (port: number): Promise<{ isAvailable: boolean }> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                return reject(new Error("Socket.IO not connected"));
            }
            emit(systemCommands.checkUDPPortAvailability, { port }, (response: { isAvailable: boolean }) => {
                resolve(response);
            });
        });
    }

    return { checkTCPPort, checkUDPPort};
}
 
export default useCheckPortAvailability;