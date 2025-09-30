import React, { useContext } from 'react';
import style from './style.module.css'
import useGetAvailableJobs from '@views/Builder/hooks/useGetAvailableJobs';
import { Input, Select } from 'antd';
import { taskContext } from '../../..';

const JobTypeSelector = () => {
    const { task, setTask } = useContext(taskContext)
    const { availableJobs } = useGetAvailableJobs()

    const handleOnChangeJobType = (value: string) => {
        const thisJob = availableJobs[value]
        const params = thisJob.params.map(param => ({ [param.name]: param.defaultValue || undefined }))
        const invalidParams = thisJob.params.filter(param => param.required).map(param => param.name)
        console.log (params)
        setTask({
            ...task,
            job: {
                ...task.job,
                type: value,
                params: Object.assign({}, ...params),
                invalidParams
            }
        })
    }

    return (
        <div className={style.jobTypeSelector}>
            <Input.Group compact>
                <Input
                    style={{
                        width: '80px',
                        color: "var(--text-secondary)",
                        backgroundColor: "var(--component-interactive)",
                        pointerEvents: 'none',
                        borderRight: 0,
                    }}
                    value="Tipo"
                    readOnly
                    tabIndex={-1}
                />
                <Select
                    style={{ width: 'calc(100% - 80px)' }}
                    value={task?.job.type}
                    status={task?.job.type == "" ? 'error' : ''}
                    onChange={handleOnChangeJobType}
                    placeholder="Seleccione un trabajo">
                    {
                        Object.keys(availableJobs).map(jobKey => (
                            <Select.Option key={jobKey} value={jobKey}>
                                {availableJobs[jobKey].name}
                            </Select.Option>
                        ))
                    }
                </Select>
            </Input.Group>
        </div>
    );
}

export default JobTypeSelector;