import React, { useContext, useEffect, useState } from 'react';
import style from './style.module.css'
import { taskContext } from '../../..';
import { Descriptions, Input } from 'antd';
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
                isValid: task.condition.params ? validateParam(task.condition.params[param.name], param.validationMask) : false
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
        const isValid = validateParam(value, paramDef?.validationMask);

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

    const validateParam = (value: any, validationMask: string) => {
        if (validationMask) {
            const regex = new RegExp(validationMask)
            const isValid = regex.test(value)
            return isValid
        }
        return true
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
                                status={validateParam(task.condition.params[param.name], param.validationMask) ? '' : 'error'}
                                value={task?.condition.params ? task.condition.params[param.name] : ''}
                                onChange={(e) => handleOnChangeValue(param.name, String(e.target.value))} />
                            : param.type === 'number' ?
                            <Input
                                type="number"
                                status={validateParam(task.condition.params[param.name], param.validationMask) ? '' : 'error'}
                                value={task?.condition.params ? task.condition.params[param.name] : ''}
                                onChange={(e) => handleOnChangeValue(param.name, Number(e.target.value))} />
                            : param.type === 'boolean' ?
                            <Input
                                type="checkbox"
                                checked={task?.condition?.params ? task.condition.params[param.name] : false}
                                onChange={(e) => handleOnChangeValue(param.name, e.target.checked)} />
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