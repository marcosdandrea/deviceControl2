import appCommands from "@common/commands/app.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const useGetAvailableJobs = () => {
    const {emit} = useContext(SocketIOContext)
    const [availableJobs, setAvailableJobs] = useState<string[]>([]);

    const getAvailableJobs = () => {
        emit(appCommands.getJobTypes, null, (jobs: string[]) => {
            setAvailableJobs(jobs);
        });
    }

    useEffect(() => {
        getAvailableJobs();
    }, []);

    return { availableJobs };
}
 
export default useGetAvailableJobs;