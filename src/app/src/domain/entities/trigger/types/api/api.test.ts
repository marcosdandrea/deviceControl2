import { describe, expect, it } from "vitest";
import { APITrigger } from "./.";
import { EventManager } from "@src/services/eventManager";

describe("API Trigger Tests", () => {

    it("should create an API trigger and test it", async () => {

        const apiTrigger = new APITrigger({
            name: "Test API Trigger",
            description: "This is a test API trigger",
            endpoint: "/test-api-trigger",
            action: "run"
        })

        expect(apiTrigger).toBeDefined();
        expect(apiTrigger.type).toBe(APITrigger.type);
        expect(apiTrigger.name).toBe("Test API Trigger");
        expect(apiTrigger.description).toBe("This is a test API trigger");
        expect(apiTrigger.endpoint).toBe("/test-api-trigger");
        expect(apiTrigger.action).toBe("run");
        expect(apiTrigger.armed).toBe(false);
        expect(apiTrigger.triggered).toBe(false);
        expect(apiTrigger.reArmOnTrigger).toBe(true);
        expect(apiTrigger.id).toBeDefined();

        // Arm the trigger
        apiTrigger.arm();

        expect(apiTrigger.armed).toBe(true);
        expect(apiTrigger.triggered).toBe(false);

        try {
            const res = await fetch(`http://localhost:3000${apiTrigger.endpoint}`)
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.message).toBe("Trigger activated");
            expect(apiTrigger.triggered).toBe(true)
        } catch (error) {
            console.error("Error making API request:", error);
        }



    })

})