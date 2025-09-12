import React, { useContext } from 'react';
import style from './style.module.css'
import { Input, Select } from 'antd';
import { taskContext } from '../../..';
import useGetAvailableConditions from '@views/Builder/hooks/useGetAvailableConditions';

const ConditionTypeSelector = () => {
    const { task, setTask } = useContext(taskContext)
    const { availableConditions } = useGetAvailableConditions()

    const handleOnChangeConditionType = (value: string) => {
        const thisCondition = availableConditions[value]
        if (!thisCondition) {
            setTask({
                ...task,
                condition: null,
            })
            return;
        }
        const params = thisCondition.params.map(param => ({ [param.name]: undefined }))
        setTask({
            ...task, condition: {
                type: value,
                params: Object.assign({}, ...params),
                invalidParams: thisCondition.params.map(p => p.name)
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
                    value={task?.condition == null ? "unset" : task?.condition.type}
                    status={task?.condition?.type == "" ? 'error' : ''}
                    onChange={handleOnChangeConditionType}
                    placeholder="Seleccione un trabajo">
                    {
                        Object.keys(availableConditions).map(conditionKey => (
                            <Select.Option key={conditionKey} value={conditionKey}>
                                {availableConditions[conditionKey].name}
                            </Select.Option>
                        ))
                    }
                    <Select.Option key={"unset"} value={"unset"}>
                        Sin condición
                    </Select.Option>
                </Select>
            </Input.Group>
        </div>
    );
}

export default ConditionTypeSelector;