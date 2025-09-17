import Text from '@components/Text';
import style from './style.module.css'
import { Button, message, Popconfirm } from 'antd';
import React, { useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { routineConfigurationContext } from '../..';
import useProject from '@hooks/useProject';
import RoutineId from './components/RoutineId';
import { nanoid } from 'nanoid';

const Footer = () => {
    const { routineId } = useParams()
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


    const handleOnSave = () => {
        const routineIndex = project?.routines?.findIndex(r => r.id === routine.id)
        if (routineIndex === -1 || routineIndex === undefined) {
            setProject({ ...project, routines: [...project.routines, routine] })
        } else {
            setProject({ ...project, routines: [...project.routines.slice(0, routineIndex), routine, ...project.routines.slice(routineIndex + 1)] })
        }
        message.success(`Rutina ${routineIndex === -1 || routineIndex === undefined ? 'creada' : 'actualizada'} correctamente`)
        navigate(`/builder/${routine.id}`, { replace: true })
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

    const handleOnDuplicateRoutine = () => {
        if (routine?.id) {
            const newRoutine = { ...routine, id: nanoid(10), name: `${routine.name} (Copia)` }
            setProject({ ...project, routines: [...project.routines, newRoutine] })
            navigate(`/builder/newRoutine`, { replace: true })
            message.success('Rutina duplicada correctamente')
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
                        {routineId === 'newRoutine' ? 'Crear Rutina' : 'Guardar Cambios'}
                    </Button>
                    {
                        routineId !== 'newRoutine' &&
                        <Button
                            style={{ width: '100%' }}
                            type="default"
                            disabled={!enableSave}
                            onClick={handleOnDuplicateRoutine}>
                            Duplicar Rutina
                        </Button>
                    }
                </div>
                <Popconfirm
                    disabled={routineId === 'newRoutine'}
                    title="¿Estás seguro de que deseas eliminar esta rutina?"
                    cancelText="Cancelar"
                    okText="Eliminar"
                    okButtonProps={{ danger: true }}
                    onConfirm={handleOnDeleteRoutine}>
                    <Button
                        disabled={routineId === 'newRoutine'}
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