import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dgram from 'dgram';
import { SendArtnetJob } from '.';
import { Context } from '@src/domain/entities/context';

describe('SendArtnetJob (integration)', () => {
  let server: dgram.Socket;
  let messages: Buffer[];
  let rootCtx: Context;
  const PORT = 16654;
  const HOST = '127.0.0.1'

  beforeAll(() => {
    messages = [];
    server = dgram.createSocket('udp4');
    server.on('message', (msg) => messages.push(msg));
    rootCtx = Context.createRootContext({ id: 'test-root', type: 'routine', name: 'Test Routine' });
    return new Promise<void>((resolve) => server.bind(PORT, HOST, resolve));
  })

  afterAll(() => {
    server.close();
  });

  const createJobContext = (jobName: string) =>
    rootCtx.createChildContext({ id: jobName.toLowerCase().replace(/\s+/g, '-'), type: 'job', name: jobName });

  it('should send an ArtNet packet with correct value', async () => {
    const job = new SendArtnetJob({
      name: 'Test Artnet Job',
      params: { channels: '1', universe: 0, value: 50, host: HOST, port: PORT }
    });
    await job.execute({ abortSignal: new AbortController().signal, ctx: createJobContext(job.name) });
    await new Promise((res) => setTimeout(res, 100));
    expect(messages.length).toBeGreaterThan(0);
    const buf = messages[messages.length - 1];
    const receivedUniverse = buf[14] + (buf[15] << 8);
    const receivedValue = buf[18];
    expect(receivedUniverse).toBe(0);
    expect(receivedValue).toBe(50);
  });

  it('should interpolate channel 1 to 255', async () => {
    const job = new SendArtnetJob({
      name: 'Interpolate Job',
      params: {
        channels: '1',
        universe: 0,
        value: 255,
        host: HOST,
        port: PORT,
        interpolate: true,
        interpolationTime: 1000
      }
    })
    await job.execute({ abortSignal: new AbortController().signal, ctx: createJobContext(job.name) });
    await new Promise((res) => setTimeout(res, 300));
    expect(messages.length).toBeGreaterThan(1);
    const buf = messages[messages.length - 1];
    const receivedValue = buf[18];
    expect(receivedValue).toBe(255);
  });

  it('should interpolate channel 1 to 0', async () => {
    const job = new SendArtnetJob({
      name: 'Interpolate Job to 0',
      params: {
        channels: '1',
        universe: 0,
        value: 0,
        host: HOST,
        port: PORT,
        interpolate: true,
        interpolationTime: 1000
      }
    })
    await job.execute({ abortSignal: new AbortController().signal, ctx: createJobContext(job.name) });
    await new Promise((res) => setTimeout(res, 300));
    expect(messages.length).toBeGreaterThan(1);
    const buf = messages[messages.length - 1];
    const receivedValue = buf[18];
    expect(receivedValue).toBe(0);
  });


  it('should abort the job', async () => {
    const job = new SendArtnetJob({
      name: 'Abort Artnet Job',
      params: { channels: '1', universe: 0, value: 10, host: HOST, port: PORT }
    });
    const ac = new AbortController();
    const execution = job.execute({ abortSignal: ac.signal, ctx: createJobContext(job.name) });
    ac.abort();
    await expect(execution).rejects.toThrow('Job "Abort Artnet Job" was aborted');
  });

  it('should validate required parameters', async () => {
    expect(() => new SendArtnetJob({
      name: 'Invalid',
      params: { universe: 0, value: 10 } as any
    })).toThrow('Missing required parameter: channels');
  });

  it('should update multiple channels when ranges are provided', async () => {
    const job = new SendArtnetJob({
      name: 'Range Job',
      params: { channels: '1-3, 10, 12-13', universe: 0, value: 120, host: HOST, port: PORT }
    });

    await job.execute({ abortSignal: new AbortController().signal, ctx: createJobContext(job.name) });
    await new Promise((res) => setTimeout(res, 100));

    expect(messages.length).toBeGreaterThan(0);
    const buf = messages[messages.length - 1];

    expect(buf[18]).toBe(120); // channel 1 (index 0)
    expect(buf[19]).toBe(120); // channel 2 (index 1)
    expect(buf[20]).toBe(120); // channel 3 (index 2)
    expect(buf[27]).toBe(120); // channel 10 (index 9)
    expect(buf[29]).toBe(120); // channel 12 (index 11)
    expect(buf[30]).toBe(120); // channel 13 (index 12)
  });
});
