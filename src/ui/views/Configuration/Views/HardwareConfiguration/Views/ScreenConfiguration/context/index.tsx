import React from "react";

export const ScreenContext = React.createContext({});

export type screenContextType = {
    autoTurnOff: {
        value: boolean,
        set: React.Dispatch<React.SetStateAction<boolean>>
    },
    brightness: {
        value: number,
        set: React.Dispatch<React.SetStateAction<number>>
    }
};

const ScreenContextProvider = ({children}) => {
    const [autoTurnOff, setAutoTurnOff] = React.useState(false);
    const [brightness, setBrightness] = React.useState(5);

    const value = {
        autoTurnOff: {
            value: autoTurnOff,
            set: setAutoTurnOff
        },
        brightness: {
            value: brightness,
            set: setBrightness
        }
    } as screenContextType;

    return ( 
    <ScreenContext.Provider value={value}>
        {children}
    </ScreenContext.Provider> );
}
 
export default ScreenContextProvider;
