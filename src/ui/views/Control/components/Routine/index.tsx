import React from "react";
import style from "./style.module.css";
import { Color } from "@common/theme/colors";
import Text from "@components/Text";
import { RoutineStatus, RoutineType } from "@common/types/routine.type";
import RoutineStatusTag from "./components/RoutineStatusTag";
import PlayRoutineButton from "./components/PlayRoutineButton";
import ActivityLogButton from "./components/ActivityLogButton";
import { RoutineContextProvider } from "@contexts/routineContextProvider";
import StatusLabel from "./components/StatusLabel";
import useRoutineEvents from "@hooks/useRoutineEvents";
import routineEvents from "@common/events/routine.events";
import ExpansiveWave from "./components/RoutineStatusTag/component/ExpansiveWave";


const Routine = ({ routineData }: { routineData: RoutineType }) => {

    let lastEvent = useRoutineEvents(routineData.id, [
        routineEvents.routineCompleted,
        routineEvents.routineAborted,
        routineEvents.routineRunning,
        routineEvents.routineFailed,
        routineEvents.routineAutoCheckingConditions,
        routineEvents.routineIdle
    ])

    return (
        <RoutineContextProvider routine={routineData}>
            <div
                className={routineData.enabled ? style.routine : style.routineDisabled}>
                <RoutineStatusTag event={lastEvent} />
                <div className={style.routineContent}>
                    <div
                        style={{
                            display: routineData.hidden ? "none" : "flex",
                        }}
                        className={style.routineInfo}>
                        <Text text={routineData.name} fontFamily={"Open Sans SemiBold"} color={Color.textPrimary} uppercase={true} size={18} />
                        <Text text={routineData.description} size={14} fontFamily="Open Sans Italic" />
                        <StatusLabel event={lastEvent} />
                    </div>
                    <div className={style.routineActions}>
                        {
                            <PlayRoutineButton
                                event={lastEvent}
                                enabled={routineData.enabled} />
                        }
                        <ActivityLogButton onClick={() => { }} enabled={true} />
                    </div>
                </div>
                <ExpansiveWave event={lastEvent} />
            </div>
        </RoutineContextProvider>
    );
}

export default Routine;