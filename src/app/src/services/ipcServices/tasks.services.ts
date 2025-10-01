import { nanoid } from "nanoid"

export const getTaskTemplate = (_arg: any, callback: Function) => {

    const defaultTask = {
        id: nanoid(8),
        name: '',
        description: '',
        retries: process.env.TASK_RETRY_ATTEMPTS ? parseInt(process.env.TASK_RETRY_ATTEMPTS) : 3,
        waitBeforeRetry: process.env.TASK_RETRY_DELAY_MS ? parseInt(process.env.TASK_RETRY_DELAY_MS) : 5000,
        timeout: process.env.TASK_DEFAULT_TIMEOUT_MS ? parseInt(process.env.TASK_DEFAULT_TIMEOUT_MS) : 60000,
        job: null,
        condition: null,
    }   
    callback?.(defaultTask)
}


export default {
    getTaskTemplate
}