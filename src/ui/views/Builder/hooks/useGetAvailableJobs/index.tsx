import appCommands from "@common/commands/app.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";
import { JobType } from "@common/types/job.type";

const useGetAvailableJobs = () => {
    const {emit} = useContext(SocketIOContext)
    const [availableJobs, setAvailableJobs] = useState<JobType[]>([]);

    const getAvailableJobs = () => {
        emit(appCommands.getJobTypes, null, (jobs: JobType[]) => {
            setAvailableJobs(jobs);
        });
    }

    useEffect(() => {
        getAvailableJobs();
    }, []);

    return { availableJobs };
}
 
export default useGetAvailableJobs;