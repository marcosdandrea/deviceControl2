import React, { useContext, useEffect, useState } from "react";
import Button from "@components/Button";
import { MdPlayArrow, MdStop } from "react-icons/md";
import { Color } from "@common/theme/colors";
import { RoutineStatus } from "@common/types/routine.type";
import routineEvents from "@common/events/routine.events";
import { ProjectContext } from "@contexts/projectContextProvider";
import { RoutineContext } from "@contexts/routineContextProvider";
import { TriggerTypes } from "@common/types/trigger.type";
import { SocketIOContext } from "@components/SocketIOProvider";
import useSystemServerPorts from "@hooks/useSystemServerPorts";
import routineCommands from "@common/commands/routine.commands";

const PlayRoutineButton = ({ event, enabled }: { event: { event: string, data: any }, enabled: boolean }) => {

    const { project } = useContext(ProjectContext)
    const { routine } = useContext(RoutineContext);
    const {generalServerPort} = useSystemServerPorts();
    const {emit} = useContext(SocketIOContext)
    const [icon, setIcon] = useState(<></>);
    const [buttonColor, setButtonColor] = useState(Color.completed);
    const [showButton, setShowButton] = useState(true);
    const [apiTrigger, setApiTrigger] = useState(null);

    const updateIcon = (status: RoutineStatus) => {
        switch (status) {
            case routineEvents.routineRunning:
                setIcon(<MdStop size={22} />);
                break;
            case routineEvents.routineCompleted:
                setIcon(<MdPlayArrow size={22} />);
                break;
            case routineEvents.routineAborted:
                setIcon(<MdPlayArrow size={22} />);
                break;
            case routineEvents.routineFailed:
                setIcon(<MdPlayArrow size={22} />);
                break;
            default:
                setIcon(<MdPlayArrow size={22} />);
        }
    }

    const updateButtonColor = (status: RoutineStatus) => {
        switch (status) {
            case routineEvents.routineRunning:
                setButtonColor(Color.working);
                break;
            case routineEvents.routineCompleted:
                setButtonColor(Color.completed);
                break;
            case routineEvents.routineAborted:
                setButtonColor(Color.completed);
                break;
            case routineEvents.routineFailed:
                setButtonColor(Color.completed);
                break;
            default:
                setButtonColor(Color.completed);
        }
    }

    useEffect(() => {
        if (!routine) return;
        const routineStatus = routine.status as RoutineStatus;
        updateIcon(routineStatus);
        updateButtonColor(routineStatus);
    }, [routine])

    useEffect(() => {
        if (!event?.event) return
        updateIcon(event.event as RoutineStatus);
        updateButtonColor(event.event as RoutineStatus);
    }, [event])

    useEffect(() => {
        if (!project || !routine) return;
        const routineTriggers = project.triggers.filter(trigger => routine.triggersId?.some((triggerInstance: any) => {
            if (typeof triggerInstance === 'string')
                return triggerInstance === trigger.id;
            return triggerInstance.triggerId === trigger.id;
        }));
        const hasApiTrigger = routineTriggers.some(trigger => trigger.type === TriggerTypes.api);
        setApiTrigger(hasApiTrigger ? routineTriggers.find(trigger => trigger.type === TriggerTypes.api) : null);
        setShowButton(hasApiTrigger)
    }, [project, routine])

    const handleOnPress = () => {
        if (!generalServerPort)
            throw new Error("General server port is not defined");
        if (event?.event !== routineEvents.routineRunning) {
            let baseUrl = window.location.origin.split(":").slice(0, 2).join(":");
            const url = `${baseUrl}:${generalServerPort}${apiTrigger?.params?.endpoint || ""}`;
            fetch(url)
        } if (event?.event === routineEvents.routineRunning) {
            emit(routineCommands.abort, routine.id);
        }
    }

    return (
        <div
            style={{
                opacity: showButton ? 1 : 0,
                pointerEvents: showButton ? "inherit" : "none",
            }}>
            <Button
                enabled={enabled}
                color={enabled ? buttonColor : Color.disabled}
                icon={icon}
                onClick={handleOnPress}
            />
        </div>
    );
}

export default PlayRoutineButton;