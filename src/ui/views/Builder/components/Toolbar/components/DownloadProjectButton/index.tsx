import React from "react";
import ToolbarButton from "../ToolbarButton";
import { MdOutlineSaveAlt } from "react-icons/md";
import useProject from "@hooks/useProject";
import { HiDocumentArrowDown } from "react-icons/hi2";
import { Popconfirm, Tooltip } from "antd";
import { Logger } from "@helpers/logger";

const DownloadProjectButton = () => {
  const { getProjectFile, loadProjectFile, project, unsavedChanges } =
    useProject({ fetchProject: false });

  const handleOnDownload = async () => {
    try {
      if (!project) return;
      if (unsavedChanges) await loadProjectFile(project);
      const projectContent = await getProjectFile();
      if (projectContent) {
        const blob = new Blob([projectContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${project.name}.dc2`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      Logger.error("Error downloading project:", error);
    }
  };

  return (
    <Tooltip placement="bottom" title="Descargar copia del proyecto actual" arrow>
      <>
        <Popconfirm
          disabled={!unsavedChanges}
          onConfirm={handleOnDownload}
          title={
            "Debes aplicar los cambios antes de descargar el proyecto. ¿Quieres continuar?"
          }
        >
          <ToolbarButton
            disabled={!project}
            icon={<HiDocumentArrowDown size={20} />}
            onClick={handleOnDownload}
          />
        </Popconfirm>
      </>
    </Tooltip>
  );
};

export default DownloadProjectButton;
