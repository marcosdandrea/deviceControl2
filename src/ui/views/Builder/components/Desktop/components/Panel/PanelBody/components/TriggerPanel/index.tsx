import React, { createContext, useEffect, useMemo, useRef, useState } from "react";
import style from './style.module.css'
import { useParams, useSearchParams } from "react-router-dom";
import useProject from "@hooks/useProject";
import Text from "@components/Text";
import { Input, Switch } from "antd";
import TriggerNameField from "./components/TriggerNameField";
import { TriggerType } from "@common/types/trigger.type";
import TypeTriggerField from "./components/TypeTriggerField";
import TriggerParameters from "./components/TriggerParameters";
import Footer from "./components/Footer";
import Header from "./components/Header";
import useGetAvailableTriggers from "@views/Builder/hooks/useGetAvailableTriggers";

export const triggerContext = createContext({ trigger: undefined, setTrigger: (trigger: TriggerType) => { }, defaultTrigger: undefined, setInvalidParams: (params: string[]) => { }, invalidParams: [] as string[], triggerInstanceId: undefined });

const defaultTrigger = {
    id: '',
    name: '',
    type: '',
    params: {},
    reArmOnTrigger: true,
    description: '',
} as TriggerType

const TriggerPanel = () => {
    const { triggerId } = useParams()
    const [searchParams] = useSearchParams();
    const { project } = useProject({ fetchProject: false })
    const [trigger, setTrigger] = useState<TriggerType | undefined>(undefined);
    const [invalidParams, setInvalidParams] = useState<string[]>([]);
    const triggerInstanceId = searchParams.get('instanceId') || undefined;
    const { availableTriggers } = useGetAvailableTriggers()


    useEffect(() => {
        if (Object.keys(availableTriggers).length === 0)
            return

        let trigger = undefined
        let triggerType = undefined
        let triggerParams = {}

        if (triggerId !== "newTrigger") {

            trigger = project.triggers.find(t => t.id === triggerId)
            if (!trigger){
                console.error(`El disparador con ID '${triggerId}' no fue encontrado.`)
                return
            }

            triggerType = availableTriggers[trigger.type]
            if (!triggerType) {
                console.error(`El tipo de disparador '${trigger.type}' no es válido.`)
                return
            }

            triggerParams = Object.keys(trigger.params).reduce((acc, paramKey) => {
                acc[paramKey] = {
                    ...triggerType.params[paramKey],
                    value: trigger.params[paramKey]?.value
                };
                return acc;
            }, {} as Record<string, { value: string }>);
        }

        if (project && triggerId) {
            
            if (trigger) {
                setTrigger({
                    ...trigger,
                    params: triggerParams
                })
            }
            else
                setTrigger(defaultTrigger)
        } else {
            setTrigger(defaultTrigger)
        }
        setInvalidParams([])
    }, [project, triggerId, availableTriggers])

    return (
        <triggerContext.Provider value={{ trigger, setTrigger, defaultTrigger, setInvalidParams, invalidParams, triggerInstanceId }}>
            <div className={style.triggerPanel}>
                <Header />
                <div className={style.body} >
                    <TriggerNameField />
                    <Input.TextArea
                        value={trigger?.description}
                        rows={3}
                        placeholder='Descripción del disparador...'
                        onChange={(e) => setTrigger({ ...trigger, description: e.target.value })} />
                    <TypeTriggerField />
                    <Input.Group
                        className="ant-input-outlined"
                        style={{ display: 'flex', borderRadius: "8px", justifyContent: "space-between", alignItems: "center", paddingRight: "0.5rem" }}>
                        <Input
                            disabled={trigger?.name === '' || trigger?.type === '' || trigger?.disableRearming}
                            style={{
                                width: '200px',
                                color: "var(--text-secondary)",
                                backgroundColor: "var(--component-interactive)",
                                pointerEvents: 'none',
                                borderRight: 0,
                            }}
                            value="Rearmar luego de disparar"
                            readOnly
                            tabIndex={-1} />
                        <Switch
                            disabled={trigger?.name === '' || trigger?.type === '' || trigger?.disableRearming}
                            checked={trigger?.reArmOnTrigger}
                            onChange={(checked) => setTrigger({ ...trigger, reArmOnTrigger: checked })} />

                    </Input.Group>
                    <TriggerParameters />
                </div>
                <Footer />
            </div>
        </triggerContext.Provider>
    );
}

export default TriggerPanel;