import React, { useContext } from "react";
import { Switch } from "antd";
import { SoundContext } from "@contexts/SoundContextProvider";
import { enabledSounds } from "@common/types/sound.type";
import { HiSpeakerWave } from "react-icons/hi2";
import { MdVolumeUp, MdVolumeOff } from "react-icons/md";
import style from "./style.module.css";

const SoundConfiguration = () => {
    const soundContext = useContext(SoundContext);
    
    if (!soundContext) {
        return <div>Error: SoundContext not available</div>;
    }
    
    const { soundTheme, updateSoundSetting } = soundContext;
    
    console.log('SoundConfiguration rendered with theme:', soundTheme);

    const soundItems = [
        {
            key: 'click' as keyof enabledSounds,
            label: 'Sonido de Click',
            description: 'Reproducir sonido al hacer clic en botones',
            icon: <HiSpeakerWave />,
        },
        {
            key: 'enable' as keyof enabledSounds,
            label: 'Sonido de Habilitación',
            description: 'Reproducir sonido al habilitar rutinas',
            icon: <MdVolumeUp />,
        },
        {
            key: 'disable' as keyof enabledSounds,
            label: 'Sonido de Deshabilitación',
            description: 'Reproducir sonido al deshabilitar rutinas',
            icon: <MdVolumeOff />,
        },
        {
            key: 'welcome' as keyof enabledSounds,
            label: 'Sonido de Bienvenida',
            description: 'Reproducir sonido al iniciar el dispositivo de control',
            icon: <HiSpeakerWave />,
        },
        {
            key: 'error' as keyof enabledSounds,
            label: 'Sonido de Error',
            description: 'Reproducir sonido cuando una rutina termina con error',
            icon: <MdVolumeOff />,
        },
        {
            key: 'success' as keyof enabledSounds,
            label: 'Sonido de Éxito',
            description: 'Reproducir sonido cuando una rutina completa exitosamente',
            icon: <MdVolumeUp />,
        },
    ];

    return (
        <div className={style.soundConfiguration}>
            <div className={style.header}>
                <HiSpeakerWave />
                Configuración de Sonido
            </div>
            
            <div className={style.description}>
                Configure qué sonidos desea que reproduzca el sistema durante su funcionamiento
            </div>

            <div>
                {soundItems.map((item) => (
                    <div key={item.key} className={style.soundCard}>
                        <div className={style.cardContent}>
                            <div className={style.soundInfo}>
                                <div className={style.soundIcon}>
                                    {item.icon}
                                </div>
                                <div className={style.soundDetails}>
                                    <div className={style.soundLabel}>
                                        {item.label}
                                    </div>
                                    <div className={style.soundDescription}>
                                        {item.description}
                                    </div>
                                </div>
                            </div>
                            <Switch
                                checked={soundTheme.enabledSounds[item.key]}
                                onChange={(checked) => updateSoundSetting(item.key, checked)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SoundConfiguration;
