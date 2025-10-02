import React, { useContext } from 'react';
import { Descriptions as AntdDescriptions, Button, Input, InputNumber, Switch } from 'antd';
import { routineConfigurationContext } from '../..';
import InfoIcon from '@components/InfoIcon';

const Descriptions = () => {
    const {routine, setRoutine} = useContext(routineConfigurationContext)

    const handleOnChangeEnable = (checked) => {
        setRoutine({...routine, enabled: checked})
    }

    const handleOnChangeSync = (checked) => {
        setRoutine({...routine, runInSync: !checked})
    }

    const handleOnChangeContinueOnError = (checked) => {
        setRoutine({...routine, continueOnError: checked})
    }

    const handleOnChangeShowInControlView = (checked) => {
        setRoutine({...routine, hidden: checked})
    }

    const handleOnChangeCheckConditions = (value) => {
        setRoutine({...routine, autoCheckConditionEveryMs: value === 0 ? false : value})
    }

    const enableAutoCheckConditions = () => {
        setRoutine({...routine, autoCheckConditionEveryMs: 10000})
    }

    const handleOnChangeTimeout = (value) => {
        setRoutine({...routine, routineTimeout: value})
    }

    return (
        <div style={{ overflow: 'auto', flexGrow: 1 }}>
        <AntdDescriptions 
            title="Opciones de la rutina" 
            bordered 
            column={1} 
            size="small">
            <AntdDescriptions.Item label="Habilitar" contentStyle={{ textAlign: 'center' }}>
                <Switch
                    tabIndex={3}
                    checked={routine?.enabled}
                    onChange={handleOnChangeEnable}
                />
            </AntdDescriptions.Item>
            <AntdDescriptions.Item label="Ejecutar tareas en paralelo" contentStyle={{ textAlign: 'center' }}>
                <Switch
                    tabIndex={4}
                    checked={!routine?.runInSync}
                    onChange={handleOnChangeSync}
                />
            </AntdDescriptions.Item>
            <AntdDescriptions.Item label="Continuar en caso de error" contentStyle={{ textAlign: 'center' }}>
                <Switch
                    tabIndex={5}
                    checked={routine?.continueOnError}
                    onChange={handleOnChangeContinueOnError}
                />
            </AntdDescriptions.Item>
            <AntdDescriptions.Item label="Ocultar de la vista de control" contentStyle={{ textAlign: 'center' }}>
                <Switch
                    tabIndex={6}
                    checked={routine?.hidden}
                    onChange={handleOnChangeShowInControlView}
                />
            </AntdDescriptions.Item>
            <AntdDescriptions.Item label={`Chequear condiciones ${routine?.autoCheckConditionEveryMs ? "cada ms" : "desactivado"}`} contentStyle={{ textAlign: 'center' }}>
                {
                    routine?.autoCheckConditionEveryMs > 0 ?
                    <InputNumber
                    tabIndex={7}
                    value={routine?.autoCheckConditionEveryMs}
                    style={{ width: "80px" }}
                    min={0} step={1000} 
                    onChange={handleOnChangeCheckConditions}/>
                    :
                    <Button 
                        tabIndex={8}
                        type="default"                        
                        onClick={enableAutoCheckConditions}>
                            Activar 
                    </Button>
                }
            </AntdDescriptions.Item>
            <AntdDescriptions.Item 
                label={<span style={{ display: 'flex', alignItems: 'center', columnGap: "0.5rem"}}>Tiempo máximo de ejecución (ms) 
                    <InfoIcon
                        message="Tiempo máximo que puede durar la ejecución de la rutina. Si se supera este tiempo, la rutina se detendrá automáticamente lanzando un evento 'timeout'"/>
                    </span>}             
                contentStyle={{ textAlign: 'center' }}>
                <InputNumber
                    tabIndex={9}
                    value={routine?.routineTimeout}
                    style={{ width: "80px" }}
                    min={5000} step={1000} 
                    onChange={handleOnChangeTimeout}
                />
            </AntdDescriptions.Item>
        </AntdDescriptions>
        </div>
    );
}

export default Descriptions;