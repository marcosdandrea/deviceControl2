import Text from '@components/Text';
import style from './style.module.css'
import { Button, message, Popconfirm } from 'antd';
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { routineConfigurationContext } from '../..';
import useProject from '@hooks/useProject';
import RoutineId from './components/RoutineId';

const Footer = () => {
    const { project, setProject } = useProject({ fetchProject: false })
    const { routine, setRoutine } = useContext(routineConfigurationContext)
    const [enableSave, setEnableSave] = React.useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (routine?.name && routine.name.trim() !== '') {
            setEnableSave(true)
        } else {
            setEnableSave(false)
        }
    }, [routine])

    const handleOnCancel = () => {
        navigate(-1)
    }

    const handleOnSave = () => {
        const routineIndex = project?.routines?.findIndex(r => r.id === routine.id)
        if (routineIndex === -1 || routineIndex === undefined) {
            setProject({ ...project, routines: [...project.routines, routine] })
        } else {
            setProject({ ...project, routines: [...project.routines.slice(0, routineIndex), routine, ...project.routines.slice(routineIndex + 1)] })
        }
    }

    const handleOnDeleteRoutine = () => {
        if (routine?.id) {
            const routineIndex = project?.routines?.findIndex(r => r.id === routine.id)
            if (routineIndex !== -1 && routineIndex !== undefined) {
                setProject({ ...project, routines: [...project.routines.slice(0, routineIndex), ...project.routines.slice(routineIndex + 1)] })
                navigate(-1)
                message.success('Rutina eliminada correctamente')
            }
        }
    }

    return (
        <div className={style.footer}>

            <div className={style.actions}>
                <div className={style.upperButtons}>
                    <Button
                        style={{ width: '100%' }}
                        type="primary"
                        disabled={!enableSave}
                        onClick={handleOnSave}>
                        Guardar
                    </Button>
                    <Button
                        style={{ width: '100%' }}
                        type="default"
                        onClick={handleOnCancel}>
                        Cancelar
                    </Button>
                </div>
                <Popconfirm
                    title="¿Estás seguro de que deseas eliminar esta rutina?"
                    cancelText="Cancelar"
                    okText="Eliminar"
                    okButtonProps={{ danger: true }}
                    onConfirm={handleOnDeleteRoutine}>
                    <Button
                        style={{ width: '100%' }}
                        type="link"
                        danger>
                        Eliminar Rutina
                    </Button>
                </Popconfirm>
            </div>
            <RoutineId />
        </div>
    );
}

export default Footer;