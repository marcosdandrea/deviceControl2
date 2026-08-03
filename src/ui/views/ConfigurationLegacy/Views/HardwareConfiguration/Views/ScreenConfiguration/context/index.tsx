import React from "react";

export const ScreenContext = React.createContext({});

export type screenContextType = {
    autoTurnOff: {
        value: number,
        set: React.Dispatch<React.SetStateAction<number>>
    }
};

const ScreenContextProvider = ({children}:{children: React.ReactNode}) => {
    const [autoTurnOff, setAutoTurnOff] = React.useState(0);

    const value = {
        autoTurnOff: {
            value: autoTurnOff,
            set: setAutoTurnOff
        }
    } as screenContextType;

    return ( 
    <ScreenContext.Provider value={value}>
        {children}
    </ScreenContext.Provider> );
}
 
export default ScreenContextProvider;
