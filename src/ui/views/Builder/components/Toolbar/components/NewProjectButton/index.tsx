import React from "react";
import ToolbarButton from "../ToolbarButton";
import useProject from "@hooks/useProject";
import { Popconfirm, Tooltip } from "antd";
import { HiDocument } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { Logger } from "@helpers/logger";


const NewProjectButton = () => {

    const { unloadProject, project, unsavedChanges, createNewProject } = useProject({ fetchProject: false });
    const navigate = useNavigate()

    const handleOnCreateNewProject = async () => {
        try {
            // Load a new default project
            await unloadProject();
            navigate("/builder")
            const project = await createNewProject()
            navigate(`/builder/${project?.groups[0].id}`)
        } catch (error) {
            Logger.error("Error closing project:", error);
        }
    }

    return (
        <Tooltip placement="bottom" title="Crear nuevo proyecto" arrow>
            <Popconfirm
                disabled={!project}
                onConfirm={handleOnCreateNewProject}
                title={project && unsavedChanges
                    ? "Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar el proyecto?"
                    : "¿Estás seguro de que quieres cerrar el proyecto?"}>
                <ToolbarButton
                    icon={<HiDocument size={20}/>}
                    onClick={!project ? handleOnCreateNewProject : undefined} />
            </Popconfirm>
        </Tooltip>
    );
}

export default NewProjectButton;
