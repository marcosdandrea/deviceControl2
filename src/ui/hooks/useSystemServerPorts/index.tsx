import systemCommands from "@common/commands/system.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";
import { Logger } from "@helpers/logger";

const useSystemServerPorts = () => {
    const { emit } = useContext(SocketIOContext)
    const [mainServerPort, setMainServerPort] = useState<number | undefined>(undefined);
    const [generalServerPort, setGeneralServerPort] = useState<number | undefined>(undefined);

    useEffect(() => {

        emit(systemCommands.getServerPorts, null, (answer: {main: number, general: number, error?: string}) => {
            if (answer?.error || answer?.main === undefined || answer?.general === undefined) {
                Logger.error(answer.error);
                return;
            }
            setMainServerPort(answer.main);
            setGeneralServerPort(answer.general);
        });
    }, []);


    return { mainServerPort, generalServerPort };
}

export default useSystemServerPorts;