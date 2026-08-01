import { ScreenCommands } from '@common/commands/screen.commands';
import { SocketIOContext } from '@components/SocketIOProvider';
import React, { useContext, useEffect } from 'react';
import { ProjectContext } from './projectContextProvider';
import useLicense from '@hooks/useLicense';

export const ScreenControllerContext = React.createContext(null);

export enum ScreenState {
    ON = 'on',
    OFF = 'off'
}

export const ScreenControllerContextProvider = ({children, isPreview = false}: {children: React.ReactNode, isPreview?: boolean}) => {
    const {setProject, project} = useContext(ProjectContext);
    const {emit} = useContext(SocketIOContext)
    const {isLicensed} = useLicense();
    const [screenState, setScreenState] = React.useState<ScreenState>(ScreenState.ON);
    // Espejo síncrono de screenState: los closures de eventos (touch/click) y el efecto de
    // inicialización lo leen desde acá en vez de la dependencia de React, para no depender del
    // timing de re-render y para no tener que incluir screenState en arrays de dependencias
    // (lo que antes reiniciaba temporizadores en cada cambio de estado).
    const screenStateRef = React.useRef<ScreenState>(ScreenState.ON);
    const setScreenStateSync = React.useCallback((next: ScreenState) => {
        screenStateRef.current = next;
        setScreenState(next);
    }, []);
    const [autoOffTimeMs, setAutoOffTimeMs] = React.useState<number>(0);
    const [maxBrightness, setMaxBrightnessState] = React.useState<number>(100);
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
        // Marcar el estado como apagado de inmediato (no esperar la confirmación del backend)
        // para que una interacción del usuario durante la transición dispare turnOnScreen()
        // en lugar de simplemente reiniciar el temporizador con la pantalla ya oscura.
        setScreenStateSync(ScreenState.OFF);

        // Esperar que termine la transición antes de apagar la pantalla
        setTimeout(() => {
            emit(ScreenCommands.turnScreenOff, null, (response: { success: boolean; error?: string }) => {
                if (!response.success) {
                    console.error('Error turning off screen:', response.error);
                    // En caso de error, restaurar la opacidad y el estado
                    setOpacity(1);
                    setScreenStateSync(ScreenState.ON);
                }
                setIsTransitioning(false);
            })
        }, transitionDuration);
    }, [emit, transitionDuration, setScreenStateSync]);

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

        // Crear nuevo temporizador
        autoOffTimmerRef.current = setTimeout(() => {
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
        setScreenStateSync(ScreenState.ON);

        emit(ScreenCommands.turnScreenOn, null, (response: { success: boolean; error?: string }) => {
            if (response.success) {
                // Solo iniciar el temporizador si se especifica explícitamente
                if (shouldStartTimer) {
                    refreshScreenAutoOffTimmer();
                }
            } else {
                console.error('Error turning on screen:', response.error);
                // El comando de hardware falló: revertir al estado apagado para no dejar
                // la UI creyendo que la pantalla está encendida cuando no lo está.
                setOpacity(0);
                setScreenStateSync(ScreenState.OFF);
            }
        })
    }, [emit, isTransitioning, refreshScreenAutoOffTimmer, setScreenStateSync]);

    useEffect(() => {
        // Si no tenemos proyecto aún, no hacer nada
        if (!project) return;

        setAutoOffTimeMs(project.screenAutoOffTimeMs || 0);
        setMaxBrightnessState(project.maxBrightness ?? 100);
    }, [project]);

    // Efecto separado para manejar la inicialización automática del temporizador.
    // No depende de screenState/turnOnScreen: los lee de screenStateRef para no reiniciarse
    // (y con eso reiniciar el temporizador) cada vez que la pantalla se prende o apaga.
    // Tampoco arranca el temporizador sin proyecto cargado o sin licencia válida: en esos
    // casos la pantalla debe permanecer siempre encendida.
    useEffect(() => {
        // Solo proceder si no estamos en modo preview, tenemos proyecto y hay licencia válida
        if (isPreview || !project || isLicensed === false) return;

        const autoOffTime = project.screenAutoOffTimeMs || 0;

        // Si es la primera inicialización y hay tiempo configurado, iniciar temporizador
        if (!isInitialized && autoOffTime > 0) {
            startAutoOffTimer(autoOffTime);
            setIsInitialized(true);
        } else if (isInitialized) {
            // Si ya estaba inicializado, manejar cambios de configuración
            if (autoOffTime === 0) {
                // Limpiar temporizador si se cambió a 0
                if (autoOffTimmerRef.current) {
                    clearTimeout(autoOffTimmerRef.current);
                    autoOffTimmerRef.current = null;
                }
                // Encender siempre (backlight + UI juntos) ya que el apagado automático se
                // desactivó. No confiamos en screenStateRef: puede llegar desde otra instancia
                // del contexto (p. ej. la vista de Configuración) cuyo estado local no refleja
                // el real, y encender una pantalla ya encendida es inofensivo.
                turnOnScreen(false);
            } else {
                // Refrescar temporizador con nuevo tiempo
                startAutoOffTimer(autoOffTime);
            }
        }
    }, [project, isPreview, isInitialized, isLicensed, startAutoOffTimer, turnOnScreen]);

    // Función para actualizar tanto el estado local como el proyecto
    const updateAutoOffTimeMs = React.useCallback((newTime: number) => {
        setAutoOffTimeMs(newTime);
        if (project) {
            setProject({
                ...project,
                screenAutoOffTimeMs: newTime
            });
        }
        // Persistir en el backend para que sobreviva a reinicios de la app
        emit(ScreenCommands.setAutoOffTimeMs, { ms: newTime }, (response: { success: boolean; error?: string }) => {
            if (!response.success) {
                console.error('Error persisting screen auto-off time:', response.error);
            }
        });

        // Si el nuevo tiempo es 0, encender la pantalla y mantenerla siempre encendida.
        // No confiamos en el screenState local: esta función puede ejecutarse desde una
        // instancia de contexto aislada (p. ej. la vista de Configuración con isPreview=true)
        // cuyo screenState nunca refleja el estado real de la pantalla física. Encender es
        // una operación inofensiva si ya estaba encendida, así que se llama siempre.
        if (newTime === 0) {
            if (autoOffTimmerRef.current) {
                clearTimeout(autoOffTimmerRef.current);
                autoOffTimmerRef.current = null;
            }
            turnOnScreen(false); // Encender pero no iniciar temporizador
        } else {
            // Si el tiempo no es 0, refrescar el temporizador de auto apagado
            startAutoOffTimer(newTime);
        }
    }, [project, setProject, turnOnScreen, startAutoOffTimer, emit]);

    // Función para actualizar el brillo máximo configurado. Persiste en el proyecto y,
    // si la pantalla está encendida, aplica el cambio de inmediato.
    const updateMaxBrightness = React.useCallback((percentage: number) => {
        setMaxBrightnessState(percentage);
        if (project) {
            setProject({
                ...project,
                maxBrightness: percentage
            });
        }
        emit(ScreenCommands.setMaxBrightness, { percentage }, (response: { success: boolean; error?: string }) => {
            if (!response.success) {
                console.error('Error setting max brightness:', response.error);
            }
        });
    }, [project, setProject, emit]);

    // Al iniciar la app, forzar el encendido físico de la pantalla una sola vez.
    // El estado inicial en memoria (ON, opacity 1) es solo una suposición del front-end;
    // el hardware puede haber quedado apagado de una sesión anterior. Esto sincroniza
    // ambos lados sin ambigüedad, sin esperar a que el usuario toque la pantalla.
    React.useEffect(() => {
        if (!isPreview) {
            turnOnScreen(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Limpiar el temporizador cuando el componente se desmonte
    React.useEffect(() => {
        return () => {
            if (autoOffTimmerRef.current) {
                clearTimeout(autoOffTimmerRef.current);
            }
        };
    }, []);

    // Cualquier interacción del usuario fuerza el encendido de la pantalla, sin importar
    // si el estado local cree que ya está encendida. No confiamos en screenState/screenStateRef
    // para esta decisión: es la misma lógica de "forzado" que usamos al iniciar la app, y
    // encender una pantalla que ya está encendida es una operación inofensiva. Esto también
    // reinicia el temporizador de apagado automático si está habilitado.
    const handleUserInteraction = React.useCallback(() => {
        turnOnScreen(true);
    }, [turnOnScreen]);

    return (
        <ScreenControllerContext.Provider value={{
            screenState,
            turnOnScreen,
            turnOffScreen,
            refreshScreenAutoOffTimmer,
            autoOffTimeMs,
            setAutoOffTimeMs: updateAutoOffTimeMs,
            maxBrightness,
            setMaxBrightness: updateMaxBrightness
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
