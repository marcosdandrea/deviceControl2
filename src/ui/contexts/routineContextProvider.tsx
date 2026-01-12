import routineEvents from '@common/events/routine.events';
import { Color } from '@common/theme/colors';
import { RoutineInterface, RoutineStatus } from '@common/types/routine.type';
import React, { createContext, useState } from 'react';

export const RoutineContext = createContext(null);

export const getRoutineStatusColor = (status: RoutineStatus) => {
        switch (status) {
            case routineEvents.routineAutoCheckingConditions:
                return Color.working;
            case routineEvents.routineAborted:
                return Color.aborted;
            case routineEvents.routineCompleted:
                return Color.completed;
            case routineEvents.routineFailed:
                return Color.failed;
            case routineEvents.routineRunning:
                return Color.working;
            case routineEvents.routineTimeout:
                return Color.failed;
            case "unknown":
                return Color.unknown;
            default:
                return Color.unknown;
        }
    }

export const RoutineContextProvider = ({ children, routine }:{children: React.ReactNode, routine: RoutineInterface}) => {
    return (
        <RoutineContext.Provider value={{ routine, getColor:getRoutineStatusColor }}>
            {children}
        </RoutineContext.Provider>
    );
}


