import React, { useContext, useEffect, useState } from 'react';
import style from './style.module.css'
import { taskContext } from '../../..';
import useGetAvailableJobs from '@views/Builder/hooks/useGetAvailableJobs';
import { Descriptions, Input } from 'antd';

const JobParameters = () => {
    const { task, setTask } = useContext(taskContext)
    const { availableJobs } = useGetAvailableJobs()
    const [jobParams, setJobParams] = useState<any[]>([])

    useEffect(() => {
        if (!availableJobs || !task) return;
        const thisJob = availableJobs[task.job.type]
        if (!thisJob)
            setJobParams([])
        else{
            const params = thisJob.params.map(param => ({
                ...param,
                isValid: task.job.params ? validateParam(task.job.params[param.name], param.validationMask) : false
            }))
            setJobParams(params)
        }

    }, [task, availableJobs])

        if (!task || Object.keys(task.job.params).length === 0) return (<></>)

    const handleOnChangeValue = (paramName: string, value: any) => {
        const isValid = validateParam(value, jobParams.find(p => p.name === paramName)?.validationMask)
        setJobParams(()=>{
            const updatedJobParams = jobParams.map(p => p.name === paramName ? { ...p, isValid } : p)
            setTask({ ...task, job: { 
                ...task.job, 
                invalidParams: updatedJobParams.filter(p => !p.isValid).map(p => p.name) ,
                params: { 
                    ...task.job.params, 
                    [paramName]: value , 
                },  
            } })
            return updatedJobParams
        })
    }

    const validateParam = (value: any, validationMask: string) => {
        if (validationMask) {
            const regex = new RegExp(validationMask)
            const isValid = regex.test(value)
            return isValid
        }
    }

    return (
        <div className={style.jobParameters}>
            <Descriptions
                column={1}
                bordered
                size='small'
                style={{ width: '100%' }}>
                {
                    jobParams.map(param => (
                        <Descriptions.Item 
                            label={param.name} 
                            key={param.id}>
                          {
                            param.type === 'string' ?
                            <Input
                                type="text"
                                status={validateParam(task.job.params[param.name], param.validationMask) ? '' : 'error'}
                                value={task?.job.params ? task.job.params[param.name] : ''}
                                onChange={(e) => handleOnChangeValue(param.name, String(e.target.value))} />
                            : param.type === 'number' ?
                            <Input
                                type="number"
                                status={validateParam(task.job.params[param.name], param.validationMask) ? '' : 'error'}
                                value={task?.job?.params ? task.job.params[param.name] : ''}
                                onChange={(e) => handleOnChangeValue(param.name, Number(e.target.value))} />
                            : param.type === 'boolean' ?
                            <Input
                                type="checkbox"
                                checked={task?.job?.params ? task.job.params[param.name] : false}
                                onChange={(e) => handleOnChangeValue(param.name, Boolean(e.target.checked))} />
                            : <span>Tipo no soportado</span>
                          }
                        </Descriptions.Item>
                    ))
                }
            </Descriptions>
        </div>
    );
}


export default JobParameters;