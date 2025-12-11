import { Input } from 'antd';
import React, { useContext, useState, useEffect } from 'react';
import { routineConfigurationContext } from '../..';
import useDebounce from '@hooks/useDebounce';

const RoutineName = () => {
    const { routine, setRoutine } = useContext(routineConfigurationContext)
    const [localName, setLocalName] = useState(routine?.name || '');
    const debouncedName = useDebounce(localName, 300);

    // Sincronizar el valor debounced con el contexto
    useEffect(() => {
        console.log ('Debounced Name Effect Triggered:', debouncedName);
        if (debouncedName == "") return
        if (debouncedName !== routine?.name) {
            setRoutine({ ...routine, name: debouncedName });
        }
    }, [debouncedName, routine, setRoutine]);
    
    // Sincronizar cuando cambie la rutina externamente
    useEffect(() => {
        setLocalName(routine?.name || '');
    }, [routine?.name]);

    const handleOnChangeName = (e) => {
        setLocalName(e.target.value);
    }

    return (
        <Input
            tabIndex={1}
            placeholder="Nombre de la rutina"
            status={!localName ? "error" : localName.trim() === '' ? 'error' : ''}
            addonBefore="Nombre"
            value={localName}
            onChange={handleOnChangeName}
        />
    );
}
 
export default RoutineName;