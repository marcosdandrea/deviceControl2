import React, { useState } from "react";
import ToolbarButton from "../ToolbarButton";
import { FaTimeline } from "react-icons/fa6";
import useProject from "@hooks/useProject";
import { Tooltip } from "antd";
import FloatingWindow from "@components/FloatingWindow";
import Executions from "@views/Executions";

const ExecutionsTimelineButton = () => {
  const { project } = useProject({ fetchProject: false });
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip
        placement="bottom"
        title="Abrir línea de tiempo de ejecuciones"
        arrow
      >
        <div>
          <ToolbarButton
            disabled={!project}
            onClick={() => setOpen(true)}
            icon={<FaTimeline style={{ rotate: "90deg" }} size={20} />}
          />
        </div>
      </Tooltip>
      {open && (
        <FloatingWindow
          title="Línea de Tiempo de Ejecuciones"
          width={Math.round(window.innerWidth * 0.8)}
          height={Math.round(window.innerHeight * 0.8)}
          onClose={() => setOpen(false)}
        >
          <Executions />
        </FloatingWindow>
      )}
    </>
  );
};

export default ExecutionsTimelineButton;
