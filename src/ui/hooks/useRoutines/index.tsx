import routineCommands from "@common/commands/routine.commands";
import { RoutineType } from "@common/types/routine.type";
import { SocketIOContext } from "@components/SocketIOProvider";
import useProject from "@hooks/useProject";
import { message } from "antd";
import e from "cors";
import { useContext, useEffect, useState, useCallback } from "react";
import { Logger } from "@helpers/logger";

const useRoutines = () => {
    const {emit} = useContext(SocketIOContext)
    const { project } = useProject({fetchProject: false});
    const [routines, updateRoutines] = useState(project?.routines || []);

    useEffect(()=>{
        if (project) {
            updateRoutines(project.routines || []);
        }
    },[project])

    const handleSetRoutines = useCallback((routines: any[]) => {
        Logger.log ('Setting routines', routines);
        updateRoutines(routines);   
        if (project) {
            project.routines = routines;
        }
    }, [project]);

    const getRoutineTemplate = useCallback((callback: (routineTemplate: RoutineType) => void) => {
        emit(routineCommands.getRoutineTemplate, null, (routineTemplate : RoutineType) => {
            Logger.log('Received routine template', routineTemplate);
            callback(routineTemplate);
        });
    }, [emit]);

    return {setRoutines: handleSetRoutines, routines, getRoutineTemplate};
}
 
export default useRoutines;