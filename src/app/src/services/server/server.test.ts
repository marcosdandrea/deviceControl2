import { afterEach, describe, expect, it } from "vitest";
import { Server } from "./index.js";

describe("Server Service Tests", () => {

    afterEach(async () => {
        Server.resetInstance();
    });

    it("should create a server instance with default properties", async () => {
        const server = Server.getInstance();
        expect(server).toBeDefined();
    });

    it("should create a server instance with custom properties", async () => {
        const server = Server.getInstance({ port: 4000, ip: '127.0.0.1' });
    });

    it("will try to bound the same route twice and expect an error", async () => {
        const server = await Server.getInstance();
        const port = server.port;

        const handleOnRoute = (req, res) => {
            res.status(200).send(`Route bound successfully: ${req.url}`);
        }

        // Asumiendo que bindRoute usa GET, cambias método a GET:
        server.bindRoute('/test', handleOnRoute);
        expect(() => {
            server.bindRoute('/test', handleOnRoute);
        }).toThrowError('Route "/test" is already bound.');
        server.close();
        Server.resetInstance();
    });

    it("should create a server instance, bind a route and test it and then unbind it", async () => {
        const server = await Server.getInstance();
        const port = server.port;
        // Asumiendo que bindRoute usa GET, cambias método a GET:
        const handleOnRoute = (req, res) => {
            res.status(200).send(`Route bound successfully: ${req.url}`);
        }

        server.bindRoute('/test', handleOnRoute);
        const response = await fetch(`http://localhost:${port}/test`);
        expect(response.ok).toBe(true);
        const text = await response.text();
        expect(text).toBe('Route bound successfully: /test');

        server.unbindRoute('/test');

        // Check if the route is unbound
        expect(() => {
            server.unbindRoute('/test');
        }).toThrowError('Route /test is not bound.');

        // Check if the route is still accessible
        const responseAfterUnbind = await fetch(`http://localhost:${port}/test`);
        expect(responseAfterUnbind.ok).toBe(false);
        expect(responseAfterUnbind.status).toBe(404);
        server.close();
        Server.resetInstance();
    });
});
