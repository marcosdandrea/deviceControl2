import { Input } from 'antd';
import React, { useContext } from 'react';
import { routineConfigurationContext } from '../..';

const RoutineDescription = () => {
    const { routine, setRoutine } = useContext(routineConfigurationContext)

    const handleOnChangeDescription = (e) => {
        const newDescription = e.target.value;
        setRoutine({ ...routine, description: newDescription })
    }


    return (
        <div>
            <Input.TextArea
                placeholder='Descripción de la rutina (opcional)'
                autoSize={{ minRows: 2, maxRows: 4 }}
                value={routine ? routine.description : ""}
                onChange={handleOnChangeDescription}
            />
        </div>
    );
}

export default RoutineDescription;