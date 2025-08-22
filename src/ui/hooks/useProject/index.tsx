import { projectType } from "@common/types/project.types";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";
import { Logger } from "@helpers/logger";
import projectCommands from "@common/commands/project.commands";
import projectEvents from "@common/events/project.events";

const useProject = () => {
    const { socket, emit } = useContext(SocketIOContext);

    const [project, setProject] = useState<projectType | null>(null);

    useEffect(() => {
        if (!socket) return;

        const updateProject = ({ projectData, error }: { projectData: projectType, error?: string }) => {
            if (error)
                Logger.error("Error fetching project:", error);
            else if (!projectData) {
                Logger.warn("No project data found");
                setProject(null);
            }
            else {
                Logger.log("Project data loaded:", projectData);
                setProject(projectData);
            }
        }

        const handleOnProjectChanged = (payload) => {
            Logger.log("Project changed:", payload);
            updateProject(payload);
        }

        const handleOnGetProject = (payload) => {
            Logger.log("Project fetched:", payload);
            updateProject(payload);
        }

        const handleOnProjectLoaded = (payload) => {
            Logger.log("Project loaded:", payload);
            updateProject(payload);
        }

        const handleOnProjectClosed = (payload) => {
            Logger.log("Project closed:", payload);
            updateProject({ projectData: null });
        }

        emit(projectCommands.getCurrent, null, handleOnGetProject);

        socket.on(projectEvents.changed, handleOnProjectChanged);
        socket.on(projectEvents.loaded, handleOnProjectLoaded);
        socket.on(projectEvents.closed, handleOnProjectClosed);

        return () => {
            socket.off(projectEvents.changed, handleOnProjectChanged);
            socket.off(projectEvents.loaded, handleOnProjectLoaded);
            socket.off(projectEvents.closed, handleOnProjectClosed);
        }

    }, [socket]);

    const loadProject = async (projectData: projectType) => {
        if (!socket) return;

        emit(projectCommands.load, projectData, (response: { success?: boolean; error?: string, project?: projectType }) => {
            if (response.error) {
                Logger.error("Error loading project:", response.error);
            }
        });
        return;
    }

    const unloadProject = async () => {
        if (!socket) return;

        emit(projectCommands.close, (response: { success?: boolean; error?: string }) => {
            if (response.error) {
                Logger.error("Error unloading project:", response.error);
            }
        });
        return;
    }

    return ({ project, loadProject, unloadProject });
}

export default useProject;
