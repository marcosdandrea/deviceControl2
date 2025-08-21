import React, { useContext, useEffect } from "react";
import Text from "@components/Text";
import { RoutineContext } from "@contexts/routineContextProvider";
import { Color } from "@common/theme/colors";
import routineEvents from "@common/events/routine.events";

const StatusLabel = ({event}) => {
    const { routineData } = useContext(RoutineContext);
    const [status, setStatus] = React.useState<string>("Desconocido");
    const [prevStatus, setPrevStatus] = React.useState<string>("Desconocido");

    const setStatusLabel = (status: string) => {

        switch (status) {
            case routineEvents.routineAutoCheckingConditions:
                setStatus("Comprobando Condiciones");
                break;
            case routineEvents.routineAborted:
                setStatus("Abortada");
                break;
            case routineEvents.routineCompleted:
                setStatus("Completada");
                break;
            case routineEvents.routineFailed:
                setStatus("Fallida");
                break;
            case routineEvents.routineRunning:
                setStatus("En Ejecución");
                break;
            case routineEvents.routineIdle:
                break;
            case "unknown":
                setStatus("Desconocido");
                break;
            default:
                setStatus("Desconocido");
                break;
        }
    }

    useEffect(() => {
        if (!routineData) return;
        setStatusLabel(routineData.status);
    }, [routineData]);

    useEffect(() => {
        if (!event) return;
        if (event.event === routineEvents.routineIdle) {
            setStatus(prevStatus);
            return;
        }
        setStatusLabel(event.event);
        setPrevStatus(status);
    }, [event]);

    return (
        <Text
            text={`Estado: ${status}`}
            size={14}
            color={Color.textSecondary}/>
    );
}

export default StatusLabel;