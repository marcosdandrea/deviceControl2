import appCommands from "@common/commands/app.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import { message } from "antd";
import { useContext, useEffect, useState } from "react";

const useBlockControl = () => {
  const { socket } = useContext(SocketIOContext);
  const [blocked, setBlocked] = useState(false);

  const handleOnBlockControl = () => {
    setBlocked(true);
  };

  const handleOnUnblockControl = () => {
    setBlocked(false);
  };

  useEffect(() => {
    if (!socket) return;
    socket.on(appCommands.blockMainControl, handleOnBlockControl);
    socket.on(appCommands.unblockMainControl, handleOnUnblockControl);

    return () => {
      socket.off(appCommands.blockMainControl);
      socket.off(appCommands.unblockMainControl);
    };
  }, [socket]);

  const blockControlView = () => {
    socket.emit(appCommands.blockMainControl, null, (response: any) => {
      if (response?.success) {
        setBlocked(true);
        message.success("El control ha sido bloqueado");
      }
    });
  };

  const unblockControlView = () => {
    socket.emit(appCommands.unblockMainControl, null, (response: any) => {
      if (response?.success) {
        setBlocked(false);
        message.success("El control ha sido desbloqueado");
      }
    });
  };

  return { blocked, blockControlView, unblockControlView };
};

export default useBlockControl;
