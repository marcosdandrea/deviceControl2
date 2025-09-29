import React from "react";
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
import { MdEventNote } from "react-icons/md";


type Props = {
    routineData: RoutineType;
    onSwipeLeft?: (routineId: string) => void;
};

const Routine = ({ routineData, onSwipeLeft }: Props) => {
    const disableRoutineSwipe = true; // setear true para deshabilitar el swipe (testing)
    const maxDisplacementInPixels = 4 * 16;   // límite visual
    const activationThreshold = 60;        // umbral para disparar acción
    const resistanceK = 0.018;             // “dureza” del resorte (más alto = más duro)

    const startXRef = React.useRef<number | null>(null);
    const draggingRef = React.useRef(false);
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    const [dx, setDx] = React.useState(0);
    const [dragging, setDragging] = React.useState(false);
    const [triggerOnSwipeLeft, setTriggerOnSwipeLeft] = React.useState(false);

    const lastEvent = useRoutineEvents(routineData.id, [
        routineEvents.routineCompleted,
        routineEvents.routineAborted,
        routineEvents.routineRunning,
        routineEvents.routineFailed,
        routineEvents.routineAutoCheckingConditions,
        routineEvents.routineIdle,
        routineEvents.routineTimeout
    ]);

    // Curva “resorte” (rubber-band). Para deltas negativos (izquierda).
    // visible = -max * (1 - e^{-k*|delta|}) ; acota en [-max, 0]
    const rubberBandLeft = (deltaX: number, max: number, k: number) => {
        if (deltaX >= 0) return 0; // sólo permitimos arrastrar a la izquierda
        const mag = Math.abs(deltaX);
        const eased = max * (1 - Math.exp(-k * mag));
        return -Math.min(eased, max);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        if (disableRoutineSwipe) return;
        startXRef.current = e.clientX;
        draggingRef.current = true;
        setDragging(true);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!draggingRef.current || startXRef.current === null) return;
        e.preventDefault();

        const rawDelta = e.clientX - startXRef.current; // será negativo al ir a la izquierda
        const easedDx = rubberBandLeft(rawDelta, maxDisplacementInPixels, resistanceK);
        setDx(easedDx);
        setTriggerOnSwipeLeft(easedDx > -activationThreshold);
    };

    const finishDrag = (e: React.PointerEvent) => {
        if (!draggingRef.current) return;

        const surpassed = Math.abs(dx) >= activationThreshold;

        draggingRef.current = false;
        setDragging(false);

        if (surpassed) {
            onSwipeLeft?.(routineData.id);
            // Pequeña confirmación visual: un “nudge” adicional y vuelta
            if (containerRef.current) {
                containerRef.current.animate(
                    [
                        { transform: `translateX(${dx}px)` },
                        { transform: `translateX(${dx - 8}px)` },
                        { transform: `translateX(0px)` }
                    ],
                    { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" }
                );
            }
            setDx(0);
        } else {
            // Snap elástico de vuelta al origen (rebote suave)
            if (containerRef.current) {
                containerRef.current.animate(
                    [
                        { transform: `translateX(${dx}px)` },
                        { transform: `translateX(10px)` },
                        { transform: `translateX(0px)` }
                    ],
                    { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" }
                );
            }
            setDx(0);
        }
    };

    return (
        <RoutineContextProvider routine={routineData}>
            <div className={style.routineContainer}>
                <div
                    ref={containerRef}

                    style={{
                        // Sin transición mientras arrastramos; las animaciones se hacen con WAAPI al soltar
                        transition: dragging ? "none" : "transform 0s",
                        transform: `translateX(${dx}px)`,
                        userSelect: dragging ? "none" : "auto",
                        touchAction: "none"
                    }}
                    className={`${style.routine} ${routineData.enabled ? "" : style.disabled}`}>
                    <RoutineStatusTag event={lastEvent} />
                    <div
                        className={style.routineContent}>
                        <div
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={finishDrag}
                            onPointerCancel={finishDrag}
                            onPointerLeave={(e) => draggingRef.current && finishDrag(e)}
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
                <div className={style.routineLog}>
                    <MdEventNote size={24} style={{ position: "absolute" }} />
                    <div
                        style={{
                            transform: `scale(${triggerOnSwipeLeft ? 0 : 0.8})`,
                            backgroundColor: Color.primary,
                        }}
                        className={style.swipeProgress} />
                </div>
            </div>
        </RoutineContextProvider>
    );
};

export default Routine;
