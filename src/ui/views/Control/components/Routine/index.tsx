import React, { useContext, useEffect, useMemo } from "react";
import style from "./style.module.css";
import { Color } from "@common/theme/colors";
import Text from "@components/Text";
import { RoutineType } from "@common/types/routine.type";
import RoutineStatusTag from "./components/RoutineStatusTag";
import PlayRoutineButton from "./components/PlayRoutineButton";
import { RoutineContextProvider } from "@contexts/routineContextProvider";
import StatusLabel from "./components/StatusLabel";
import useRoutineEvents from "@hooks/useRoutineEvents";
import routineEvents from "@common/events/routine.events";
import ExpansiveWave from "./components/RoutineStatusTag/component/ExpansiveWave";
import RoutineSlider from "./components/RoutineSlider";
import { SocketIOContext } from "@components/SocketIOProvider";
import routineCommands from "@common/commands/routine.commands";
import { MdCheckCircle, MdDoDisturbOn } from "react-icons/md";

type Props = {
    routineData: RoutineType;
};

const Routine = React.memo(({ routineData }: Props) => {

    const {emit} = useContext(SocketIOContext)
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    const eventsToListen = useMemo(() => [
        routineEvents.routineCompleted,
        routineEvents.routineAborted,
        routineEvents.routineRunning,
        routineEvents.routineFailed,
        routineEvents.routineAutoCheckingConditions,
        routineEvents.routineIdle,
        routineEvents.routineTimeout,
        routineEvents.routineStatusReseted,
        routineEvents.routineEnabledStatusChanged
    ], []);

    const handleOnEnableRoutine = () => {
        emit(routineCommands.enableRoutine, { routineId: routineData.id })
    }

    const handleOnDisableRoutine = () => {
        emit(routineCommands.disableRoutine, { routineId: routineData.id })
    }

    return (
        <RoutineContextProvider routine={routineData}>

            <div className={style.routineContainer}>
                <RoutineSlider
                    leftUnderComponent={
                        <UnderComponent 
                            backgroundColor={Color.failed}
                            icon={<MdDoDisturbOn size={30} color={Color.white}/>} />
                    }
                    rightUnderComponent={
                        <UnderComponent 
                            backgroundColor={Color.completed}
                            icon={<MdCheckCircle size={30} color={Color.white}/>} />
                    }
                    onRightSlide={handleOnEnableRoutine}
                    onLeftSlide={handleOnDisableRoutine}
                    slideLeft={routineData.allowUserDisable}
                    slideRight={routineData.allowUserDisable}>
                    <RoutineContent
                        routineData={routineData}
                        containerRef={containerRef}
                        eventsToListen={eventsToListen} />
                </RoutineSlider>
            </div>
        </RoutineContextProvider>
    );
});

const UnderComponent = ({icon, backgroundColor}) => {
    return (
        <div 
            style={{
                backgroundColor
            }}
            className={style.underComponentContent}>
            {icon}
        </div>
    )
}

type RoutineContentProps = {
    routineData: RoutineType;
    containerRef: React.RefObject<HTMLDivElement>;
    eventsToListen: string[];
};

const RoutineContent = React.memo(({ routineData, containerRef, eventsToListen }: RoutineContentProps) => {

    const lastEvent = useRoutineEvents(routineData.id, eventsToListen)

    const [enabled, setEnabled] = React.useState(routineData.enabled);

    useEffect(() => {
        if (lastEvent?.event === routineEvents.routineEnabledStatusChanged) {
            setEnabled(lastEvent.data.enabled);
        }
    }, [lastEvent]);

    return (
        <div
            ref={containerRef}
            className={`${style.routine} ${enabled ? "" : style.routineDisabled}`}>
            <RoutineStatusTag event={lastEvent} />
            <div
                className={style.routineContent}>
                <div
                    style={{ display: routineData.hidden ? "none" : "flex" }}
                    className={style.routineInfo}>
                    <Text
                        text={routineData.name}
                        fontFamily={"Open Sans SemiBold"}
                        color={Color.textPrimary}
                        uppercase={true}
                        size={18} />
                    <Text text={routineData.description} size={14} fontFamily="Open Sans Italic" />
                    <StatusLabel event={lastEvent} />
                </div>
                <div className={style.routineActions}>
                    <PlayRoutineButton event={lastEvent} enabled={enabled} />
                </div>
            </div>
            <ExpansiveWave event={lastEvent} />
        </div>
    )
});
export default Routine;
