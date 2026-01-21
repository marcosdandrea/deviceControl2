import { SoundContext } from "@contexts/SoundContextProvider";
import React from "react";

export const useSounds = () => {
    const context = React.useContext(SoundContext);

    if (!context) {
        throw new Error('useSounds must be used within a SoundContextProvider');
    }

    const { 
        soundTheme,
        updateSoundSetting,
        updateVolume,
        playClickSound, 
        playEnableSound, 
        playDisableSound, 
        playWelcomeSound, 
        playErrorSound, 
        playSuccessSound 
    } = context;

    return {
        soundTheme,
        updateSoundSetting,
        updateVolume,
        playClickSound,
        playEnableSound,
        playDisableSound,
        playWelcomeSound,
        playErrorSound,
        playSuccessSound
    };
}
