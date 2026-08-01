
export default {
    getSystemTime: "getSystemTime",
    getAppVersion: "getAppVersion",
    getServerPorts: "getServerPorts",
    getServerIp: "getServerIp",
    checkUDPPortAvailability: "checkUDPPortAvailability",
    checkTCPPortAvailability: "checkTCPPortAvailability",

    getIsSignedHardware: "getIsSignedHardware",
    getIsLinux: "getIsLinux",

    getLogRetentionDays: "getLogRetentionDays",
    setLogRetentionDays: "setLogRetentionDays",
    runLogsCleanupNow: "runLogsCleanupNow",

} as const;