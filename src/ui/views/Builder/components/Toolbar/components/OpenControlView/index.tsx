import React, { useState } from "react";
import ToolbarButton from "../ToolbarButton";
import { MdOutlineViewList } from "react-icons/md";
import { Tooltip } from "antd";
import FloatingWindow from "@components/FloatingWindow";
import Control from "@views/Control";

const OpenControlView = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip placement="bottom" title="Abrir vista previa de control" arrow>
        <div>
          <ToolbarButton
            onClick={() => setOpen(true)}
            icon={<MdOutlineViewList size={20} />}
          />
        </div>
      </Tooltip>
      {open && (
        <FloatingWindow
          title="Vista Previa de Control"
          width={800}
          height={500}
          onClose={() => setOpen(false)}
        >
          <Control isPreview={true} />
        </FloatingWindow>
      )}
    </>
  );
};

export default OpenControlView;
