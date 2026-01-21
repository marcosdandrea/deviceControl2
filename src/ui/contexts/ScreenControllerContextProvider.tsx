import { ScreenCommands } from '@common/commands/screen.commands';
import { SocketIOContext } from '@components/SocketIOProvider';
import React, { useContext, useEffect } from 'react';
import { ProjectContext } from './projectContextProvider';

export const ScreenControllerContext = React.createContext(null);

export enum ScreenState {
    ON = 'on',
    OFF = 'off'
}

export const ScreenControllerContextProvider = ({children, isPreview = false}: {children: React.ReactNode, isPreview?: boolean}) => {
    const {setProject, project} = useContext(ProjectContext);
    const {emit} = useContext(SocketIOContext)
    const [screenState, setScreenState] = React.useState<ScreenState>(ScreenState.ON);
    const [autoOffTimeMs, setAutoOffTimeMs] = React.useState<number>(0);
    const autoOffTimmerRef = React.useRef<NodeJS.Timeout | null>(null);
    const [opacity, setOpacity] = React.useState<number>(1);
    const [isTransitioning, setIsTransitioning] = React.useState<boolean>(false);
    const transitionDuration = 500; // milisegundos

    useEffect(() => {
            setAutoOffTimeMs(project?.screenAutoOffTimeMs || 0 );
            
            // Si el tiempo de auto apagado está en 0, encender la pantalla y mantenerla encendida
            if ((project?.screenAutoOffTimeMs || 0) === 0 && !isPreview) {
                if (screenState === ScreenState.OFF) {
                    turnOnScreen();
                }
                // Limpiar cualquier temporizador existente para mantener la pantalla encendida
                if (autoOffTimmerRef.current) {
                    clearTimeout(autoOffTimmerRef.current);
                    autoOffTimmerRef.current = null;
                }
            }

    }, [project, isPreview, screenState]);

    // Función para actualizar tanto el estado local como el proyecto
    const updateAutoOffTimeMs = React.useCallback((newTime: number) => {
        setAutoOffTimeMs(newTime);
        if (project) {
            setProject({
                ...project,
                screenAutoOffTimeMs: newTime
            });
        }
        
        // Si el nuevo tiempo es 0, encender la pantalla y mantenerla siempre encendida
        if (newTime === 0) {
            if (screenState === ScreenState.OFF) {
                turnOnScreen();
            } else {
                // Si ya está encendida, solo limpiar el temporizador para mantenerla encendida
                if (autoOffTimmerRef.current) {
                    clearTimeout(autoOffTimmerRef.current);
                    autoOffTimmerRef.current = null;
                }
            }
        } else {
            // Si el tiempo no es 0, refrescar el temporizador de auto apagado
            refreshScreenAutoOffTimmer();
        }
    }, [project, setProject, screenState]);

    // Limpiar el temporizador cuando el componente se desmonte
    React.useEffect(() => {
        console.log('ScreenControllerContextProvider mounted, isPreview:', isPreview);
        
        // Solo iniciar funcionalidades si no está en modo preview
        if (!isPreview) {
            turnOnScreen();
        }

        return () => {
            if (autoOffTimmerRef.current) {
                clearTimeout(autoOffTimmerRef.current);
            }
        };
    }, []);
    

    const refreshScreenAutoOffTimmer = () => {
        // Limpiar el temporizador actual si existe
        if (autoOffTimmerRef.current) {
            clearTimeout(autoOffTimmerRef.current);
            autoOffTimmerRef.current = null;
        }

        // Si el tiempo es 0, no crear temporizador (mantener siempre encendido)
        if (autoOffTimeMs === 0) {
            return;
        }

        // Crear nuevo temporizador
        autoOffTimmerRef.current = setTimeout(() => {
            turnOffScreen();
        }, autoOffTimeMs);
    };

    const turnOnScreen = () => {
        // Si estamos en transición de apagado, cancelarla
        if (isTransitioning) {
            setIsTransitioning(false);
        }
        
        // Inmediatamente mostrar la pantalla con transición
        setOpacity(1);
        
        emit(ScreenCommands.turnScreenOn, null, (response: { success: boolean; error?: string }) => {
            if (response.success) {
                setScreenState(ScreenState.ON);
                // Iniciar el temporizador de auto apagado cuando se enciende la pantalla
                refreshScreenAutoOffTimmer();
            } else {
                console.error('Error turning on screen:', response.error);
            }
        })
    }

    const turnOffScreen = () => {
        // Limpiar el temporizador al apagar la pantalla manualmente
        if (autoOffTimmerRef.current) {
            clearTimeout(autoOffTimmerRef.current);
            autoOffTimmerRef.current = null
        }

        // Comenzar transición de fade out
        setIsTransitioning(true);
        setOpacity(0);
        
        // Esperar que termine la transición antes de apagar la pantalla
        setTimeout(() => {
            emit(ScreenCommands.turnScreenOff, null, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    setScreenState(ScreenState.OFF);
                } else {
                    console.error('Error turning off screen:', response.error);
                    // En caso de error, restaurar la opacidad
                    setOpacity(1);
                }
                setIsTransitioning(false);
            })
        }, transitionDuration);
    }

    const handleUserInteraction = () => {
        if (screenState === ScreenState.OFF)
            turnOnScreen();
        refreshScreenAutoOffTimmer();
    };

    return (
        <ScreenControllerContext.Provider value={{ 
            screenState, 
            turnOnScreen, 
            turnOffScreen, 
            refreshScreenAutoOffTimmer,
            autoOffTimeMs,
            setAutoOffTimeMs: updateAutoOffTimeMs
        }}>
            <div
                style={{ 
                    width: '100%', 
                    height: '100%',
                    opacity: opacity,
                    transition: `opacity ${transitionDuration}ms ease-in-out`
                }}
                onClick={handleUserInteraction}
                onMouseMove={handleUserInteraction}
                onKeyDown={handleUserInteraction}
            >
                {children}
            </div>
        </ScreenControllerContext.Provider>
    );
};