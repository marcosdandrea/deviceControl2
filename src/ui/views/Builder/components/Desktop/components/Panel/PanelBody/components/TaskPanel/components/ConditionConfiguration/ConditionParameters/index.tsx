import React, { useContext, useEffect, useState } from 'react';
import style from './style.module.css'
import { taskContext } from '../../..';
import { Descriptions, Input, Select } from 'antd';
import useGetAvailableConditions from '@views/Builder/hooks/useGetAvailableConditions';
import Text from '@components/Text';
import { MdInfo } from 'react-icons/md';

const ConditionParameters = () => {
    const { task, setTask } = useContext(taskContext)
    const { availableConditions } = useGetAvailableConditions()
    const [conditionParams, setConditionParams] = useState<any[]>([])

    useEffect(() => {
        if (!availableConditions || !task) return;

        if (task.condition === null) {
            setConditionParams([])
            return;
        }

        const thisCondition = availableConditions[task?.condition?.type]
        if (!thisCondition)
            setConditionParams([])
        else{
            const params = thisCondition.params.map(param => ({
                ...param,
                isValid: task.condition.params ? validateParam(param, task.condition.params?.[param.name]) : false
            }))
            setConditionParams(params)
        }

    }, [task, availableConditions])

    if (!task?.condition || Object.keys(task.condition?.params).length === 0) 
        return (<></>)
/*         return (<div className={style.noConditionSelected}>
            <MdInfo size={30} color="var(--primary)"/>
            <Text
                ellipsis={false}
                size={14}
                style={{width: "auto", textAlign: 'center'}}
                color='white'>
                Si no selecciona una condición, la tarea se completará exitosamente una vez ejecutado el trabajo.
            </Text>
        </div>) */

    const handleOnChangeValue = (paramName: string, value: any) => {
        const paramDef = conditionParams.find(p => p.name === paramName);
        const isValid = validateParam(paramDef, value);

        // Actualiza el task primero
        setTask(prevTask => {
            const updatedParams = {
                ...prevTask.condition.params,
                [paramName]: value,
            };
            const updatedConditionParams = conditionParams.map(p =>
                p.name === paramName ? { ...p, isValid } : p
            );
            return {
                ...prevTask,
                condition: {
                    ...prevTask.condition,
                    invalidParams: updatedConditionParams.filter(p => !p.isValid).map(p => p.name),
                    params: updatedParams,
                },
            };
        });

        // Luego actualiza el estado local
        setConditionParams(prevParams =>
            prevParams.map(p =>
                p.name === paramName ? { ...p, isValid } : p
            )
        );
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
                    conditionParams.map(param => (
                        <Descriptions.Item 
                            label={param.name} 
                            key={param.id}>
                          {
                            param.type === 'string' ?
                            <Input
                                type="text"
                                status={validateParam(param, task?.condition?.params?.[param.name]) ? '' : 'error'}
                                value={task?.condition?.params ? task.condition.params[param.name] : ''}
                                onChange={(e) => handleOnChangeValue(param.name, String(e.target.value))} />
                            : param.type === 'number' ?
                            <Input
                                type="number"
                                status={validateParam(param, task?.condition?.params?.[param.name]) ? '' : 'error'}
                                value={task?.condition?.params ? task.condition.params[param.name] : ''}
                                onChange={(e) => handleOnChangeValue(param.name, Number(e.target.value))} />
                            : param.type === 'boolean' ?
                            <Input
                                type="checkbox"
                                checked={task?.condition?.params ? task.condition.params[param.name] : false}
                                onChange={(e) => handleOnChangeValue(param.name, e.target.checked)} />
                            : param.type === 'select' ?
                            <Select
                                style={{ width: '100%' }}
                                value={task?.condition?.params ? task.condition.params[param.name] : undefined}
                                onChange={(value) => handleOnChangeValue(param.name, value)}
                                status={validateParam(param, task?.condition?.params?.[param.name]) ? '' : 'error'}
                                options={param.options || []}
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


export default ConditionParameters;