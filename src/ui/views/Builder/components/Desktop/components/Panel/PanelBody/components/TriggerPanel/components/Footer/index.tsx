import React, { useContext } from 'react';
import style from './style.module.css'
import { Button } from 'antd';
import { triggerContext } from '../..';
import useProject from '@hooks/useProject';
import { useParams } from 'react-router-dom';

const Footer = () => {
    const {trigger} = useContext(triggerContext)
    const {routineId} = useParams()
    const {project, setProject} = useProject({fetchProject: false})

    const handleOnClickSaveAndAdd = () => {
        //chequea si el trigger ya existe en el proyecto
        if (!project || !trigger) return
        const existingTrigger = project.triggers.find(t => t.id === trigger.id)
        if (!existingTrigger) {
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
    }

    console.log (project)

    return (
        <div className={style.footer}>
            <Button
                onClick={handleOnClickSaveAndAdd}
                style={{flex: 1}}
                type='primary'>
                Guardar y Agregar
            </Button>
            <Button
                style={{flex: 0.4}}
                danger
                type='link'>
                Eliminar
            </Button>
        </div>
    );
}

export default Footer;