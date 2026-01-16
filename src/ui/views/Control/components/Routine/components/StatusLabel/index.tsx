import React, { useContext, useEffect } from "react";
import Text from "@components/Text";
import { RoutineContext } from "@contexts/routineContextProvider";
import { Color } from "@common/theme/colors";
import routineEvents from "@common/events/routine.events";
import { RoutineInterface } from "@common/types/routine.type";

const StatusLabel = ({ event }) => {
    const { routineData } = useContext(RoutineContext) as { routineData: RoutineInterface };
    const [status, setStatus] = React.useState<string>("Desconocido");
    const [prevStatus, setPrevStatus] = React.useState<string>("Desconocido");

    const getStatusText = (status: string) => {

        switch (status) {
            case routineEvents.routineEnabledStatusChanged:
                return event.data.enabled ? "Habilitada" : "Deshabilitada";
            case routineEvents.routineAutoCheckingConditions:
                return "Comprobando condiciones automáticamente...";
            case routineEvents.routineAborted:
                return "Abortada";
            case routineEvents.routineCompleted:
                return "Completada";
            case routineEvents.routineFailed:
                return "Fallida";
            case routineEvents.routineTimeout:
                return "Agotado el tiempo de espera";            
            case routineEvents.routineRunning:
                return "En Ejecución";
            case "unknown":
                return "Desconocido";
            default:
                return "Desconocido";
        }
    }

    useEffect(() => {
        if (!routineData) return;
        const statusText = getStatusText(routineData.status);
        setStatus(statusText);
    }, [routineData]);

    useEffect(() => {
        if (!event) return;
        const statusText = getStatusText(event.event);

        if (event.event === routineEvents.routineIdle) {
            setStatus(prevStatus);
            return
        }

        if (event.event !== routineEvents.routineAutoCheckingConditions)
            setPrevStatus(statusText);

        setStatus(statusText);

    }, [event]);

    return (
        <Text
            text={`Estado: ${status}`}
            size={14}
            color={Color.textSecondary} />
    );
}

export default StatusLabel;