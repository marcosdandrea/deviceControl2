import React, { useContext } from "react";
import { Switch } from "antd";
import { SoundContext } from "@contexts/SoundContextProvider";
import { enabledSounds } from "@common/types/sound.type";
import { HiSpeakerWave } from "react-icons/hi2";
import { MdVolumeUp, MdVolumeOff } from "react-icons/md";
import SettingsSection from "@components/SettingsSection";
import SettingRow from "@components/SettingRow";
import style from "./style.module.css";

const SoundConfiguration = () => {
    const soundContext = useContext(SoundContext);

    if (!soundContext) {
        return <div>Error: SoundContext not available</div>;
    }

    const { soundTheme, updateSoundSetting } = soundContext;

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
            <SettingsSection
                title="Configuración de Sonido"
                icon={<HiSpeakerWave />}
                description="Configure qué sonidos desea que reproduzca el sistema durante su funcionamiento"
            >
                {soundItems.map((item) => (
                    <SettingRow
                        key={item.key}
                        icon={item.icon}
                        label={item.label}
                        description={item.description}
                    >
                        <Switch
                            checked={soundTheme.enabledSounds[item.key]}
                            onChange={(checked) => updateSoundSetting(item.key, checked)}
                        />
                    </SettingRow>
                ))}
            </SettingsSection>
        </div>
    );
};

export default SoundConfiguration;
