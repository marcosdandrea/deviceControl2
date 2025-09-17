import React, { useContext, useEffect } from 'react';
import style from './style.module.css'
import Text from '@components/Text';
import { triggerContext } from '../..';
import { MdCopyAll } from 'react-icons/md';
import { Tooltip } from 'antd';
import useProject from '@hooks/useProject';
import { useNavigate, useParams } from 'react-router-dom';

const Header = () => {

    const { routineId, triggerId } = useParams()
    const { trigger, setTrigger } = useContext(triggerContext)
    const { project, setProject } = useProject({ fetchProject: false })
    const [isANewTrigger, setIsANewTrigger] = React.useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (!project || !trigger) return
        const triggerExistsInProject = project?.triggers.find(t => t.id === trigger.id)
        setIsANewTrigger(!triggerExistsInProject)
    }, [trigger, project])

    const handleOnDuplicate = () => {
        if (!project || !trigger) return;
        const newTrigger = { ...trigger, id: crypto.randomUUID(), name: trigger.name + " (Copia)" }
        setTrigger(newTrigger)
        const routine = project.routines.find(r => r.id === routineId)
        const triggerInstanceId = crypto.randomUUID();
        if (routine) {
            routine.triggersId = [...(routine.triggersId || []), { triggerId: newTrigger.id, id: triggerInstanceId }]
        }
        project.triggers.push(newTrigger)
        setProject({ ...project })
        navigate(`/builder/${routineId}/trigger/${newTrigger.id}?instanceId=${triggerInstanceId}`)
    }

    return (
        <div className={style.header}>
            <Text
                fontFamily='Open Sans Light'
                style={{ width: "auto", overflow: "visible", marginRight: "8px" }}
                color='white'>
                Disparador:
            </Text>
            <Text
                fontFamily='Open Sans SemiBold'
                color='white'>
                {trigger?.name}
            </Text>
            {!isANewTrigger &&
                <Tooltip title="Duplicar este componente, creando una nueva copia en el proyecto con todas las características de este.">
                    <div
                        onClick={handleOnDuplicate}
                        className={style.button}>
                        <MdCopyAll size={20} color='white' />
                    </div>
                </Tooltip>
            }
        </div>
    );
}

export default Header;