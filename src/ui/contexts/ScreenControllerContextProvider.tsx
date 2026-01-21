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
    const [isInitialized, setIsInitialized] = React.useState<boolean>(false);
    const transitionDuration = 500; // milisegundos

    // Función para apagar la pantalla
    const turnOffScreen = React.useCallback(() => {
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
    }, [emit, transitionDuration]);

    // Función para refrescar el temporizador de apagado automático
    const refreshScreenAutoOffTimmer = React.useCallback(() => {
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
    }, [autoOffTimeMs, turnOffScreen]);

    // Función para iniciar temporizador con un tiempo específico
    const startAutoOffTimer = React.useCallback((timeMs: number) => {
        // Limpiar el temporizador actual si existe
        if (autoOffTimmerRef.current) {
            clearTimeout(autoOffTimmerRef.current);
            autoOffTimmerRef.current = null;
        }

        // Si el tiempo es 0, no crear temporizador
        if (timeMs === 0) {
            return;
        }

        console.log('Iniciando temporizador de apagado automático:', timeMs + 'ms');
        
        // Crear nuevo temporizador
        autoOffTimmerRef.current = setTimeout(() => {
            console.log('Ejecutando apagado automático después de', timeMs + 'ms');
            turnOffScreen();
        }, timeMs);
    }, [turnOffScreen]);

    // Función para encender la pantalla
    const turnOnScreen = React.useCallback((shouldStartTimer: boolean = false) => {
        // Si estamos en transición de apagado, cancelarla
        if (isTransitioning) {
            setIsTransitioning(false);
        }
        
        // Inmediatamente mostrar la pantalla con transición
        setOpacity(1);
        
        emit(ScreenCommands.turnScreenOn, null, (response: { success: boolean; error?: string }) => {
            if (response.success) {
                setScreenState(ScreenState.ON);
                // Solo iniciar el temporizador si se especifica explícitamente
                if (shouldStartTimer) {
                    refreshScreenAutoOffTimmer();
                }
            } else {
                console.error('Error turning on screen:', response.error);
            }
        })
    }, [emit, isTransitioning, refreshScreenAutoOffTimmer]);

    useEffect(() => {
        // Si no tenemos proyecto aún, no hacer nada
        if (!project) return;
        
        setAutoOffTimeMs(project.screenAutoOffTimeMs || 0);
    }, [project]);

    // Efecto separado para manejar la inicialización automática del temporizador
    useEffect(() => {
        // Solo proceder si no estamos en modo preview y tenemos el proyecto
        if (isPreview || !project) return;
        
        const autoOffTime = project.screenAutoOffTimeMs || 0;
        
        console.log('ScreenController: Inicializando con proyecto, autoOffTime:', autoOffTime);
        
        // Si es la primera inicialización y hay tiempo configurado, iniciar temporizador
        if (!isInitialized && autoOffTime > 0) {
            console.log('ScreenController: Primera inicialización, iniciando temporizador automático');
            startAutoOffTimer(autoOffTime);
            setIsInitialized(true);
        } else if (isInitialized) {
            // Si ya estaba inicializado, manejar cambios de configuración
            if (autoOffTime === 0) {
                console.log('ScreenController: Limpiando temporizador (configurado a 0)');
                // Limpiar temporizador si se cambió a 0
                if (autoOffTimmerRef.current) {
                    clearTimeout(autoOffTimmerRef.current);
                    autoOffTimmerRef.current = null;
                }
            } else {
                console.log('ScreenController: Refrescando temporizador con nuevo tiempo:', autoOffTime);
                // Refrescar temporizador con nuevo tiempo
                startAutoOffTimer(autoOffTime);
            }
        }
    }, [project, isPreview, isInitialized, startAutoOffTimer]);

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
                turnOnScreen(false); // Encender pero no iniciar temporizador
            } else {
                // Si ya está encendida, solo limpiar el temporizador para mantenerla encendida
                if (autoOffTimmerRef.current) {
                    clearTimeout(autoOffTimmerRef.current);
                    autoOffTimmerRef.current = null;
                }
            }
        } else {
            // Si el tiempo no es 0, refrescar el temporizador de auto apagado
            startAutoOffTimer(newTime);
        }
    }, [project, setProject, screenState, turnOnScreen, startAutoOffTimer]);

    // Limpiar el temporizador cuando el componente se desmonte
    React.useEffect(() => {
        console.log('ScreenControllerContextProvider mounted, isPreview:', isPreview);
        
        return () => {
            if (autoOffTimmerRef.current) {
                clearTimeout(autoOffTimmerRef.current);
            }
        };
    }, []);

    const handleUserInteraction = React.useCallback(() => {
        if (screenState === ScreenState.OFF) {
            turnOnScreen(true); // Encender y iniciar temporizador
        } else {
            refreshScreenAutoOffTimmer(); // Solo reiniciar temporizador si ya está encendida
        }
    }, [screenState, turnOnScreen, refreshScreenAutoOffTimmer]);

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
                onTouchStart={handleUserInteraction}
                onKeyDown={handleUserInteraction}
                tabIndex={0}
            >
                {children}
            </div>
        </ScreenControllerContext.Provider>
    );
};