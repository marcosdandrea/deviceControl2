import React, { useContext, useEffect, useState } from 'react';
import style from "./style.module.css";
import { RoutineStatus } from "@common/types/routine.type";
import StatusTag from "@components/StatusTag";
import routineEvents from '@common/events/routine.events';
import { Color } from '@common/theme/colors';
import { MdAutorenew, MdDone, MdError, MdHelp, MdStopCircle } from "react-icons/md";
import { RoutineContext } from '@contexts/routineContextProvider';

const RoutineStatusTag = ({ event }: { event: { event: string, data: any } }) => {

    const { routine, getColor } = useContext(RoutineContext)

    const [color, setColor] = useState<string>(Color.unknown);
    const [icon, setIcon] = useState<React.ReactNode>(null);
    const [expandTag, setExpandTag] = useState<boolean>(false);

    const updateExpandTag = (routineStatus) => {

        switch (routineStatus) {
            case routineEvents.routineRunning:
                setExpandTag(true);
                break;
            case routineEvents.routineCompleted:
                setExpandTag(false);
                break;
            case routineEvents.routineAutoCheckingConditions:
                setExpandTag(true);
                break;
            case routineEvents.routineAborted:
                setExpandTag(false);
                break;
            case routineEvents.routineFailed:
                setExpandTag(false);
                break;
            case "unknown":
                setExpandTag(false);
                break;
            default:
                setExpandTag(false);
        }
    }

    const updateIcon = async (status: RoutineStatus) => {
        switch (status) {
            case routineEvents.routineAutoCheckingConditions:
                setIcon(<MdAutorenew size={22} className={style.rotatingIcon} />);
                break;
            case routineEvents.routineRunning:
                setIcon(<MdAutorenew size={22} className={style.rotatingIcon} />)
                break;
            case routineEvents.routineCompleted:
                setIcon(<MdDone size={22} />)
                break;
            case routineEvents.routineAborted:
                setIcon(<MdStopCircle size={22} />);
                break;
            case routineEvents.routineFailed:
                setIcon(<MdError size={22} />);
                break;
            default:
                setIcon(<MdHelp size={22} />);
        }
    }

    useEffect(() => {
        if (!routine) return;
        const routineStatus = routine.status as RoutineStatus;
        setColor(getColor(routineStatus));
        updateIcon(routineStatus);
        updateExpandTag(routineStatus);
    }, [routine]);

    useEffect(() => {
        if (!event) return;
        const eventStatus = event.event as RoutineStatus;
        setColor(getColor(eventStatus));
        updateIcon(eventStatus);
        updateExpandTag(eventStatus);
    }, [event]);

    return (
            <StatusTag
                expand={expandTag}
                color={color}
                icon={icon} />
    );
}

export default RoutineStatusTag;