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
    const { routineId, taskId, triggerId, groupId } = useParams()
    const [routineName, setRoutineName] = useState('Rutina');
    const [taskName, setTaskName] = useState('Tarea');
    const [triggerName, setTriggerName] = useState('Disparador');
    const [routes, setRoutes] = useState([])

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
        navigation(`/builder/${groupId}`);
    }

    useEffect(() => {
        const newRoutes = [];
        if (routineId) {
            newRoutes.push({title:
                <div
                    onClick={() => navigation(`/builder/${routineId}`)}
                    style={{ cursor: 'pointer' }}>
                    {routineName}
                </div>
            })
        }
        if (triggerId) {
            newRoutes.push({title:
                <div
                    onClick={() => navigation(`/builder/${routineId}/trigger/${triggerId}`)}
                    style={{ cursor: 'pointer' }}>
                    {`disparador: ${triggerName}`}
                </div>
            })
        }
        if (taskId) {
            newRoutes.push({title:
                <div
                    onClick={() => navigation(`/builder/${routineId}/task/${taskId}`)}
                    style={{ cursor: 'pointer' }}>
                    {`tarea: ${taskName}`}
                </div>
            })
        }
        setRoutes(newRoutes)
    }, [routineId, triggerId, taskId, routineName, triggerName, taskName])


    return (
        <div className={style.panelHeader}>
            <div className={style.panelTitle}>
                <Breadcrumb items={routes} />
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