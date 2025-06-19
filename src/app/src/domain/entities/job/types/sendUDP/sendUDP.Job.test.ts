// sendUDP.Job.test.ts
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import dgram from 'dgram';
import { Job } from '../..';
import { loadJobModules } from '..';

let SendUDPJob: typeof Job;

describe('SendUDPJob (integration + extended)', () => {
  let messages: string[];
  let server;

  beforeAll(async () => {
    const jobModules = await loadJobModules();
    SendUDPJob = jobModules.sendUDPJob.SendUDPJob;

    server = dgram.createSocket('udp4');
    server.on('error', (err) => {
      console.error(`Server error:\n${err.stack}`);
      server.close();
    });
    server.on('message', (msg, rinfo) => {
      messages.push(msg.toString());
      const response = msg.toString().includes("Hello") ? "Acknowledged" : "Unknown";
      server.send(response, rinfo.port, rinfo.address);
    });
    server.bind(41234, '127.0.0.1');
  });

  beforeEach(() => {
    messages = []
  })

  it('should send a real UDP message', async () => {
    const job = new SendUDPJob({
      name: 'Test SendUDP Job',
      params: {
        ipAddress: '127.0.0.1',
        subnetMask: '255.255.255.0',
        portNumber: 41234,
        message: 'Hello, this is a test message'
      }
    });

    const abortController = new AbortController();
    await job.execute({ abortSignal: abortController.signal })
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log({messages});
    expect(messages).toContain('Hello, this is a test message');
  });

  it('should abort the job', async () => {
    const job = new SendUDPJob({
      name: 'Test SendUDP Job',
      params: {
        ipAddress: '127.0.0.1',
        subnetMask: '255.255.255.0',
        portNumber: 41234,
        message: 'This message will not be sent'
      }
    });
    const abortController = new AbortController();
    abortController.abort();
    await expect(job.execute({ abortSignal: abortController.signal })).rejects.toThrow('Job "Test SendUDP Job" was aborted');
    expect(messages).not.toContain('This message will not be sent');
  });

  it('should throw an error if "ipAddress" parameter is missing', async () => {
    const job = new SendUDPJob({
      name: 'Test SendUDP Job',
      params: {
        subnetMask: '255.255.255.0',
        portNumber: 41234,
        message: 'This message will not be sent'
      }
    });
    await expect(job.execute({ abortSignal: new AbortController().signal })).rejects.toThrow('Missing required parameters: ipAddress');
  });

  it('should throw an error if "portNumber" parameter is missing', async () => {
    const job = new SendUDPJob({
      name: 'Test SendUDP Job',
      params: {
        ipAddress: '127.0.0.1',
        subnetMask: '255.255.255.0',
        message: 'This message will not be sent'
      }
    });
    await expect(job.execute({ abortSignal: new AbortController().signal })).rejects.toThrow('Missing required parameters: portNumber');
  });

  it('should throw an error if "portNumber" is out of range', async () => {
    const job = new SendUDPJob({
      name: 'Test SendUDP Job',
      params: {
        ipAddress: '127.0.0.1',
        subnetMask: '255.255.255.0',
        portNumber: 70000,
        message: 'This message will not be sent'
      }
    });
    await expect(job.execute({ abortSignal: new AbortController().signal })).rejects.toThrow('Port number must be a number between 0 and 65535');
  });

  it('should throw an error if "ipAddress" is not a valid IPv4 address', async () => {
    const job = new SendUDPJob({
      name: 'Test SendUDP Job',
      params: {
        ipAddress: 'invalid-ip',
        subnetMask: '255.255.255.0',
        portNumber: 41234,
        message: 'This message will not be sent'
      }
    });
    await expect(job.execute({ abortSignal: new AbortController().signal })).rejects.toThrow('Ip address must be a valid IPv4 address');
  });

  it('should throw an error if "message" parameter is missing', async () => {
    const job = new SendUDPJob({
      name: 'Test SendUDP Job',
      params: {
        ipAddress: '127.0.0.1',
        subnetMask: '255.255.255.0',
        portNumber: 41234
      }
    });
    await expect(job.execute({ abortSignal: new AbortController().signal })).rejects.toThrow('Missing required parameters: message');
  });

  it('should throw an error if "message" parameter is not a string', async () => {
    const job = new SendUDPJob({
      name: 'Test SendUDP Job',
      params: {
        ipAddress: '127.0.0.1',
        subnetMask: '255.255.255.0',
        portNumber: 41234,
        message: 12345 as any
      }
    });
    await expect(job.execute({ abortSignal: new AbortController().signal })).rejects.toThrow('Message must be a string');
  });


  it('should warn or handle broadcast address', async () => {
    const job = new SendUDPJob({
      name: 'Broadcast Test',
      params: {
        ipAddress: '255.255.255.255',
        portNumber: 41234,
        message: 'Broadcast',
        subnetMask: '255.255.255.0'
      }
    });
    const abortController = new AbortController();
    await expect(job.execute({ abortSignal: abortController.signal })).resolves.toBeUndefined();
  });


  it('should reject if subnetMask is invalid', async () => {
    const job = new SendUDPJob({
      name: 'Invalid Subnet',
      params: {
        ipAddress: '192.168.1.255',
        portNumber: 41234,
        message: 'Invalid subnet',
        subnetMask: 'invalid-mask'
      }
    });
    await expect(job.execute({ abortSignal: new AbortController().signal })).rejects.toThrow('Subnet mask must be a valid IPv4 address');
  });
});
