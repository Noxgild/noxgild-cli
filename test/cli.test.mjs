import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';

import { CLI_VERSION, connect, normalizedArch, normalizedPlatform, platformLabel } from '../dist/index.js';

test('platform and architecture normalization covers the supported public matrix', () => {
  assert.equal(normalizedPlatform('win32'), 'win32');
  assert.equal(normalizedPlatform('darwin'), 'darwin');
  assert.equal(normalizedPlatform('linux'), 'linux');
  assert.equal(normalizedArch('x64'), 'x64');
  assert.equal(normalizedArch('arm64'), 'arm64');
  assert.equal(platformLabel('darwin'), 'macOS');
  assert.throws(() => normalizedPlatform('aix'), /does not support/);
  assert.throws(() => normalizedArch('ia32'), /does not support/);
});

test('CLI version matches the release source', () => {
  assert.equal(CLI_VERSION, '1.0.1');
});

test('connect uses a short-lived browser approval flow before installation', async (t) => {
  const requests = [];
  const server = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({ url: req.url, method: req.method, body: body ? JSON.parse(body) : undefined });

    if (req.url === '/cli/connect/start' && req.method === 'POST') {
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          data: {
            sessionId: 'cli_test',
            pollSecret: 'cli_secret_test',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            pollIntervalSeconds: 1,
            verificationUri: 'https://app.noxgild.com/?connect=cli_test',
          },
        }),
      );
      return;
    }

    if (req.url === '/cli/connect/poll' && req.method === 'POST') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          data: {
            status: 'APPROVED',
            installer: 'posix',
            installerUrl: 'https://example.invalid/install.sh',
            apiBaseUrl: 'https://api.example.invalid',
            pairingCode: 'short-lived-test-code',
            packageUrl: 'https://example.invalid/runtime.zip',
            packageSha256: 'ab'.repeat(32),
            deviceName: 'Public-CI',
          },
        }),
      );
      return;
    }

    res.writeHead(404).end();
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const address = server.address();
  const installs = [];
  await connect({
    accountOrigin: `http://127.0.0.1:${address.port}`,
    platform: 'linux',
    arch: 'x64',
    deviceName: 'Public-CI',
    open: false,
    installer: async (grant, platform) => installs.push({ grant, platform }),
  });

  assert.equal(installs.length, 1);
  assert.equal(installs[0].platform, 'linux');
  assert.equal(requests[0].url, '/cli/connect/start');
  assert.deepEqual(requests[0].body, { platform: 'linux', arch: 'x64', deviceName: 'Public-CI' });
  assert.equal(requests[1].url, '/cli/connect/poll');
  assert.deepEqual(requests[1].body, { sessionId: 'cli_test', pollSecret: 'cli_secret_test' });
});

test('unavailable runtimes fail before installation', async (t) => {
  const server = http.createServer((req, res) => {
    if (req.url === '/cli/connect/start' && req.method === 'POST') {
      res.writeHead(409, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ code: 'PLATFORM_NOT_AVAILABLE', error: 'not available' }));
      return;
    }
    res.writeHead(404).end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const address = server.address();
  let installed = false;
  await assert.rejects(
    () =>
      connect({
        accountOrigin: `http://127.0.0.1:${address.port}`,
        platform: 'darwin',
        arch: 'arm64',
        deviceName: 'Mac',
        open: false,
        installer: async () => {
          installed = true;
        },
      }),
    /runtime is not published yet/,
  );
  assert.equal(installed, false);
});
