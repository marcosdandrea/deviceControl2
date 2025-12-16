import React, { useContext, useEffect, useState, useMemo } from 'react';
import style from './style.module.css'
import { taskContext } from '../../..';
import useGetAvailableJobs from '@views/Builder/hooks/useGetAvailableJobs';
import { Descriptions, Input, Select } from 'antd';
import useProject from '@hooks/useProject';

const JobParameters = () => {
    const { task, setTask } = useContext(taskContext)
    const { availableJobs } = useGetAvailableJobs()
    const { project } = useProject({ fetchProject: false })
    const [jobParams, setJobParams] = useState<any[]>([])

    // Generar opciones de rutinas dinámicamente
    const routineOptions = useMemo(() => {
        if (!project || !project.routines) return [];
        return project.routines.map(routine => ({
            label: routine.name,
            value: routine.id
        }));
    }, [project]);

    useEffect(() => {
        if (!availableJobs || !task || !task.job?.type) return;
        const thisJob = availableJobs[task.job.type]
        if (!thisJob)
            setJobParams([])
        else {
            const params = thisJob.params.map(param => {
                // Si el parámetro es routineId, agregar las opciones de rutinas dinámicamente
                if (param.name === 'routineId') {
                    return {
                        ...param,
                        options: routineOptions,
                        isValid: task.job.params ? validateParam(param, task.job.params?.[param.name]) : false
                    };
                }
                return {
                    ...param,
                    isValid: task.job.params ? validateParam(param, task.job.params?.[param.name]) : false
                };
            });
            setJobParams(params)
        }

    }, [task, availableJobs, routineOptions])

    if (!task?.job?.params || Object.keys(task.job.params).length === 0) return (<></>)

    const handleOnChangeValue = (paramName: string, value: any) => {
        const paramDef = jobParams.find(p => p.name === paramName)
        const isValid = validateParam(paramDef, value)
        setJobParams(() => {
            const updatedJobParams = jobParams.map(p => p.name === paramName ? { ...p, isValid } : p)
            setTask({
                ...task, job: {
                    ...task.job,
                    invalidParams: updatedJobParams.filter(p => !p.isValid).map(p => p.name),
                    params: {
                        ...task.job.params,
                        [paramName]: value,
                    },
                }
            })
            return updatedJobParams
        })
    }

    const validateParam = (param: any, value: any) => {
        if (!param)
            return false

        if ((value === undefined || value === null || value === '') && param.required === false) {
            return true
        }

        if (param.options && Array.isArray(param.options)) {
            return param.options.some(option => option.value === value)
        }

        if (param.validationMask) {
            const regex = new RegExp(param.validationMask)
            return regex.test(value)
        }

        return value !== undefined && value !== null && value !== ''
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
                            label={param.easyName || param.name}
                            key={param.id}>
                            {
                                
                                param.type === 'string' ?
                                    <Input
                                        placeholder={param.description || ''}
                                        type="text"
                                        status={validateParam(param, task?.job?.params?.[param.name]) ? '' : 'error'}
                                        value={task?.job?.params ? task.job.params[param.name] : ''}
                                        onChange={(e) => handleOnChangeValue(param.name, String(e.target.value))} />
                                    : param.type === 'number' ?
                                        <Input
                                            type="number"
                                            placeholder={param.description || ''}
                                            status={validateParam(param, task?.job?.params?.[param.name]) ? '' : 'error'}
                                            value={task?.job?.params ? task.job.params[param.name] : ''}
                                            onChange={(e) => handleOnChangeValue(param.name, Number(e.target.value))} />
                                        : param.type === 'boolean' ?
                                            <Input
                                                type="checkbox"
                                                checked={task?.job?.params ? task.job.params[param.name] : false}
                                                onChange={(e) => handleOnChangeValue(param.name, Boolean(e.target.checked))} />
                                            : param.type === 'textBox' ?
                                                <Input.TextArea
                                                    placeholder={param.description || ''}
                                                    value={task?.job.params ? task.job.params[param.name] : ''}
                                                    onChange={(e) => handleOnChangeValue(param.name, String(e.target.value))} />
                                                : param.type === 'password' ?
                                                    <Input.Password
                                                        type="password"
                                                        value={task?.job.params ? task.job.params[param.name] : ''}
                                                        onChange={(e) => handleOnChangeValue(param.name, String(e.target.value))} />
                                                    : param.type === 'select' ?
                                                        <Select
                                                            style={{ width: '100%' }}
                                                            value={task?.job?.params ? task.job.params[param.name] : undefined}
                                                            onChange={(value) => handleOnChangeValue(param.name, value)}
                                                            status={validateParam(param, task?.job?.params?.[param.name]) ? '' : 'error'}
                                                            options={param.options || []}
                                                            placeholder={param.name === 'routineId' ? 'Seleccione una rutina' : 'Seleccione una opción'}
                                                        />
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