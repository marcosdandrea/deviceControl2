
import React, { useContext, useEffect, useState } from "react";
import { triggerContext } from "../..";
import useProject from "@hooks/useProject";
import EditableSelectList from "@views/Builder/components/EditableSelectList";

const TriggerNameField = () => {

    const { project } = useProject({ fetchProject: false })
    const { trigger, setTrigger, defaultTrigger, setInvalidParams } = useContext(triggerContext)

    const [triggersOptions, setTriggerOptions] = useState([])
    const [selectedTrigger, setSelectedTrigger] = useState<{ label: string; value: string; } | null>(null)

    useEffect(() => {
        if (project) {
            const options = project.triggers?.map((trig: any) => ({ label: trig.name, value: trig.id }))
            setTriggerOptions(options)
        }
    }, [project])

    useEffect(() => {
        if (trigger) {
            setSelectedTrigger({ label: trigger.name, value: trigger.id })
        }
    }, [trigger])

    const handleOnCreateTriggerOption = (triggers: { label: string; value: string; }[], newTrigger: { label: string; value: string; }) => {
        setTriggerOptions(triggers)
        setSelectedTrigger(newTrigger)
        setTrigger({ ...defaultTrigger, id: newTrigger.value, name: newTrigger.label })
        setInvalidParams([])
    }

    const handleOnUpdateTriggerOption = (triggers: { label: string; value: string; }[], updatedOption: { label: string; value: string; }) => {
        setTriggerOptions(triggers)
        setSelectedTrigger(updatedOption)
        const taskInProject = project.triggers.find(t => t.id === updatedOption.value)
        if (taskInProject) {
            setTrigger({ ...taskInProject, name: updatedOption.label })
            return
        }
        setTrigger({ ...defaultTrigger, id: updatedOption.value, name: updatedOption.label })
    }

    const handleOnSelectTrigger = (value: string, label: any) => {
        setSelectedTrigger({ label: label, value: value })
        const selected = project.triggers.find((t: any) => t.id === value)
        if (selected) {
            setTrigger(selected)
        } else {
            setTrigger({...defaultTrigger, id: value, name: label })
        }
        setInvalidParams([])
    }

    return (
        <EditableSelectList
            label="Nombre"
            options={triggersOptions}
            value={selectedTrigger}
            createNewOptionLabel="Crear Nuevo Disparador"
            onCreateOption={handleOnCreateTriggerOption}
            onUpdateOption={handleOnUpdateTriggerOption}
            onSelectOption={handleOnSelectTrigger}
        />
    );
}

export default TriggerNameField;