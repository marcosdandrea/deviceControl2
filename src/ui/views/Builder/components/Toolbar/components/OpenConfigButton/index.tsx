// OpenConfigButton.tsx
import React, { useState } from "react";
import ToolbarButton from "../ToolbarButton";
import { FaGear } from "react-icons/fa6";
import PopoutWindow from "@components/PopUpWindow";
import Configuration from "@views/Configuration";
import { Tooltip } from "antd";


const OpenConfigButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip placement="bottom" title="Abrir configuración del proyecto" arrow>
        <div>
          <ToolbarButton
            icon={<FaGear size={15} />}
            onClick={() => setOpen(true)}
          />
        </div>
      </Tooltip>
      {open && (
        <PopoutWindow
          title="Configuración del Proyecto"
          features="width=900,height=650,left=200,top=100,resizable=yes"
          onClose={() => setOpen(false)}
        >
          {/* pasás la función de cerrar */}
          <Configuration onSaved={() => setOpen(false)} />
        </PopoutWindow>
      )}
    </>
  );
};

export default OpenConfigButton;