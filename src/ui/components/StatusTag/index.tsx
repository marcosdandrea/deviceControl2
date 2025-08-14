import React, { useEffect, useRef } from 'react';
import style from './style.module.css';

const StatusTag = ({ color, icon, expand }: { color: string; icon?: React.ReactNode; expand?: boolean }) => {

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [expandTag, setExpandTag] = React.useState<boolean>(false);

    useEffect(()=>{
        if (expand) {
            setExpandTag(true);
        } else {

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                setExpandTag(false);
            }, 2000); // Espera 2 segundos antes de contraer
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [expand])

    return (
        <div
            style={{
                backgroundColor: color,
                width: expandTag ? "4rem" : "0.5rem"
            }}
            className={style.statusTag}>
            {expandTag && icon && (
                <div className={style.iconContainer}>
                    {React.cloneElement(icon, { size: 25 })}
                </div>
            )}
        </div>
    );
}

export default StatusTag;