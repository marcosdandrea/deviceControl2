import { Input } from 'antd';
import React, { useContext } from 'react';
import { routineConfigurationContext } from '../..';

const RoutineName = () => {
    const { routine, setRoutine } = useContext(routineConfigurationContext)

    const handleOnChangeName = (e) => {
        const newName = e.target.value;
        setRoutine({ ...routine, name: newName })
    }

    return (
        <Input
            tabIndex={1}
            placeholder="Nombre de la rutina"
            status={!routine?.name ? "error" : routine && routine.name.trim() === '' ? 'error' : ''}
            addonBefore="Nombre"
            value={routine ? routine.name : ''}
            onChange={handleOnChangeName}
        />
    );
}
 
export default RoutineName;