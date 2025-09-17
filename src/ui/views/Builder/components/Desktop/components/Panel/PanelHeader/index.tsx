import React, { useEffect, useState } from "react";
import style from './style.module.css';
import { useNavigate, useParams } from "react-router-dom";
import Button from "@components/Button";
import { MdClose } from "react-icons/md";
import useProject from "@hooks/useProject";
import { Breadcrumb } from "antd";

const PanelHeader = () => {
    const navigation = useNavigate();
    const { project } = useProject({ fetchProject: false });
    const { routineId, taskId, triggerId } = useParams()
    const [routineName, setRoutineName] = useState('Rutina');
    const [taskName, setTaskName] = useState('Tarea');
    const [triggerName, setTriggerName] = useState('Disparador');

    useEffect(() => {
        if (!project) return;
        let routine = null
        if (routineId) {
            routine = project.routines.find(r => r.id === routineId);
            setRoutineName(routine ? routine.name : 'Rutina');
        }

        if (taskId && routine) {
            const task = project.tasks.find(t => t.id === taskId);
            setTaskName(task ? task.name : 'Nueva Tarea');
        }

        if (triggerId && routine) {
            const trigger = project.triggers.find(t => t.id === triggerId);
            setTriggerName(trigger ? trigger.name : 'Nuevo Disparador');
        }

    }, [routineId, taskId, project, triggerId]);

    const handleOnClosePanel = () => {
        navigation('/builder')
    }

    return (
        <div className={style.panelHeader}>
            <div className={style.panelTitle}>
                <Breadcrumb>
                    {
                        routineId &&
                        <Breadcrumb.Item onClick={() => navigation(`/builder/${routineId}`)}>
                            <div style={{cursor: 'pointer'}}>
                                {routineName}
                            </div>
                        </Breadcrumb.Item>
                    }
                    {
                        triggerId &&
                        <Breadcrumb.Item onClick={() => navigation(`/builder/${routineId}/trigger/${triggerId}`)}>
                            <div style={{cursor: 'pointer'}}>
                                {`disparador: ${triggerName}`}
                            </div>
                        </Breadcrumb.Item>
                    }
                    {
                        taskId &&
                        <Breadcrumb.Item
                            onClick={() => navigation(`/builder/${routineId}/task/${taskId}`)}>
                            <div style={{cursor: 'pointer'}}>
                                {`tarea: ${taskName}`}
                            </div>
                        </Breadcrumb.Item>
                    }
                </Breadcrumb>
            </div>
            <Button
                color="var(--component-interactive"
                styles={{
                    width: '1.5rem',
                    height: '1.5rem',
                }}
                onClick={handleOnClosePanel}
                icon={<MdClose />} />
        </div>
    );
}

export default PanelHeader;