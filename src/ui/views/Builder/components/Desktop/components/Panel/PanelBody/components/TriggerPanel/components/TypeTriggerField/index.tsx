import React, { useContext } from "react";
import { Input, Select } from "antd";
import useGetAvailableTriggers from "@views/Builder/hooks/useGetAvailableTriggers";
import { triggerContext } from "../..";

const TypeTriggerField = () => {

    const { trigger, setTrigger } = useContext(triggerContext)
    const {availableTriggers} = useGetAvailableTriggers() 

    console.log (trigger)
    
    const handleOnChangeSelect = (value: string) => {
        const selectedTrigger = availableTriggers[value]
        if (selectedTrigger) {
            setTrigger({ 
                ...trigger, 
                type: value,
                ...selectedTrigger });
        }
    }

    return (         
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
                tabIndex={-1} />

                    <Select
                        disabled={trigger?.name === '' || trigger?.id === ''}
                        optionFilterProp="label"
                        value={trigger?.type || "Seleccione un tipo de disparador"}
                        style={{ width: 'calc(100% - 80px)' }}
                        status={trigger?.type === '' && trigger.name != "" ? 'error' : ''}
                        onChange={handleOnChangeSelect}
                        options={Object.keys(availableTriggers).map(value => ({ label: availableTriggers[value].easyName, value }))} />

        </Input.Group> );
}
 
export default TypeTriggerField;