import React, { useContext, useEffect, useState } from 'react';
import style from './style.module.css'
import { Button, Popconfirm } from 'antd';
import { triggerContext } from '../..';
import useProject from '@hooks/useProject';
import { useNavigate, useParams } from 'react-router-dom';

const Footer = () => {
    const { trigger, invalidParams } = useContext(triggerContext)
    const { routineId } = useParams()
    const { project, setProject } = useProject({ fetchProject: false })
    const [isLastTrigger, setIsLastTrigger] = useState(false)
    const [isANewTrigger, setIsANewTrigger] = useState(false)
    const [belongsToRoutine, setBelongsToRoutine] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (project && routineId && trigger?.id) {
            const routine = project.routines.find(r => r.id === routineId)
            if (routine) {
                setBelongsToRoutine(routine.triggersId.includes(trigger.id))
            }
        } else {
            setBelongsToRoutine(false)
        }
    }, [routineId, trigger, project])

    useEffect(() => {
        if (project && trigger?.id) {
            const trigerUseCount = project.routines.reduce((count, routine) => {
                return count + (routine.triggersId.includes(trigger.id) ? 1 : 0);
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
        }
        //agrega el trigger a la rutina
        if (!routineId) return
        const routine = project.routines.find(r => r.id === routineId)
        if (!routine) return
        if (!routine.triggersId) routine.triggersId = []
        routine.triggersId.push(trigger.id)
        //actualiza el proyecto
        setProject(prev => ({
            ...prev,
            routines: prev.routines.map(r => r.id === routineId ? routine : r)
        }))
        navigate(`/builder/${routineId}/trigger/${trigger.id}`)
    }

    const handleOnClickDelete = () => {
        //elimina el trigger de la rutina
        if (!project || !trigger) return
        const routine = project.routines.find(r => r.id === routineId)
        if (!routine) return
        routine.triggersId = routine.triggersId.filter(id => id !== trigger.id)
        //actualiza el proyecto
        setProject(prev => ({
            ...prev,
            routines: prev.routines.map(r => r.id === routineId ? routine : r)
        }))

        //si es el ultimo uso del trigger, eliminarlo del proyecto
        if (isLastTrigger) {
            setProject(prev => ({
                ...prev,
                triggers: prev.triggers.filter(t => t.id !== trigger.id)
            }))
        }
        navigate(-1)
    }

    return (
        <div className={style.footer}>
            <Button
                disabled={invalidParams.length > 0 || !trigger || trigger.name === '' || trigger.type === ''}
                onClick={handleOnClickSaveAndAdd}
                style={{ flex: 1 }}
                type='primary'>
                {isANewTrigger ? "Guardar y agregar a la rutina" : "Agregar a la rutina"}
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