import React, { useContext } from "react";
import style from './style.module.css'
import { triggerContext } from "../..";
import { Input, Select, TimePicker } from "antd";
import { ProjectContext } from "@contexts/projectContextProvider";
import WarningIcon from "@components/WarningIcon";
import useCheckPortAvailability from "@hooks/useCheckPortAvailability";
import systemCommands from "@common/commands/system.commands";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Logger } from '@helpers/logger';
dayjs.extend(customParseFormat);

const TriggerParameters = () => {
    const { project } = useContext(ProjectContext)
    const { trigger, setTrigger, invalidParams, setInvalidParams } = useContext(triggerContext)
    const { checkUDPPort, checkTCPPort } = useCheckPortAvailability();

    const validateParam = async (paramName: string, value: any, testAction?: string) => {
        const param = trigger.params[paramName];
        if (!param) return true;

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
                const result = regex.test(value);
                updateInvalidParams(result);
                return result;
            }
            updateInvalidParams(true);
            return true;
        }

        if (checkUDPPort && testAction === systemCommands.checkUDPPortAvailability) {
            checkUDPPort(value).then(({ isAvailable }) => {
                if (!isAvailable) {
                    updateInvalidParams(false);
                    return false;
                }
                return checkRegex();
            });
        }

        if (checkTCPPort && testAction === systemCommands.checkTCPPortAvailability) {
            checkTCPPort(value).then(({ isAvailable }) => {
                if (!isAvailable) {
                    updateInvalidParams(false);
                    return false;
                }
                return checkRegex();
            });
        }

        return checkRegex();
    }


    const handleOnChangeParamValue = (paramName: string, value: any) => {
        validateParam(paramName, value, trigger.params[paramName]?.testAction);
        // Si necesitas actualizar el trigger en el contexto, hazlo aquí
        setTrigger({
            ...trigger,
            params: {
                ...trigger?.params,
                [paramName]: { 
                    ...trigger?.params[paramName],
                    value: value
                }
            }
        });
    }

    if (!trigger || Object.keys(trigger.params).length === 0) return null

    return (
        <div className={style.triggerParameters}>
            {
                Object.keys(trigger.params).map(paramName => {

                    const options = trigger.params[paramName]?.options
                    let optionsList: [label: string, value: string][] = []
                    if (options == "routinesID") {
                        optionsList = project?.routines?.map(r => [r.name, r.id]) || []
                    } else {
                        optionsList = options?.map((opt: string, index: number) => [opt, index]) || []
                    }


                    const value = trigger.params[paramName]?.value || undefined
                    const defaultValue = trigger.params[paramName]?.defaultValue || ''
                    const easyName = trigger.params[paramName]?.easyName || paramName
                    const moduleDescription = trigger.params[paramName]?.moduleDescription || ''
                    const warning = trigger.params[paramName]?.warning || false
                    const invalidValue = invalidParams.includes(paramName)


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
                                    value={`${easyName || paramName} ${invalidValue ? <WarningIcon message={"El valor ingresado no es válido."} blink={true} /> : ''}`}
                                    readOnly
                                    tabIndex={-1} />
                                <Select
                                    style={{ width: `calc(100% - ${warning ? '150px' : '200px'})` }}
                                    value={trigger.params[paramName].value || defaultValue || undefined}
                                    onChange={(value) => handleOnChangeParamValue(paramName, value)}
                                    options={optionsList.map(([label, key]) => ({ label, value: key }))} />
                            </Input.Group>
                        )

                    if (trigger.params[paramName]?.type === "string")
                        return (
                            <Input
                                addonBefore={<div style={{ display: 'flex', alignItems: 'center', columnGap: '0.3rem' }}>
                                    {easyName || paramName} {invalidValue ? <WarningIcon message={"El valor ingresado no es válido."} blink={true} /> : ''}
                                </div>}
                                key={paramName}
                                status={invalidValue ? 'error' : ''}
                                placeholder={trigger.description || ""}
                                value={value || ''}
                                onChange={(e) => handleOnChangeParamValue(paramName, e.target.value)} />
                        )

                    if (trigger.params[paramName]?.type === "number")
                        return (
                            <Input
                                type="number"
                                addonBefore={<div style={{ display: 'flex', alignItems: 'center', columnGap: '0.3rem' }}>
                                    {easyName || paramName} {invalidValue ? <WarningIcon message={"El valor ingresado no es válido."} blink={true} /> : ''}
                                </div>}
                                key={paramName}
                                status={invalidValue ? 'error' : ''}
                                placeholder={moduleDescription || ""}
                                value={trigger.params[paramName]?.value || defaultValue || ''}
                                onChange={(e) => handleOnChangeParamValue(paramName, e.target.value)} />
                        )

                    if (trigger.params[paramName]?.type === "time")
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
                                    value={`${easyName || paramName} ${invalidValue ? <WarningIcon message={"El valor ingresado no es válido."} blink={true} /> : ''}`}
                                    readOnly
                                    tabIndex={-1} />
                                <TimePicker
                                    style={{ width: `calc(100% - ${warning ? '150px' : '200px'})` }}
                                    onChange={(time, timeString) => {
                                        if (!time) return;
                                        Logger.log(time, timeString);
                                        const millis = time.hour() * 3600000 + time.minute() * 60000 + time.second() * 1000;
                                        Logger.log ({ millis });
                                        handleOnChangeParamValue(paramName, millis);
                                    }}
                                    defaultOpenValue={dayjs('00:00:00', 'HH:mm:ss')}
                                    value={value !== undefined ? dayjs().startOf('day').add(value, 'millisecond') : undefined}
                                    format={'HH:mm'}
                                />
                            </Input.Group>
                        )
                    }
                )
            }
        </div>
    );
}

export default TriggerParameters;