import React, { createContext, useState } from 'react';

export const RoutineContext = createContext(null);

export const RoutineContextProvider = ({ children, routine }) => {
    //const [routine, setRoutine] = useState(null);

    return (
        <RoutineContext.Provider value={{ routine }}>
            {children}
        </RoutineContext.Provider>
    );
}


