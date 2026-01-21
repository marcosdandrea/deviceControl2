export type enabledSounds = {
    click: boolean; 
    enable: boolean; 
    disable: boolean;
    welcome: boolean;   
    error: boolean;   
    success: boolean; 
}

export type soundTheme = {
    enabledSounds: enabledSounds;
    volume: number;
}