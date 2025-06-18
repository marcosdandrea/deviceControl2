import { describe, expect, it, vi } from "vitest";

describe("PresetFactory tests", () => {

    vi.setConfig({ testTimeout: 120000 })


    it("should create a Wake On Lan preset and test if its working", async () => {
        const { wakeOnLanPresetTask } = await import("./index.js");

        const ipAddress = "192.168.100.63"
        const macAddress = "D8:9E:F3:0A:8A:D3"; //D3

        const WOLTaskPreset = wakeOnLanPresetTask({ macAddress, ipAddress, retries: 5 });

        expect(WOLTaskPreset).toBeDefined()
        expect(WOLTaskPreset.name).toBe("Wake on LAN")
        expect(WOLTaskPreset.description).toBe("Task to wake up a device using Wake on LAN protocol");
        expect(WOLTaskPreset.job).toBeDefined();
        expect(WOLTaskPreset.job?.name).toBe("Send Wake on LAN packet");
        expect(WOLTaskPreset.job?.params.portNumber).toBe(7)
        expect(WOLTaskPreset.job?.params.message).toBeDefined()
        expect(WOLTaskPreset.condition).toBeDefined()
        expect(WOLTaskPreset.condition?.name).toBe("Check if device is reachable")

        try {
            const abortSignal = new AbortController().signal
            await WOLTaskPreset.run({ abortSignal })
            expect(WOLTaskPreset.failed).toBe(false)
            expect(WOLTaskPreset.aborted).toBe(false)
        } catch (error) {
            throw error
        }

    });
})