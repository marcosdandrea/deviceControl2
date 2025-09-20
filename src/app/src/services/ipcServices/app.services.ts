import { getConditionTypes } from "@src/domain/entities/conditions/types"
import { getJobTypes } from "@src/domain/entities/job/types"
import { getTriggerTypes } from "@src/domain/entities/trigger/types"
import {Log} from "@src/utils/log"
const log = new Log("AppServices", true)

const getAvailableTriggers = async (_args: any, callback: Function) => {
    const triggerClasses = getTriggerTypes()
    let triggers: Record<string, any> = {}

    for (const [key, modulePromise] of Object.entries(await triggerClasses)) {
        const module = await modulePromise
        triggers[key] = {
            easyName: module.default.easyName,
            moduleDescription: module.default.moduleDescription,
            disableRearming: module.default.disableRearming,
            params: module.default.prototype.requiredParams(),
        }
    }
    callback?.(triggers)
    return triggers


}

const getAvailableJobs = async (_args: any, callback: Function) => {
    const jobClasses = await getJobTypes()
    let jobs: Record<string, any> = {}

    for (const [key, modulePromise] of Object.entries(jobClasses)) {
        try {
            const module = await modulePromise
            jobs[key] = {
                name: module.default.name,
                description: module.default.description || "",
                params: module.default.prototype.requiredParams(),
            }
        } catch (error) {
            log.error(`Error loading job type ${key}: ${(error as Error).message}`)
        }
    }
    callback?.(jobs)
    return jobs
}

const getAvailableConditions = async (_args: any, callback: Function) => {
    const conditionClasses = await getConditionTypes()
    let conditions: Record<string, any> = {}

    for (const [key, modulePromise] of Object.entries(conditionClasses)) {
        const module = await modulePromise
        conditions[key] = {
            name: module.default.name,
            description: module.default.description || "",
            params: module.default.prototype.requiredParams(),
        }
    }
    callback?.(conditions)
    return conditions
}



export default { getAvailableTriggers, getAvailableJobs, getAvailableConditions }