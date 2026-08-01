// OpenConfigButton.tsx
import React, { useState } from "react";
import ToolbarButton from "../ToolbarButton";
import { FaGear } from "react-icons/fa6";
import FloatingWindow from "@components/FloatingWindow";
import Configuration from "@views/Configuration";
import { Badge, Tooltip } from "antd";
import useUpdates from "@hooks/useUpdates";


const OpenConfigButton = () => {
  const [open, setOpen] = useState(false);
  const { status } = useUpdates();

  return (
    <>
      <Tooltip
        placement="bottom"
        title={status?.updateAvailable
          ? `Abrir configuración del proyecto (actualización v${status.latestVersion} disponible)`
          : "Abrir configuración del proyecto"}
        arrow>
        <Badge
          size="default"
          status="processing"
          color="var(--secondary)"
          count={status?.updateAvailable ? 1 : 0}
          dot>
          <ToolbarButton
            icon={<FaGear size={15} />}
            onClick={() => setOpen(true)}
          />
        </Badge>
      </Tooltip>
      {open && (
        <FloatingWindow
          title="Configuración del Proyecto"
          onClose={() => setOpen(false)}
        >
          <Configuration onSaved={() => setOpen(false)} />
        </FloatingWindow>
      )}
    </>
  );
};

export default OpenConfigButton;