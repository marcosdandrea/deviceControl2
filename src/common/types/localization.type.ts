export interface TimezoneInfo {
    timezone: string;
    offset: string;
    localTime: string;
    universalTime: string;
    rtcTime: string;
    systemClockSynchronized: boolean;
    ntpService: string;
}

export interface LocalizationManagerInterface {
    getCurrentTimezone(): Promise<TimezoneInfo>;
    setTimezone(timezone: string): Promise<boolean>;
    listAvailableTimezones(): Promise<string[]>;
    validateTimezone(timezone: string): Promise<boolean>;
}