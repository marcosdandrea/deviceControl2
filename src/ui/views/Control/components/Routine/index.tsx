import React, { useMemo } from "react";
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

type Props = {
    routineData: RoutineType;
};

const Routine = React.memo(({ routineData }: Props) => {

    const containerRef = React.useRef<HTMLDivElement | null>(null);

    const eventsToListen = useMemo(() => [
        routineEvents.routineCompleted,
        routineEvents.routineAborted,
        routineEvents.routineRunning,
        routineEvents.routineFailed,
        routineEvents.routineAutoCheckingConditions,
        routineEvents.routineIdle,
        routineEvents.routineTimeout,
        routineEvents.routineStatusReseted
    ], []);

    const lastEvent = useRoutineEvents(routineData.id, eventsToListen);

    console.log (`Routine ${routineData.name} rendered with last event:`, lastEvent);

    return (
        <RoutineContextProvider routine={routineData}>
            <div className={style.routineContainer}>
                <div
                    ref={containerRef}
                    className={`${style.routine} ${routineData.enabled ? "" : style.disabled}`}>
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
                            <PlayRoutineButton event={lastEvent} enabled={routineData.enabled} />
                        </div>
                    </div>
                    <ExpansiveWave event={lastEvent} />
                </div>
            </div>
        </RoutineContextProvider>
    );
});

export default Routine;
