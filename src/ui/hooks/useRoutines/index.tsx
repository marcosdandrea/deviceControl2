import routineCommands from "@common/commands/routine.commands";
import { RoutineType } from "@common/types/routine.type";
import { SocketIOContext } from "@components/SocketIOProvider";
import useProject from "@hooks/useProject";
import { message } from "antd";
import e from "cors";
import { useContext, useEffect, useState } from "react";

const useRoutines = () => {
    const {emit} = useContext(SocketIOContext)
    const { project } = useProject({fetchProject: false});
    const [routines, updateRoutines] = useState(project?.routines || []);

    useEffect(()=>{
        if (project) {
            updateRoutines(project.routines || []);
        }
    },[project])

    const handleSetRoutines = (routines: any[]) => {
        console.log ('Setting routines', routines);
        updateRoutines(routines);   
        if (project) {
            project.routines = routines;
        }
    }

    const getRoutineTemplate = (callback: (routineTemplate: RoutineType) => void) => {
        emit(routineCommands.getRoutineTemplate, null, (routineTemplate : RoutineType) => {
            console.log('Received routine template', routineTemplate);
            callback(routineTemplate);
        });
    }

    return {setRoutines: handleSetRoutines, routines, getRoutineTemplate};
}
 
export default useRoutines;