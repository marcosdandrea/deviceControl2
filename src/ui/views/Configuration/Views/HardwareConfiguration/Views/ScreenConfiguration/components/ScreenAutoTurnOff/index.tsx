import React from "react";
import { InputNumber } from "antd";
import { ScreenControllerContext } from "@contexts/ScreenControllerContextProvider";

const AutoTurnOff = () => {
    const context = React.useContext(ScreenControllerContext);
    
    if (!context) {
        throw new Error("AutoTurnOff must be used within a ScreenControllerContextProvider");
    }
    
    const { autoOffTimeMs, setAutoOffTimeMs } = context;

    const handleOnChange = (value: number | null) => {
        if (value === null) return;
        setAutoOffTimeMs(value * 60000); // Convertir minutos a milisegundos
    };

    const convertMsToMinutes = (ms: number) => {
        return Math.floor(ms / 60000); // Convertir milisegundos a minutos
    };

    const currentValue = convertMsToMinutes(autoOffTimeMs);

    return ( 
        <InputNumber
            min={0}
            max={60}
            step={1}
            value={currentValue}
            onChange={handleOnChange}
            placeholder={currentValue === 0 ? "Nunca" : undefined}
            formatter={(value) => currentValue === 0 ? "Nunca" : `${value} min`}
            parser={(value) => {
                if (value?.includes("Nunca")) return 0;
                return parseInt(value?.replace(" min", "") || "0");
            }}
            style={{ width: '100%' }}
        />
     );
}
 
export default AutoTurnOff;
