import React, { useContext, useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import { RoutineContext } from '@contexts/routineContextProvider';

const ExpansiveWave = ({ event }) => {
    const timerRef = useRef<number | null>(null);
    const { getColor } = useContext(RoutineContext);
    const [showWave, setShowWave] = useState(false)
    const [waveColor, setWaveColor] = useState("transparent");

    useEffect(() => {
        if (!event?.event) return;
        const color = getColor(event.event);
        if (color) {
            setWaveColor(color);
            setShowWave(true);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                setShowWave(false);
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        }

    }, [event])

    if (!showWave)
        return null;
    return (
        <div className={style.expansiveWaveContainer}>
            <div
                className={style.expansiveWave}
                style={{ backgroundColor: waveColor }} />
        </div >
    );
}

export default ExpansiveWave;