import React, { useContext, useState, useEffect } from "react";
import style from './style.module.css'
import { triggerContext } from "../..";
import useGetAvailableTriggers from "@views/Builder/hooks/useGetAvailableTriggers";
import { Input } from "antd";

const TriggerParameters = () => {
    const { trigger } = useContext(triggerContext)
    const { availableTriggers } = useGetAvailableTriggers()

    // Nuevo estado local para los parámetros
    const [params, setParams] = useState(trigger?.params || {});

    // Sincroniza el estado local si el trigger cambia
    useEffect(() => {
        setParams(trigger?.params || {});
    }, [trigger]);

    const validateParam = (paramName: string, value: any) => {
        const param = availableTriggers[trigger.type]?.params.find(p => p.name === paramName)
        if (!param) return false
        if (param.required) {
            if (!value || (param.validationMask && !new RegExp(param.validationMask).test(value))) {
                return false;
            }
        }
        return true
    }

    const handleOnChangeParam = (paramName: string, value: any) => {
        setParams(prev => ({ ...prev, [paramName]: value }));
        // Si necesitas actualizar el trigger en el contexto, hazlo aquí
        if (trigger) {
            trigger.params = { ...params, [paramName]: value };
        }
    }

    if (!trigger || Object.keys(params).length === 0) return null

    return (
        <div className={style.triggerParameters}>
            {
                Object.keys(params).map(paramName => (
                    <Input
                        addonBefore={availableTriggers[trigger.type]?.params.find(p => p.name === paramName)?.easyName || paramName}
                        key={paramName}
                        status={validateParam(paramName, params[paramName]) ? '' : 'error'}
                        placeholder={availableTriggers[trigger.type]?.params.find(p => p.name === paramName)?.moduleDescription || ""}
                        value={params[paramName]}
                        onChange={(e) => handleOnChangeParam(paramName, e.target.value)}
                    />
                ))
            }
        </div>
    );
}

export default TriggerParameters;