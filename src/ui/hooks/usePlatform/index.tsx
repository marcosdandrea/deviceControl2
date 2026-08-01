import systemCommands from "@common/commands/system.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const usePlatform = () => {
    const { emit } = useContext(SocketIOContext);
    const [isLinux, setIsLinux] = useState<boolean | null>(null);

    const checkPlatform = async () => {
        emit(systemCommands.getIsLinux, null, (response: { isLinux: boolean }) => {
            setIsLinux(response?.isLinux ?? false);
        });
    }

    useEffect(() => {
        checkPlatform();
    }, []);

    return { isLinux };
}

export default usePlatform;
