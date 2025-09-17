
import React, { useContext, useEffect, useState } from "react";
import { Button, Input, message, Select } from "antd";
import { triggerContext } from "../..";
import useProject from "@hooks/useProject";
import { nanoid } from "nanoid";
import Text from "@components/Text";
import { MdAdd, MdEdit, MdNewLabel } from "react-icons/md";

const TriggerNameField = () => {

    const { trigger, setTrigger, defaultTrigger } = useContext(triggerContext)
    const { project, setProject } = useProject({ fetchProject: false })
    const [editNameMode, setEditNameMode] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const [triggerExists, setTriggerExists] = useState(false)
    const [searchingMode, setSearchingMode] = useState(false)
    const [existentTriggers, setExistentTriggers] = useState(project?.triggers || [])

    useEffect(()=>{
        if (project){
            setExistentTriggers(project.triggers)
        } else {
            setExistentTriggers([])
        }
    },[project])

    useEffect(() => {
        if (trigger) {
            setSearchValue(trigger.name)
            const triggerExists = project?.triggers.find(t => t.name === trigger.name)
            if (triggerExists) {
                setTriggerExists(true)
            } else {
                setTriggerExists(false)
            }
        } else {
            setSearchValue("")
            setTriggerExists(false)
        }
    }, [trigger])

    const notFoundContent = () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MdNewLabel size={20} color="var(--secondary)" />
            <Text size={14} color='var(--secondary)'>Escriba el nombre del nuevo disparador</Text>
        </div>
    )

    const handleOnCreateNewTrigger = () => {
        setEditNameMode(false)
        setTrigger({ ...defaultTrigger, id: nanoid(8), name: searchValue })
    }

    const handleOnEditTriggerName = () => {
        if (!triggerExists) return
        setEditNameMode(false)
        setSearchingMode(false)
        if (trigger.name === searchValue) return
        trigger.name = searchValue
        message.success('Nombre de disparador actualizado')
    }

    const handleOnChangingTriggerName = (e) => {
        setSearchValue(e.target.value)
    }

    const handleOnChangeSelect = (value) => {
        setSearchingMode(false)
        const selectedTrigger = project?.triggers.find(t => t.id === value)
        setSearchValue(selectedTrigger.name)
        if (selectedTrigger) {
            setTrigger(selectedTrigger)
            setTriggerExists(true)
        } else {
            setTrigger({ ...defaultTrigger, id: nanoid(8), name: '' })
        }
    }

    const handleOnSearchTrigger = (value: string) => {
        if (value.trim() === '') return

        setSearchValue(value)
        const triggerExists = project?.triggers.find(t => t.name.toLowerCase().includes(value.toLowerCase()))
        if (triggerExists) {
            setTrigger(triggerExists)
            setTriggerExists(true)
            setSearchingMode(true)
        } else {
            setTrigger({ ...defaultTrigger, id: nanoid(8), name: value })
            setTriggerExists(false)
            setSearchingMode(false)
        }
    }

    const handleOnEnableEditNameMode = () => {
        console.log(`Enabling edit mode for trigger name: ${trigger.name}`)
        setEditNameMode(true)
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
                value="Nombre"
                readOnly
                tabIndex={-1} />
            {
                editNameMode ?
                    <Input
                        style={{ width: 'calc(100% - 80px - 40px)' }}
                        value={searchValue}
                        autoFocus
                        onBlur={handleOnEditTriggerName}
                        onPressEnter={handleOnEditTriggerName}
                        onChange={handleOnChangingTriggerName} />
                    :
                    <Select
                        showSearch
                        notFoundContent={notFoundContent()}
                        optionFilterProp="label"
                        placeholder="Seleccione un disparador o escriba un nombre para crear uno nuevo"
                        value={trigger?.name || "Escriba un nombre para crear uno nuevo"}
                        style={{ width: 'calc(100% - 80px - 40px)' }}
                        onSearch={handleOnSearchTrigger}
                        status={trigger && trigger.name.trim() === '' ? 'error' : ''}
                        onChange={handleOnChangeSelect}
                        options={existentTriggers.map(t => ({ label: t.name, value: t.id }))} />
            }
            {
                triggerExists
                    ? <Button
                        disabled={searchingMode}
                        onClick={handleOnEnableEditNameMode}
                        style={{ width: '40px', padding: 10, marginLeft: 1 }}>
                        <MdEdit size={40} color="var(--text-secondary)" />
                    </Button>
                    : <Button
                        style={{ width: '40px', padding: 10, marginLeft: 1 }}
                        onClick={handleOnCreateNewTrigger}>
                        <MdAdd size={40} color="var(--text-secondary)" />
                    </Button>
            }
        </Input.Group>

    );
}

export default TriggerNameField;