import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dgram from 'dgram';
import { SendArtnetJob } from '.';

describe('SendArtnetJob (integration)', () => {
  let server: dgram.Socket;
  let messages: Buffer[];
  const PORT = 6454;
  const HOST = '127.0.0.1';

  beforeAll(() => {
    messages = [];
    server = dgram.createSocket('udp4');
    server.on('message', (msg) => messages.push(msg));
    return new Promise<void>((resolve) => server.bind(PORT, HOST, resolve));
  });

  afterAll(() => {
    server.close();
  });

  it('should send an ArtNet packet with correct value', async () => {
    const job = new SendArtnetJob({
      name: 'Test Artnet Job',
      params: { channel: 1, universe: 0, value: 50, host: HOST, port: PORT }
    });
    await job.execute({ abortSignal: new AbortController().signal });
    await new Promise((res) => setTimeout(res, 100));
    expect(messages.length).toBeGreaterThan(0);
    const buf = messages[0];
    const receivedUniverse = buf[14] + (buf[15] << 8);
    const receivedValue = buf[18];
    expect(receivedUniverse).toBe(0);
    expect(receivedValue).toBe(50);
  });

  it('should abort the job', async () => {
    const job = new SendArtnetJob({
      name: 'Abort Artnet Job',
      params: { channel: 1, universe: 0, value: 10, host: HOST, port: PORT }
    });
    const ac = new AbortController();
    ac.abort();
    await expect(job.execute({ abortSignal: ac.signal })).rejects.toThrow('Job "Abort Artnet Job" was aborted');
  });

  it('should validate required parameters', async () => {
    const job = new SendArtnetJob({
      name: 'Invalid',
      params: { universe: 0, value: 10 } as any
    });
    await expect(job.execute({ abortSignal: new AbortController().signal })).rejects.toThrow('Missing required parameters: channel');
  });
});
