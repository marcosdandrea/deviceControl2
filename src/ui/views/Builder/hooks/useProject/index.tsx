import SocketChannels from "@common/SocketChannels";
import { projectType } from "@common/types/project.types";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const useProject = () => {
    const { socket, emit } = useContext(SocketIOContext);

    console.log("Esperando proyecto...");

    const [project, setProject] = useState<projectType | null>(null);

    useEffect(() => {
        if (!socket) return;

        socket.on(SocketChannels.getCurrentProject, (data) => {
            if (data.error)
                console.error("Error fetching project:", data.error);
            else
                setProject(data);
        });

        emit(SocketChannels.getCurrentProject);

        return () => {
            socket.off(SocketChannels.getCurrentProject);
        };
    }, [socket]);

    return ({ project });
}

export default useProject;
