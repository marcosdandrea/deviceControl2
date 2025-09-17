import React from "react";
import ToolbarButton from "../ToolbarButton";
import useProject from "@hooks/useProject";
import { Popconfirm } from "antd";
import { HiDocument } from "react-icons/hi";
import { projectType } from "@common/types/project.types";
import { nanoid } from "nanoid";
import { useNavigate } from "react-router-dom";

const defaultProject = {
    id:nanoid(10),
    appVersion:"2.0.0",
    name:`Proyecto sin título`,
    description:"",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    password:null,
    routines:[],
    triggers:[],
    tasks:[]
} as unknown as projectType

const NewProjectButton = () => {

    const { unloadProject, setProject, project, unsavedChanges } = useProject({ fetchProject: false });
    const navigate = useNavigate()

    const handleOnCloseProject = async () => {
        try {
            // Load a new default project
            await unloadProject();
            navigate("/builder")
            setProject(defaultProject);
        } catch (error) {
            console.error("Error closing project:", error);
        }
    }

    return (
        <Popconfirm
            disabled={!project}
            onConfirm={handleOnCloseProject}
            title={project && unsavedChanges
                ? "Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar el proyecto?"
                : "¿Estás seguro de que quieres cerrar el proyecto?"}>
            <ToolbarButton
            icon={<HiDocument size={20}/>}
            onClick={!project ? handleOnCloseProject : undefined} />
            </Popconfirm >
    );
}

export default NewProjectButton;
