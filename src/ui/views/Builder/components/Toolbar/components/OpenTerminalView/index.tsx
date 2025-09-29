import React from "react";
import ToolbarButton from "../ToolbarButton";
import { MdTerminal } from "react-icons/md";
import { Tooltip } from "antd";

const OpenTerminalView = () => {
  const handleOnClick = () => {
    window.open(
      "/terminal",
      "terminalWindow",
      "width=800,height=500,location=no"
    );
  };

  return (
    <Tooltip placement="bottom" title="Abrir ventana de terminal" arrow>
      <div>
        <ToolbarButton
          onClick={handleOnClick}
          icon={<MdTerminal size={20} />}
        />
      </div>
    </Tooltip>
  );
};

export default OpenTerminalView;
