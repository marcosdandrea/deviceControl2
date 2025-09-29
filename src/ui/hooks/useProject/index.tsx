import { projectType } from "@common/types/project.types";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect } from "react";
import { Logger } from "@helpers/logger";
import projectCommands from "@common/commands/project.commands";
import projectEvents from "@common/events/project.events";
import { ProjectContext } from "@contexts/projectContextProvider";

const useProject = (params: { fetchProject?: boolean }) => {
  const { socket, emit } = useContext(SocketIOContext);
  const {
    project,
    setProject: setProjectInContext,
    unsavedChanges,
    setUnsavedChanges,
  } = useContext(ProjectContext);

  const setProject = (
    value:
      | ((prev: projectType | null) => projectType | null)
      | (projectType | null)
  ) => {
    setProjectInContext((prev) => {
      const updatedProject =
        typeof value === "function"
          ? (value as (prev: projectType | null) => projectType | null)(prev)
          : value;
      return updatedProject
        ? { ...updatedProject, modifiedAt: new Date().toISOString() }
        : updatedProject;
    });
    setUnsavedChanges(true);
  };

  useEffect(() => {
    if (!socket) return;

    const updateProject = ({
      projectData,
      error,
    }: {
      projectData: projectType;
      error?: string;
    }) => {
      if (error) Logger.error("Error fetching project:", error);
      else if (!projectData) {
        Logger.warn("No project data found");
        setProject(null);
      } else {
        Logger.log("Project data loaded:", projectData);
        setProject(projectData);
      }
      setUnsavedChanges(false);
    };

    const handleOnProjectChanged = (payload) => {
      Logger.log("Project changed:", payload);
      updateProject(payload);
    };

    const handleOnGetProject = (payload) => {
      Logger.log("Project fetched:", payload);
      updateProject(payload);
    };

    const handleOnProjectLoaded = (payload) => {
      Logger.log("Project loaded:", payload);
      updateProject(payload);
    };

    const handleOnProjectClosed = (payload) => {
      Logger.log("Project closed:", payload);
      updateProject({ projectData: null });
    };

    if (params?.fetchProject)
      emit(projectCommands.getCurrent, null, handleOnGetProject);

    socket.on(projectEvents.changed, handleOnProjectChanged);
    socket.on(projectEvents.loaded, handleOnProjectLoaded);
    socket.on(projectEvents.closed, handleOnProjectClosed);

    return () => {
      socket.off(projectEvents.changed, handleOnProjectChanged);
      socket.off(projectEvents.loaded, handleOnProjectLoaded);
      socket.off(projectEvents.closed, handleOnProjectClosed);
    };
  }, [socket]);

  const createNewProject = async () => {
    if (!socket) return;

    return new Promise<void>((resolve, reject) => {
      emit(
        projectCommands.create,
        null,
        (response: {
          success?: boolean;
          error?: string;
          projectData?: projectType;
        }) => {
          if (response.error) {
            reject(new Error(response.error));
            Logger.error("Error creating new project:", response.error);
          } else {
            if (response.projectData) {
              setProject(response.projectData);
              setUnsavedChanges(false);
            }
            resolve();
          }
        }
      );
    });
  };

  const loadProjectFile = async (fileData: ArrayBuffer | String) => {
    if (!socket) return;

    emit(
      projectCommands.loadProjectFile,
      fileData,
      (response: {
        success?: boolean;
        error?: string;
        project?: projectType;
      }) => {
        if (response.error) {
          Logger.error("Error loading project file:", response.error);
        }
      }
    );

    return;
  };

  const loadProject = async (projectData: string) => {
    if (!socket) return;

    emit(
      projectCommands.load,
      projectData,
      (response: { success?: boolean; error?: string }) => {
        if (response.error) {
          Logger.error("Error loading project:", response.error);
        }
      }
    );
  };

  const unloadProject = async () => {
    return new Promise<void>((resolve, reject) => {
      if (!socket) return;

      emit(
        projectCommands.close,
        null,
        (response: { success?: boolean; error?: string }) => {
          if (response.error) {
            reject(new Error(response.error));
            Logger.error("Error unloading project:", response.error);
          } else {
            setProjectInContext(null);
            setUnsavedChanges(false);
            resolve();
          }
        }
      );
    });
  };

  const getProjectFile = async (): Promise<string | null> => {
    if (!socket) return;

    return new Promise<string | null>((resolve, reject) => {
      const handleOnGetProject = ({
        projectFile,
        error,
      }: {
        projectFile: string;
        error?: string;
      }) => {
        if (error) {
          Logger.error("Error fetching project:", error);
          reject(new Error("Error fetching project file"));
        } else if (!projectFile) {
          Logger.warn("No project data found");
          reject(new Error("No project data found"));
        } else {
          resolve(projectFile);
        }
      };

      emit(projectCommands.getProjectFile, null, handleOnGetProject);
    });
  };

  return {
    project,
    setProject,
    loadProject,
    loadProjectFile,
    unloadProject,
    getProjectFile,
    createNewProject,
    unsavedChanges,
  };
};

export default useProject;
