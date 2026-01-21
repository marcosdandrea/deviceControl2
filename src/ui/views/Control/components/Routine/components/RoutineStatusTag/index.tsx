import React, { useContext, useEffect, useState } from 'react';
import style from "./style.module.css";
import { RoutineStatus } from "@common/types/routine.type";
import StatusTag from "@components/StatusTag";
import routineEvents from '@common/events/routine.events';
import { Color } from '@common/theme/colors';
import { MdAutorenew, MdDone, MdError, MdHelp, MdStopCircle } from "react-icons/md";
import { RoutineContext } from '@contexts/routineContextProvider';
import { globalRoutineStatusContext } from '@views/Control/components/RoutineList';
import { useSounds } from '@hooks/useSounds';

const RoutineStatusTag = ({ event }: { event: { event: string, data: any } }) => {

    const { routine, getColor } = useContext(RoutineContext)
    const {setGlobalRoutineStatus} = useContext<any>(globalRoutineStatusContext);
    const {playErrorSound, playSuccessSound} = useSounds();

    const [color, setColor] = useState<string>(Color.unknown);
    const [icon, setIcon] = useState<React.ReactNode>(null);
    const [expandTag, setExpandTag] = useState<boolean>(false);
    const [prevStatus, setPrevStatus] = useState<{ color: string, icon: React.ReactNode, expand: boolean }>({
        color: Color.unknown,
        icon: null,
        expand: false
    });

    const updateGlobalStatus = (status: string) => {
        if(!setGlobalRoutineStatus || !routine) return;
        setGlobalRoutineStatus((prevStatuses:{routineId:string, status:string}[]) => {
            const otherStatuses = prevStatuses.filter(s => s.routineId !== routine.id);
            return [...otherStatuses, {routineId: routine.id, status}];
        });
    }

    React.useEffect(() => {
        if (routine) {
            updateGlobalStatus(color as string);
        }
    }, [color]);

    const getExpandTag = (routineStatus: RoutineStatus) => {

        switch (routineStatus) {
            case routineEvents.routineRunning:
                return true;
            case routineEvents.routineCompleted:
                {
                    playSuccessSound();
                    return false
                }
            case routineEvents.routineAutoCheckingConditions:
                return false;
            case routineEvents.routineAborted:
                {
                    playErrorSound();
                    return false
                }
            case routineEvents.routineFailed:
                {
                    playErrorSound();
                    return false
                }
            case routineEvents.routineIdle:
                return false;
            case routineEvents.routineTimeout:
                {
                    playErrorSound();
                    return false
                }
            default:
                return false;
        }
    }

    const getIcon = (status: RoutineStatus): React.ReactNode => {
        switch (status) {
            case routineEvents.routineAutoCheckingConditions:
                return (<MdAutorenew size={22} className={style.rotatingIcon}  color='white'/>);
            case routineEvents.routineRunning:
                return (<MdAutorenew size={22} className={style.rotatingIcon}  color='white'/>);
            case routineEvents.routineCompleted:
                return (<MdDone size={22}  color='white'/>);
            case routineEvents.routineAborted:
                return (<MdStopCircle size={22}  color='white'/>);
            case routineEvents.routineFailed:
                return (<MdError size={22}  color='white'/>);
            case routineEvents.routineTimeout:
                return (<MdError size={22}  color='white'/>);
            default:
                return (<MdHelp size={22} color='white' />);
        }
    }

    useEffect(() => {
        if (!routine) return;
        const routineStatus = routine.status as RoutineStatus;
        const newColor = getColor(routineStatus);
        const newIcon = getIcon(routineStatus);
        const newExpand = getExpandTag(routineStatus);
        setColor(newColor);
        setIcon(newIcon);
        setExpandTag(newExpand);
    }, [routine]);

    useEffect(() => {
        if (!event) return

        const eventStatus = event.event as RoutineStatus;

        if (eventStatus === routineEvents.routineIdle || eventStatus === routineEvents.routineAutoCheckingConditions) {
            setColor(prevStatus.color);
            setIcon(prevStatus.icon);
            setExpandTag(false);
            return;
        }

        // For statuses other than idle, update UI
        const newColor = getColor(eventStatus);
        const newIcon = getIcon(eventStatus);
        const newExpand = getExpandTag(eventStatus);
        setColor(newColor);
        setIcon(newIcon);
        setExpandTag(newExpand);

        // Only update prevStatus if the event is not Auto Checking Conditions
        if (eventStatus !== routineEvents.routineAutoCheckingConditions) {
            setPrevStatus({ color: newColor, icon: newIcon, expand: newExpand });
        }

    }, [event]);

    return (
        <StatusTag
            expand={expandTag}
            color={color}
            icon={icon} />
    );
}

export default RoutineStatusTag;