import React, { useContext, useState, useEffect } from "react";
import style from './style.module.css'
import { triggerContext } from "../..";
import useGetAvailableTriggers from "@views/Builder/hooks/useGetAvailableTriggers";
import { Input, Select } from "antd";
import { ProjectContext } from "@contexts/projectContextProvider";
import WarningIcon from "@components/WarningIcon";
import useCheckPortAvailability from "@hooks/useCheckPortAvailability";
import systemCommands from "@common/commands/system.commands";

const TriggerParameters = () => {
    const { project } = useContext(ProjectContext)
    const { trigger, setTrigger, invalidParams, setInvalidParams } = useContext(triggerContext)
    const { availableTriggers } = useGetAvailableTriggers()
    const { checkUDPPort, checkTCPPort } = useCheckPortAvailability();

    // Nuevo estado local para los parámetros
    const [params, setParams] = useState(trigger?.params || {});

    // Sincroniza el estado local si el trigger cambia
    useEffect(() => {
        setParams(trigger?.params || {});
    }, [trigger?.params]);

    const validateParam = async (paramName: string, value: any, testAction?: string) => {
        const param = availableTriggers[trigger.type]?.params.find(p => p.name === paramName)

        const updateInvalidParams = (isValid: boolean) => {
            let newInvalidParams = [...invalidParams];
            if (isValid) {
                newInvalidParams = newInvalidParams.filter((p: string) => p !== paramName);
            } else {
                if (!newInvalidParams.includes(paramName)) {
                    newInvalidParams.push(paramName);
                }
            }
            setInvalidParams(newInvalidParams);
        }

        const checkRegex = () => {
            if (param?.validationMask) {
                const regex = new RegExp(param.validationMask);
                const result =  regex.test(value);
                updateInvalidParams(result);
                return result;
            }
            updateInvalidParams(true);
            return true;
        }

        if (checkUDPPort && testAction === systemCommands.checkUDPPortAvailability) {
            checkUDPPort(value).then(({isAvailable}) => {
                if (!isAvailable) {
                    updateInvalidParams(false);
                    return false;
                }
                return checkRegex();
            });
        }

        if (checkTCPPort && testAction === systemCommands.checkTCPPortAvailability) {
            checkTCPPort(value).then(({isAvailable}) => {
                if (!isAvailable) {
                    updateInvalidParams(false);
                    return false;
                }
                return checkRegex();
            });
        }

        return checkRegex();
    }

    const handleOnChangeParam = (paramName: string, value: any) => {
        validateParam(paramName, value, availableTriggers[trigger.type]?.params.find(p => p.name === paramName)?.testAction);
        setParams(prev => ({ ...prev, [paramName]: value }));
        // Si necesitas actualizar el trigger en el contexto, hazlo aquí
        setTrigger({ ...trigger, params: { ...trigger?.params, [paramName]: value } });

        if (trigger) {
            trigger.params = { ...params, [paramName]: value };
        }
    }

    if (!trigger || Object.keys(params).length === 0) return null

    return (
        <div className={style.triggerParameters}>
            {
                Object.keys(params).map(paramName => {
                    const options = availableTriggers[trigger.type]?.params.find(p => p.name === paramName)?.options
                    let optionsList: [label: string, value: string][] = []
                    if (options == "routinesID") {
                        optionsList = project?.routines?.map(r => [r.name, r.id]) || []
                    } else {
                        optionsList = options?.map((opt: string) => [opt, opt]) || []
                    }

                    const param = availableTriggers[trigger.type]?.params.find(p => p.name === paramName)
                    const easyName = param?.easyName
                    const warning = param?.warning

                    if (optionsList.length > 0)
                        return (
                            <Input.Group
                                key={paramName}
                                compact>
                                <Input
                                    style={{
                                        width: `${warning ? '150px' : '200px'}`,
                                        color: "var(--text-secondary)",
                                        backgroundColor: "var(--component-interactive)",
                                        pointerEvents: 'none',
                                        borderRight: 0,
                                    }}
                                    value={`${easyName || paramName} ${invalidParams.includes(paramName) ? <WarningIcon message={"El puerto se encuentra en uso o ha ingresado un valor de puerto inválido."} blink={true}/> : ''}`}
                                    readOnly
                                    tabIndex={-1} />
                                <Select
                                    style={{ width: `calc(100% - ${warning ? '150px' : '200px'})` }}
                                    value={params[paramName] || availableTriggers[trigger.type]?.params.find(p => p.name === paramName)?.defaultValue || undefined}
                                    onChange={(value) => handleOnChangeParam(paramName, value)}
                                    options={optionsList.map(([label, value]) => ({ label, value }))}/>
                            </Input.Group>)

                    return <Input
                        addonBefore={<div style={{ display: 'flex', alignItems: 'center', columnGap: '0.3rem' }}>
                            {easyName || paramName } {invalidParams.includes(paramName) ? <WarningIcon message={"El puerto se encuentra en uso o ha ingresado un valor de puerto inválido."} blink={true}/> : ''}
                        </div>}
                        key={paramName}
                        status={invalidParams.includes(paramName) ? 'error' : ''}
                        placeholder={availableTriggers[trigger.type]?.params.find(p => p.name === paramName)?.moduleDescription || ""}
                        value={params[paramName] || availableTriggers[trigger.type]?.params.find(p => p.name === paramName)?.defaultValue || ''}
                        onChange={(e) => handleOnChangeParam(paramName, e.target.value)}
                    />
                }
                )
            }
        </div>
    );
}

export default TriggerParameters;