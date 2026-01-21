import React from "react";
import { ScreenControllerContext } from "@contexts/ScreenControllerContextProvider";

export const useScreenController = () => {
    const context = React.useContext(ScreenControllerContext);
    if (!context) {
        throw new Error('useScreenController must be used within a ScreenControllerContextProvider');
    }
    
    const { screenState, turnOnScreen, turnOffScreen } = context;

    return {
        screenState,
        turnOnScreen,
        turnOffScreen
    };
};


