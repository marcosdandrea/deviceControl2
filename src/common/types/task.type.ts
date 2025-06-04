import { description, id, name } from "./commons.type";
import { ConditionInterface, ConditionType } from "./condition.type";
import { JobInterface, JobType } from "./job.type";

export type TaskType = {
    id?: id;
    name: name;
    description?: description;
    job?: JobType | null;
    condition?: ConditionType | null;
    retries?: number;
    failed?: boolean;
    aborted?: boolean;
    waitBeforeRetry?: number;
    continueOnError?: boolean;
    checkConditionBeforeExecution?: boolean;
}

export interface TaskInterface extends TaskType {
    job?: JobInterface;
    condition?: ConditionInterface | null;
    setJob: (job: JobInterface) => void;
    setCondition: (condition: ConditionInterface | null) => void;
    setRetries: (retries: number) => void;
    setWaitBeforeRetry: (waitBeforeRetry: number) => void;
    setContinueOnError: (continueOnError: boolean) => void;
    run: ({ abortSignal }: { abortSignal: AbortSignal }) => Promise<void>;
    toJson: () => TaskType;
}