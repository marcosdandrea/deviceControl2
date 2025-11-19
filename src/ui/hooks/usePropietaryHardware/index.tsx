import systemCommands from "@common/commands/system.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const usePropietaryHardware = () => {
    const {emit} = useContext(SocketIOContext)
    const [isSignedHardware, setIsSignedHardware] =  useState<boolean | null>(null);

    const checkSignedHardware = async () => {
        emit(systemCommands.getIsSignedHardware, null, (response) => {
            setIsSignedHardware(response);
        });
    }

    useEffect(() => {
        checkSignedHardware();
    }, []);

    return {isSignedHardware};
}
 
export default usePropietaryHardware;