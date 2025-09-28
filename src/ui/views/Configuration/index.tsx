import React, { createContext, useEffect } from "react";
import style from "./style.module.css";
import PasswordField from "./components/Password";
import { ConfigProvider, theme } from "antd";
import ProjectAppVersion from "./components/ProjectAppVersion";
import useProject from "@hooks/useProject";
import CreatedBy from "./components/CreatedBy";
import Description from "./components/Description";
import ProjectName from "./components/ProjectName";
import LastModified from "./components/LastModified";
import CreatedAt from "./components/CreatedAt";
import Footer from "./components/Footer";
import { Project } from "@src/domain/entities/project";

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
}

export const configContext = createContext<ConfigContextProps | undefined>(
  undefined
);

const Configuration = ({onSaved}) => {
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

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
      }}
    >
      <configContext.Provider
        value={{
          labelFlex: 1,
          inputFlex: 4,
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
        }}
      >
        <div className={style.configurationView}>
          <div className={style.body}>
          <ProjectAppVersion />
          <ProjectName />
          <Description />
          <CreatedBy />
          <CreatedAt />
          <LastModified />
          <PasswordField />
          </div>
          <Footer onSaved={onSaved} />
        </div>
      </configContext.Provider>
    </ConfigProvider>
  );
};

export default Configuration;
