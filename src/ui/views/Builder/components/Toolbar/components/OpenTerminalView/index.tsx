import React, { useState } from "react";
import ToolbarButton from "../ToolbarButton";
import { MdTerminal } from "react-icons/md";
import { Tooltip } from "antd";
import FloatingWindow from "@components/FloatingWindow";
import Terminal from "@views/Terminal";

const OpenTerminalView = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip placement="bottom" title="Abrir ventana de terminal" arrow>
        <div>
          <ToolbarButton
            onClick={() => setOpen(true)}
            icon={<MdTerminal size={20} />}
          />
        </div>
      </Tooltip>
      {open && (
        <FloatingWindow
          title="Terminal"
          width={800}
          height={500}
          onClose={() => setOpen(false)}
        >
          <Terminal />
        </FloatingWindow>
      )}
    </>
  );
};

export default OpenTerminalView;
