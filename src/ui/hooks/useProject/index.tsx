import SocketChannels from "@common/SocketChannels";
import { projectType } from "@common/types/project.types";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";
import { Logger } from "@helpers/logger";

const useProject = () => {
    const { socket, emit } = useContext(SocketIOContext);

    const [project, setProject] = useState<projectType | null>(null);

    useEffect(() => {
        if (!socket) return;

        socket.on(SocketChannels.updateProject, ({projectData, error}: {projectData: string, error?: string }) => {
            if (error)
                Logger.error("Error fetching project:", error);
            else{
                const project = JSON.parse(projectData) as projectType;
                setProject(project);
            }
        });

        emit(SocketChannels.getCurrentProject);

        return () => {
            socket.off(SocketChannels.getCurrentProject);
        };
    }, [socket]);

    const loadProject = async (projectData: projectType) => {
        if (!socket) return;

        emit(SocketChannels.loadProject, projectData, (response: { success?: boolean; error?: string, project?: projectType }) => {
            if (response.error) {
                Logger.error("Error loading project:", response.error);
            } 
        });
        return;
    }

    return ({ project, loadProject });
}

export default useProject;
