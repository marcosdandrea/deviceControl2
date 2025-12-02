import useProject from "@hooks/useProject";
import { Project } from "@src/domain/entities/project";
import React, { createContext, useEffect } from "react";

interface ConfigContextProps {
    project: Project;
    setProject: React.Dispatch<React.SetStateAction<Project | undefined>>;
    password: string;
    setPassword: React.Dispatch<React.SetStateAction<string>>;
    projectName: string;
    setProjectName: React.Dispatch<React.SetStateAction<string>>;
    passwordError?: string;
    setPasswordError?: React.Dispatch<React.SetStateAction<string>>;
    createdBy: string;
    setCreatedBy: React.Dispatch<React.SetStateAction<string>>;
    createdAt: Date;
    description?: string;
    setDescription?: React.Dispatch<React.SetStateAction<string>>;
    updatedAt: Date;
    appVersion: string;
    labelFlex?: number;
    inputFlex?: number;
    showGroupsInControlView: boolean;
}

export const configContext = createContext<ConfigContextProps | undefined>(undefined);

export const ConfigContextProvider = ({ children }) => {

    const { project, setProject } = useProject({ fetchProject: false });

    const [projectName, setProjectName] = React.useState<string>(
        project?.name || "Proyecto sin nombre"
    );

    const [password, setPassword] = React.useState<string>(
        project?.password || ""
    );
    const [passwordError, setPasswordError] = React.useState<string>("");
    const [createdBy, setCreatedBy] = React.useState<string>(
        project?.createdBy || "Desconocido"
    );
    const [createdAt, setCreatedAt] = React.useState<Date>(
        project?.createdAt ? new Date(project?.createdAt) : new Date()
    );
    const [updatedAt, setUpdatedAt] = React.useState<Date>(
        project?.updatedAt ? new Date(project?.updatedAt) : new Date()
    );
    const [appVersion, setAppVersion] = React.useState<string>(
        project?.appVersion || "1.0.0"
    );
    const [description, setDescription] = React.useState<string>(
        project?.description || ""
    );

    useEffect(() => {
        if (project) {
            setPassword(project.password || "");
            setCreatedBy(project.createdBy || "Desconocido");
            setCreatedAt(
                project.createdAt ? new Date(project.createdAt) : new Date()
            );
            setUpdatedAt(
                project.updatedAt ? new Date(project.updatedAt) : new Date()
            );
            setDescription(project.description || "");
            setProjectName(project.name || "Proyecto sin nombre");
            setAppVersion(project.appVersion || "1.0.0");
        }
    }, [project]);

    const value = {
        labelFlex: 1,
        inputFlex: 2.5,
        project,
        setProject,
        password,
        setPassword,
        passwordError,
        setPasswordError,
        createdBy,
        setCreatedBy,
        description,
        setDescription,
        createdAt,
        updatedAt,
        appVersion,
        projectName,
        setProjectName,
        showGroupsInControlView: project?.showGroupsInControlView || false,
    };

    return (
    <configContext.Provider value={value}>
        {children}
    </configContext.Provider>
    );
}