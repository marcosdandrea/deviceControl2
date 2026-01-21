import React, { useEffect, useRef, useContext, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { ProjectContext } from "./projectContextProvider";
import { soundTheme, enabledSounds } from "@common/types/sound.type";
import clickSound from "@assets/sounds/click.wav";
import enableSound from "@assets/sounds/enable.wav";
import disableSound from "@assets/sounds/disable.wav";
import welcomeSound from "@assets/sounds/welcome.wav";
import errorSound from "@assets/sounds/error.wav";
import successSound from "@assets/sounds/success.wav";

type SoundContextType = {
    soundTheme: soundTheme;
    updateSoundSetting: (soundType: keyof enabledSounds, enabled: boolean) => void;
    updateVolume: (volume: number) => void;
    playClickSound: () => void;
    playEnableSound: () => void;
    playDisableSound: () => void;
    playWelcomeSound: () => void;
    playErrorSound: () => void;
    playSuccessSound: () => void;
};

export const SoundContext = React.createContext<SoundContextType | null>(null);

export const SoundContextProvider = ({children, isPreview}: {children: React.ReactNode, isPreview: boolean}) => {
    const audioInstancesRef = useRef<Map<string, HTMLAudioElement>>(new Map());
    const location = useLocation();
    const { project, setProject } = useContext(ProjectContext);
    const hasPlayedWelcomeRef = useRef(false);
    
    // Estado interno del soundTheme
    const [soundTheme, setSoundTheme] = useState<soundTheme>({
        enabledSounds: {
            click: true,
            enable: true,
            disable: true,
            welcome: true,
            error: true,
            success: true,
        },
        volume: 0.8,
    });
    
    console.log('SoundContextProvider mounted, isPreview:', isPreview);

    // Sincronizar soundTheme con el proyecto
    useEffect(() => {
        console.log('Project changed in SoundContextProvider:', {
            hasProject: !!project,
            projectId: project?.id,
            hasSoundTheme: !!project?.soundTheme,
            soundThemeConfig: project?.soundTheme
        });

        if (project?.soundTheme) {
            // Proyecto tiene configuración de sonido, cargarla
            console.log('Loading sound configuration from project:', project.soundTheme);
            setSoundTheme(project.soundTheme);
        } else if (project) {
            // Si el proyecto existe pero no tiene soundTheme, usar los valores por defecto y actualizar el proyecto
            console.log('Project has no sound theme, applying default configuration');
            const defaultSoundTheme: soundTheme = {
                enabledSounds: {
                    click: true,
                    enable: true,
                    disable: true,
                    welcome: true,
                    error: true,
                    success: true,
                },
                volume: 0.8,
            };
            setSoundTheme(defaultSoundTheme);
            if (setProject) {
                console.log('Updating project with default sound theme');
                setProject((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        soundTheme: defaultSoundTheme,
                    };
                });
            }
        } else {
            // No hay proyecto cargado, resetear a valores por defecto
            console.log('No project loaded, resetting to default sound theme');
            setSoundTheme({
                enabledSounds: {
                    click: true,
                    enable: true,
                    disable: true,
                    welcome: true,
                    error: true,
                    success: true,
                },
                volume: 0.8,
            });
        }
    }, [project, project?.soundTheme, setProject]);

    useEffect(() => {
        if (isPreview) {
            console.log('SoundContextProvider: Preview mode - sounds will not be played.');
            return; 
        }
        // Pre-cargar todos los sonidos de forma simple
        const preloadAudio = () => {
            const sounds = {
                click: clickSound,
                enable: enableSound,
                disable: disableSound,
                welcome: welcomeSound,
                success: successSound,
                error: errorSound
            };

            Object.entries(sounds).forEach(([key, soundFile]) => {
                try {
                    const audio = new Audio(soundFile);
                    audio.preload = 'auto';
                    audio.volume = 0.8;
                    audioInstancesRef.current.set(key, audio);
                    console.log(`Audio preloaded: ${key}`);
                } catch (error) {
                    console.error(`Error preloading sound ${key}:`, error);
                }
            });
        }

        preloadAudio()

        // Cleanup
        return () => {
            audioInstancesRef.current.forEach(audio => {
                audio.pause();
                audio.src = '';
            });
            audioInstancesRef.current.clear();
        };
    }, []);

    // Efecto separado para manejar el welcome sound cuando se navega a /control
    useEffect(() => {
        if (!isPreview && !hasPlayedWelcomeRef.current) {
            hasPlayedWelcomeRef.current = true;
            // Pequeño delay para dar tiempo a la carga
            setTimeout(() => {
                playWelcomeSound();
            }, 1000);
        }
        
        // Resetear el flag cuando se sale de las vistas de control
        if (isPreview) {
            hasPlayedWelcomeRef.current = false;
        }
    }, [isPreview]);

    const playSound = (soundKey: string) => {
        console.log(`Attempting to play sound: ${soundKey}`, {
            isPreview,
            soundEnabled: soundTheme.enabledSounds[soundKey as keyof enabledSounds],
            volume: soundTheme.volume,
            currentPath: location.pathname
        });

        // Solo reproducir sonidos si estamos en la vista de control
        if (isPreview) {
            console.log(`Sound blocked - not in control view. Current path: ${location.pathname}`);
            return;
        }

        // Verificar si el sonido específico está habilitado
        if (!soundTheme.enabledSounds[soundKey as keyof enabledSounds]) {
            console.log(`Sound ${soundKey} is disabled in settings`);
            return;
        }
        
        const audio = audioInstancesRef.current.get(soundKey);
        if (!audio) {
            console.error(`Sound not found: ${soundKey}`);
            return;
        }

        try {
            // Resetear si ya está reproduciendo
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }

            // Ajustar el volumen basado en la configuración
            audio.volume = soundTheme.volume;
            console.log(`Playing sound ${soundKey} with volume ${soundTheme.volume}`);

            // Reproducir
            const playPromise = audio.play();
            if (playPromise) {
                playPromise.catch((error) => {
                    console.warn(`Audio playback failed for ${soundKey}:`, error);
                });
            }
        } catch (error) {
            console.error(`Error playing sound ${soundKey}:`, error);
        }
    }

    const playClickSound = () => {        
        playSound('click');
    }

    const playEnableSound = () => {
        playSound('enable');
    }

    const playDisableSound = () => {
        playSound('disable');
    }

    const playWelcomeSound = () => {
        playSound('welcome');
    }

    const playErrorSound = () => {
        playSound('error');
    }

    const playSuccessSound = () => {
        playSound('success');
    }

    // Funciones para actualizar configuración
    const updateSoundSetting = useCallback((soundType: keyof enabledSounds, enabled: boolean) => {
        console.log(`Updating sound setting: ${soundType} = ${enabled}`);
        
        const updatedSoundTheme = {
            ...soundTheme,
            enabledSounds: {
                ...soundTheme.enabledSounds,
                [soundType]: enabled,
            },
        };
        
        setSoundTheme(updatedSoundTheme);
        
        // Actualizar el proyecto
        if (setProject) {
            console.log('Updating project with new sound setting');
            setProject((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    soundTheme: updatedSoundTheme,
                };
            });
        }
    }, [soundTheme, setProject]);

    const updateVolume = useCallback((volume: number) => {
        console.log(`Updating sound volume: ${volume}`);
        
        const updatedSoundTheme = {
            ...soundTheme,
            volume,
        };
        
        setSoundTheme(updatedSoundTheme);
        
        // Actualizar el proyecto
        if (setProject) {
            console.log('Updating project with new volume setting');
            setProject((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    soundTheme: updatedSoundTheme,
                };
            });
        }
    }, [soundTheme, setProject]);

    return (
        <SoundContext.Provider value={{ 
            soundTheme,
            updateSoundSetting,
            updateVolume,
            playClickSound,
            playEnableSound,
            playDisableSound,
            playWelcomeSound,
            playErrorSound,
            playSuccessSound
        }}>
            {children}
        </SoundContext.Provider>
    );
}

export default SoundContextProvider;