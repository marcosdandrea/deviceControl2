import React, { useContext } from "react";
import { SoundContext } from "@contexts/SoundContextProvider";
import { enabledSounds } from "@common/types/sound.type";
import ScreenTitle from "../../../components/ScreenTitle";
import Row from "../../../components/Row";
import Switch from "../../../components/Switch";
import style from "./style.module.css";

const SOUND_ITEMS: { key: keyof enabledSounds; label: string }[] = [
    { key: "click", label: "Sonido de Click" },
    { key: "enable", label: "Sonido de Habilitación" },
    { key: "disable", label: "Sonido de Deshabilitación" },
    { key: "welcome", label: "Sonido de Bienvenida" },
    { key: "error", label: "Sonido de Error" },
    { key: "success", label: "Sonido de Éxito" },
];

const Sonido = () => {
    const soundContext = useContext(SoundContext);
    if (!soundContext) return null;

    const { soundTheme, updateSoundSetting } = soundContext;

    return (
        <div className={style.wrapper}>
            <ScreenTitle title="Configuración de Sonido" description="Activa o desactiva los sonidos de la interfaz." />
            <div>
                {SOUND_ITEMS.map((item, index) => (
                    <Row
                        key={item.key}
                        label={item.label}
                        padding={11}
                        bordered={index < SOUND_ITEMS.length - 1}
                    >
                        <Switch
                            checked={soundTheme.enabledSounds[item.key]}
                            onChange={(checked) => updateSoundSetting(item.key, checked)}
                        />
                    </Row>
                ))}
            </div>
        </div>
    );
};

export default Sonido;
