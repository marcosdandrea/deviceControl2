#!/usr/bin/env node
const net = require('net');
const crypto = require('crypto');

// -------- CLI args --------
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) return [a, true];
    return [m[1], m[2] ?? true];
  })
);

const PORT = parseInt(args.port || args.p || '4352', 10);
const PASSWORD = args.password || args.pass || null;

const MFR = args.mfr || 'MockMfr';
const MODEL = args.model || 'MockModel';
const NAME = args.name || 'MockPJ';
const CLASS = '1';

// Estado simulado
const state = {
  POWR: '0',
  INPT: '11',
  AVMT: '0',
  LAMP: { hours1: 120, on1: 1, hours2: 0, on2: 0 },
  ERST: '000000',
  INF1: MFR,
  INF2: MODEL,
  INF3: 'FW 1.0.0',
  NAME: NAME,
  CLSS: CLASS
};

// --- Helpers ---
function makeNonce() {
  return crypto.randomBytes(4).toString('hex');
}
function authHash(password, nonce) {
  return crypto.createHash('md5').update(password + nonce, 'utf8').digest('hex');
}
function splitLines(bufferStr, carry = '') {
  const s = carry + bufferStr;
  // Dividir por \r o \n o \r\n
  const parts = s.split(/\r\n|\r|\n/);
  const lines = parts.slice(0, -1);
  const rest = parts.slice(-1)[0];
  return { lines, rest };
}
function reply(cls, cmd, value) {
  return `%${cls}${cmd}=${value}\r`;
}
const ERR = { PARAM: 'ERR1', UNSUP: 'ERR2', UNAVAIL: 'ERR3', BUSY: 'ERR4' };
function parsePJLinkLine(line) {
  const m = line.match(/^%([12])([A-Z]{4})\s*(\S+)?$/);
  if (!m) return null;
  return { cls: m[1], cmd: m[2], arg: m[3] || null };
}
function peelAuth(line) {
  const m = line.match(/^([0-9a-fA-F]{32})(%.*)$/);
  if (!m) return null;
  return { hashHex: m[1].toLowerCase(), cmdLine: m[2] };
}

// --- Handlers ---
function handleQuery(cmd, cls) {
  switch (cmd) {
    case 'POWR': return reply(cls, 'POWR', state.POWR);
    case 'INPT': return reply(cls, 'INPT', state.INPT);
    case 'AVMT': return reply(cls, 'AVMT', state.AVMT);
    case 'ERST': return reply(cls, 'ERST', state.ERST);
    case 'LAMP': {
      const { hours1, on1, hours2, on2 } = state.LAMP;
      return reply(cls, 'LAMP', `${hours1} ${on1} ${hours2} ${on2}`);
    }
    case 'NAME': return reply(cls, 'NAME', state.NAME);
    case 'INF1': return reply(cls, 'INF1', state.INF1);
    case 'INF2': return reply(cls, 'INF2', state.INF2);
    case 'INF3': return reply(cls, 'INF3', state.INF3);
    case 'CLSS': return reply(cls, 'CLSS', state.CLSS);
    default:     return reply(cls, cmd, ERR.UNSUP);
  }
}
function handleSet(cmd, cls, arg) {
  switch (cmd) {
    case 'POWR':
      if (!/^[0-3]$/.test(arg)) return reply(cls, 'POWR', ERR.PARAM);
      state.POWR = arg;
      return reply(cls, 'POWR', 'OK');
    case 'INPT':
      if (!/^\d{2}$/.test(arg)) return reply(cls, 'INPT', ERR.PARAM);
      state.INPT = arg;
      return reply(cls, 'INPT', 'OK');
    case 'AVMT':
      if (!/^[0-3]$/.test(arg)) return reply(cls, 'AVMT', ERR.PARAM);
      state.AVMT = arg;
      return reply(cls, 'AVMT', 'OK');
    default:
      return reply(cls, cmd, ERR.UNSUP);
  }
}

// --- Server ---
const server = net.createServer((socket) => {
  const remote = `${socket.remoteAddress}:${socket.remotePort}`;
  const needsAuth = !!PASSWORD;
  const nonce = needsAuth ? makeNonce() : null;

  console.log(`[+] Conn ${remote}`);

  if (needsAuth) {
    socket.write(`PJLINK 1 ${nonce}\r`);
    console.log(`→ Sent: PJLINK 1 ${nonce}`);
  } else {
    socket.write('PJLINK 0\r');
    console.log('→ Sent: PJLINK 0');
  }

  let carry = '';

  socket.on('data', (chunk) => {
    const { lines, rest } = splitLines(chunk, carry);
    carry = rest;
    console.log(`Data so far: "${rest}"`);

    for (const raw of lines) {
      let line = raw.trim();
      if (!line) continue;

      console.log(`← Recv: ${line}`);

      if (needsAuth) {
        const peeled = peelAuth(line);
        if (!peeled) {
          console.log(`  ! Auth missing, replying ERR3`);
          socket.write(reply('1', 'UNKN', ERR.UNAVAIL));
          continue;
        }
        const expected = authHash(PASSWORD, nonce);
        if (peeled.hashHex !== expected) {
          console.log(`  ! Bad auth hash, replying ERR3`);
          const p = parsePJLinkLine(peeled.cmdLine) || { cls: '1', cmd: 'AUTH' };
          socket.write(reply(p.cls, p.cmd, ERR.UNAVAIL));
          continue;
        }
        line = peeled.cmdLine;
      }

      const parsed = parsePJLinkLine(line);
      if (!parsed) {
        console.log(`  ! Parse fail, replying ERR2`);
        socket.write(reply('1', 'UNKN', ERR.UNSUP));
        continue;
      }

      const { cls, cmd, arg } = parsed;
      const res = (arg === '?' || arg === null)
        ? handleQuery(cmd, cls)
        : handleSet(cmd, cls, arg);

      console.log(`→ Sent: ${res.trim()}`);
      socket.write(res);
    }
  });

  socket.on('close', () => console.log(`[-] Disc ${remote}`));
  socket.on('error', (e) => console.log(`[!] Err ${remote}:`, e.message));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`PJLink mock listening on 0.0.0.0:${PORT} ${PASSWORD ? '(auth enabled)' : ''}`);
});
