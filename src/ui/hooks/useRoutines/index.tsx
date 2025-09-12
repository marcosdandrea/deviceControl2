import useProject from "@hooks/useProject";
import { useEffect, useState } from "react";

const useRoutines = () => {
    const { project } = useProject();
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

    return {setRoutines: handleSetRoutines, routines};
}
 
export default useRoutines;