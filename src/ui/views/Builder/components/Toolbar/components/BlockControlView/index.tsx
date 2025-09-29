import React from "react";
import ToolbarButton from "../ToolbarButton";
import { MdScreenLockLandscape, MdSmartScreen } from "react-icons/md";
import useBlockControl from "@hooks/useBlockControl";
import { Tooltip } from "antd";

const BlockControlView = () => {
  const { blockControlView, unblockControlView, blocked } = useBlockControl();

  const handleOnClick = () => {
    if (blocked) {
      unblockControlView();
    } else {
      blockControlView();
    }
  };

  return (
    <Tooltip placement="bottom" title={blocked ? "Desbloquear control principal" : "Bloquear control principal"} arrow>
        <div>
      <ToolbarButton
        onClick={handleOnClick}
        icon={
          blocked ? (
            <MdScreenLockLandscape size={25} color="#ff4d4f" />
          ) : (
            <MdSmartScreen size={25} />
          )
        }
      />
      </div>
    </Tooltip>
  );
};

export default BlockControlView;
