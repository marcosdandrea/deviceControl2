import React, { useContext, useEffect, useState } from 'react';
import style from './style.module.css'
import { Button, message, Popconfirm } from 'antd';
import { triggerContext } from '../..';
import useProject from '@hooks/useProject';
import { useNavigate, useParams } from 'react-router-dom';
import { nanoid } from 'nanoid';

const Footer = () => {
    const { trigger, invalidParams, triggerInstanceId } = useContext(triggerContext)
    const { routineId, groupId } = useParams()
    const { project, setProject } = useProject({ fetchProject: false })
    const [isLastTrigger, setIsLastTrigger] = useState(false)
    const [isANewTrigger, setIsANewTrigger] = useState(false)
    const [belongsToRoutine, setBelongsToRoutine] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (project && routineId && trigger?.id) {
            const routine = project.routines.find(r => r.id === routineId)
            if (routine) {
                const triggerInstanceExists = routine.triggersId?.some((triggerInstance: any) => {
                    if (typeof triggerInstance === 'string') {
                        if (triggerInstanceId)
                            return triggerInstance === triggerInstanceId
                        return triggerInstance === trigger.id
                    }
                    if (triggerInstanceId)
                        return triggerInstance.id === triggerInstanceId
                    return triggerInstance.triggerId === trigger.id
                }) || false
                setBelongsToRoutine(triggerInstanceExists)
            }
        } else {
            setBelongsToRoutine(false)
        }
    }, [routineId, trigger, project, triggerInstanceId])

    useEffect(() => {
        if (project && trigger?.id) {
            const trigerUseCount = project.routines.reduce((count, routine) => {
                if (!routine.triggersId) return count;
                const occurrences = routine.triggersId.filter((triggerInstance: any) => {
                    if (typeof triggerInstance === 'string')
                        return triggerInstance === trigger.id
                    return triggerInstance.triggerId === trigger.id
                }).length
                return count + occurrences;
            }, 0);
            setIsLastTrigger(trigerUseCount === 1)
        }
    }, [project, trigger])

    useEffect(() => {
        if (project && trigger) {
            const existingTrigger = project.triggers.find(t => t.id === trigger.id)
            setIsANewTrigger(!existingTrigger)
        } else {
            setIsANewTrigger(false)
        }
    }, [trigger, project])

    const handleOnClickSaveAndAdd = () => {
        if (!project || !trigger) return

        if (isANewTrigger) {
            //agrega el trigger al proyecto
            setProject(prev => ({
                ...prev,
                triggers: [...prev.triggers, trigger]
            }))
            message.success('Disparador creado correctamente.')

        } else {

            //actualiza el trigger en el proyecto
            setProject(prev => ({
                ...prev,
                triggers: prev.triggers.map(t => t.id === trigger.id ? trigger : t)
            }))
            message.success('Disparador actualizado correctamente.')
        }

        //agrega el trigger a la rutina si es que no pertenece ya
        if (!routineId) return
        const routine = project.routines.find(r => r.id === routineId)
        if (!routine) return
        if (!routine.triggersId) routine.triggersId = []

        let instanceId = triggerInstanceId
        if (!belongsToRoutine) {
            instanceId = nanoid(8)
            routine.triggersId.push({ id: instanceId, triggerId: trigger.id })
            setProject(prev => ({
                ...prev,
                routines: prev.routines.map(r => r.id === routineId ? routine : r)
            }))
            message.success(`Disparador agregado a la rutina ${routine.name}.`)
        } 
        //actualiza la rutina en el proyecto

        navigate(`/builder/${groupId}/${routineId}/trigger/${trigger.id}?instanceId=${instanceId}`)
    }

    const handleOnClickDelete = () => {
        //elimina el trigger de la rutina
        if (!project || !trigger) return
        const routine = project.routines.find(r => r.id === routineId)
        if (!routine) return
        if (!routine.triggersId) routine.triggersId = []

        let removed = false
        if (triggerInstanceId) {
            const originalLength = routine.triggersId.length
            routine.triggersId = routine.triggersId.filter((triggerInstance: any) => {
                if (typeof triggerInstance === 'string')
                    return triggerInstance !== triggerInstanceId
                return triggerInstance.id !== triggerInstanceId
            })
            removed = routine.triggersId.length !== originalLength
        } else {
            const index = routine.triggersId.findIndex((triggerInstance: any) => {
                if (typeof triggerInstance === 'string')
                    return triggerInstance === trigger.id
                return triggerInstance.triggerId === trigger.id
            })
            if (index > -1) {
                routine.triggersId.splice(index, 1)
                removed = true
            }
        }

        if (!removed) return

        if (isLastTrigger) {
            project.triggers = project.triggers.filter(t => t.id !== trigger.id)
        }

        setProject({ ...project })
        navigate(-1)
    }

    return (
        <div className={style.footer}>
            <Button
                disabled={invalidParams.length > 0 || !trigger || trigger.name === '' || trigger.type === ''}
                onClick={handleOnClickSaveAndAdd}
                style={{ flex: 1 }}
                type='primary'>
                {isANewTrigger
                    ? "Guardar y agregar a la rutina"
                    : belongsToRoutine
                        ? "Actualizar"
                        : "Agregar a la rutina"}
            </Button>
            <Popconfirm
                title="Eliminar Disparador"
                showCancel={belongsToRoutine}
                okText={belongsToRoutine ? "Sí, eliminar" : "Entendido"}
                cancelText="No"
                onConfirm={belongsToRoutine ? handleOnClickDelete : undefined}
                styles={{
                    root: { maxWidth: "20rem" }
                }}
                description={
                    !belongsToRoutine
                        ? "Primero debe agregar el disparador a esta rutina para poder eliminarlo."
                        : isLastTrigger
                            ? "¿Estás seguro de que deseas eliminar este disparador? Se lo está usando solo en esta rutina y si se elimina, se borrará del proyecto."
                            : "¿Estás seguro de que deseas eliminar este disparador de la rutina?"}>
                <Button
                    style={{ flex: 0.4 }}
                    danger
                    disabled={isANewTrigger}
                    type='link'>
                    Eliminar
                </Button>
            </Popconfirm>
        </div>
    );
}

export default Footer;