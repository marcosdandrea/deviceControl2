import { describe, expect, it } from "vitest";
import { WaitJob } from ".";

describe('WaitJob (integration)', () => {
    it('should wait for a specified duration', async () => {
        const job = new WaitJob({
            name: 'Test Wait Job',
            params: {
                time: 1000 // 1 second
            }
        });

        const startTime = Date.now();
        await job.execute({ abortSignal: new AbortController().signal });
        const endTime = Date.now();

        // Check if the job waited for at least the specified time
        expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    })

    it('should throw an error if "time" parameter is missing', async () => {
        const job = new WaitJob({
            name: 'Test Wait Job',
            params: {
                // time is missing
            }
        });

        await expect(job.execute({ abortSignal: new AbortController().signal })).rejects.toThrow('Missing required parameters: time');
    })

    it('should throw an error if "time" is not a number', async () => {
        const job = new WaitJob({
            name: 'Test Wait Job',
            params: {
                time: 'not-a-number' // Invalid time
            }
        });

        await expect(job.execute({ abortSignal: new AbortController().signal })).rejects.toThrow('time must be a number');
    })

    it('should throw an error if "time" is out of range', async () => {
        const job = new WaitJob({
            name: 'Test Wait Job',
            params: {
                time: -1000 // Invalid time
            }
        });

        await expect(job.execute({ abortSignal: new AbortController().signal })).rejects.toThrow('time must be a number between 0 and 2147483647');
    })

    it('should handle job abortion before execution', async () => {
        const abortController = new AbortController();
        const job = new WaitJob({
            name: 'Test Wait Job',
            params: {
                time: 5000 // 5 seconds
            }
        });

        abortController.abort(); // Abort the job after 1 second
        await expect(job.execute({ abortSignal: abortController.signal })).rejects.toThrow('Job "Test Wait Job" was aborted');
    }) 

    it('should handle job abortion during execution', async () => {
        const abortController = new AbortController();
        const job = new WaitJob({
            name: 'Test Wait Job',
            params: {
                time: 5000 // 5 seconds
            }
        });

        const jobPromise = job.execute({ abortSignal: abortController.signal });
        setTimeout(() => abortController.abort(), 1000); // Abort after 1 second

        await expect(jobPromise).rejects.toThrow('Job "Test Wait Job" was aborted');
    })

    it('should handle job abortion after execution', async () => {
        const abortController = new AbortController();
        const job = new WaitJob({
            name: 'Test Wait Job',
            params: {
                time: 5000 // 5 seconds
            }
        });

        await job.execute({ abortSignal: abortController.signal });
        abortController.abort(); // Abort after execution

        // The job should have completed successfully, so no error should be thrown
        expect(abortController.signal.aborted).toBe(true);
    })

})

