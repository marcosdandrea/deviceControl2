import React from 'react';
import style from './style.module.css';
import { MdAdd } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';

const NewRoutineGhost = React.forwardRef<HTMLDivElement>((props, ref) => {

    const navigate = useNavigate()
    const {groupId} = useParams()

    const handleOnCreateNewRoutine = () => {
        navigate(`/builder/${groupId}/newRoutine`)
    }

    return (<div
        ref={ref}
        className={style.addNewRoutine}
        onClick={handleOnCreateNewRoutine} >
        <div className={style.addNewRoutineContent}>
            <MdAdd size={30} />
            Agregar nueva Rutina
        </div>
    </div>);
})

export default NewRoutineGhost;