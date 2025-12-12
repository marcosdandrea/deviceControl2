import React from "react";
import ToolbarButton from "../ToolbarButton";
import { MdOutlineClose } from "react-icons/md";
import useProject from "@hooks/useProject";
import { Popconfirm, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import { Logger } from "@helpers/logger";

const CloseProjectButton = () => {
  const navigate = useNavigate();
  const { unloadProject, project, unsavedChanges } = useProject({
    fetchProject: false,
  });

  const handleOnCloseProject = async () => {
    try {
      unloadProject();
      navigate("/builder");
    } catch (error) {
      Logger.error("Error closing project:", error);
    }
  };

  return (
    <Tooltip placement="bottom" title="Cerrar proyecto" arrow>
      <div>
        <Popconfirm
          onConfirm={handleOnCloseProject}
          title={
            unsavedChanges
              ? "Tienes cambios sin aplicar. ¿Estás seguro de que quieres cerrar el proyecto?"
              : "¿Estás seguro de que quieres cerrar el proyecto?"
          }
        >
          <ToolbarButton
            disabled={!project}
            icon={<MdOutlineClose size={20} />}
            onClick={() => {}}
          />
        </Popconfirm>
      </div>
    </Tooltip>
  );
};

export default CloseProjectButton;
