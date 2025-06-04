import { describe, expect, it, vi } from "vitest";
import { CronTrigger } from "./cron.trigger";
import triggerEvents from "@common/events/trigger.events";

describe("CronTrigger Tests", () => {

    vi.setConfig({ testTimeout: 70000 });

    it("should create a CronTrigger instance to be executed in a minute and waits for it to trigger", async () => {
        const date = new Date();
        const today = date.getDay();
        const todayAtZero = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        const dayTime = date.getTime() - todayAtZero.getTime();

        const cronTrigger = new CronTrigger({
            name: "test-cron-trigger",
            day: today,
            dayTime: dayTime + 60000, // Set to trigger in one minute
            reArmOnTrigger: true
        });

        expect(cronTrigger).toBeInstanceOf(CronTrigger);
        expect(cronTrigger.name).toBe("test-cron-trigger");
        expect(cronTrigger.day).toBe(today);
        expect(cronTrigger.dayTime).toBe(dayTime + 60000);
        expect(cronTrigger.reArmOnTrigger).toBe(true);

        cronTrigger.arm();

        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("Trigger did not fire within expected time"));
            }, 65000); // un poco más de un minuto

            cronTrigger.on(triggerEvents.triggered, () => {
                try {
                    console.log("Cron trigger has been triggered");
                    expect(cronTrigger.triggered).toBe(true);
                    expect(cronTrigger.armed).toBe(true);
                    cronTrigger.disarm();
                    clearTimeout(timeout);
                    resolve();
                } catch (err) {
                    clearTimeout(timeout);
                    reject(err);
                }
            });
        });
    });

})