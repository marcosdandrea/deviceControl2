import React, { useRef, useState, useEffect } from 'react';
import style from './style.module.css';

export type RoutineSliderPropsType = {
    children: React.ReactNode;
    onRightSlide?: () => void;
    onLeftSlide?: () => void;
    slideLeft?: boolean;
    slideRight?: boolean;
    rightUnderComponent?: React.ReactNode;
    leftUnderComponent?: React.ReactNode;
    threshold?: number;
    maxSlideDistance?: number;
}

export const RoutineSlider = (props: RoutineSliderPropsType) => {
    const {
        children,
        onRightSlide,
        onLeftSlide,
        slideLeft = false,
        slideRight = false,
        rightUnderComponent,
        leftUnderComponent,
        threshold = 0.5,
        maxSlideDistance = 80
    } = props;

    const [translateX, setTranslateX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        startXRef.current = e.clientX;
        currentXRef.current = e.clientX;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        startXRef.current = e.touches[0].clientX;
        currentXRef.current = e.touches[0].clientX;
    };

    const handleMove = (clientX: number) => {
        if (!isDragging) return;

        const deltaX = clientX - startXRef.current;
        let newTranslateX = deltaX;

        // Limitar el deslizamiento según las props
        if (!slideLeft && deltaX < 0) {
            newTranslateX = 0;
        } else if (!slideRight && deltaX > 0) {
            newTranslateX = 0;
        } else {
            // Limitar al rango máximo
            newTranslateX = Math.max(-maxSlideDistance, Math.min(maxSlideDistance, deltaX));
        }

        setTranslateX(newTranslateX);
        currentXRef.current = clientX;
    };

    const handleMouseMove = (e: MouseEvent) => {
        handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
        handleMove(e.touches[0].clientX);
    };

    const handleEnd = () => {
        if (!isDragging) return;

        const slidePercentage = Math.abs(translateX) / maxSlideDistance;

        // Verificar si se superó el threshold
        if (slidePercentage >= threshold) {
            if (translateX > 0 && slideRight && onRightSlide) {
                onRightSlide();
            } else if (translateX < 0 && slideLeft && onLeftSlide) {
                onLeftSlide();
            }
        }

        // Resetear a la posición original
        setTranslateX(0);
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleEnd);

            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleEnd);
                window.removeEventListener('touchmove', handleTouchMove);
                window.removeEventListener('touchend', handleEnd);
            };
        }
    }, [isDragging, translateX]);

    return (
        <div className={style.RoutineSliderContainer}>
            {/* Under components */}
            {slideLeft && leftUnderComponent && (
                <div
                    className={[style.underComponent, style.underComponentLeft].join(' ')}
                    style={{
                        width: `${maxSlideDistance + 10}px`,
                        opacity: translateX < 0 ? Math.abs(translateX) / maxSlideDistance : 0,
                        transition: isDragging ? 'none' : 'opacity 0.3s ease',
                    }}
                >
                    {leftUnderComponent}
                </div>
            )}
            {slideRight && rightUnderComponent && (
                <div
                    className={[style.underComponent, style.underComponentRight].join(' ')}
                    style={{
                        width: `${maxSlideDistance + 10}px`,
                        opacity: translateX > 0 ? translateX / maxSlideDistance : 0,
                        transition: isDragging ? 'none' : 'opacity 0.3s ease',
                    }}
                >
                    {rightUnderComponent}
                </div>
            )}

            {/* Draggable content */}
            <div
                className={[style.draggableContent, isDragging ? style.dragging : style.idle].join(' ')}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                style={{
                    cursor: slideLeft || slideRight ? 'grab' : 'default',
                    transform: `translateX(${translateX}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease',
                }}
            >
                <div className={style.childrenContainer}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default RoutineSlider;