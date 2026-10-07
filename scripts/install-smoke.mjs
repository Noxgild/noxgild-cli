import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'noxgild-cli-smoke-'));
try {
  const packJson = await run('npm', ['pack', '--json'], root);
  const tarballName = JSON.parse(packJson)[0].filename;
  const tarball = path.join(root, tarballName);

  const local = path.join(temp, 'local');
  await fs.mkdir(local);
  await run('npm', ['init', '-y'], local);
  await run('npm', ['install', '--ignore-scripts', tarball], local);
  const localBin = path.join(
    local,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'noxgild.cmd' : 'noxgild',
  );
  const localVersion = await run(localBin, ['--version'], local);
  if (!localVersion.trim()) throw new Error('Local tarball executable returned no version');

  const globalPrefix = path.join(temp, 'global');
  await run('npm', ['install', '--global', '--ignore-scripts', '--prefix', globalPrefix, tarball], temp);
  const globalBin =
    process.platform === 'win32'
      ? path.join(globalPrefix, 'noxgild.cmd')
      : path.join(globalPrefix, 'bin', 'noxgild');
  const globalVersion = await run(globalBin, ['--version'], temp);
  const globalHelp = await run(globalBin, ['--help'], temp);
  if (!globalVersion.trim() || !/noxgild connect/i.test(globalHelp))
    throw new Error('Global tarball executable smoke failed');

  console.log(`INSTALL_SMOKE_PASS version=${globalVersion.trim()}`);
} finally {
  await fs.rm(temp, { recursive: true, force: true });
  for (const file of await fs.readdir(root)) {
    if (/^noxgild-cli-.*\.tgz$/.test(file)) await fs.rm(path.join(root, file), { force: true });
  }
}

function commandForPlatform(command, args) {
  if (process.platform !== 'win32') return { executable: command, args };

  if (command === 'npm') {
    const npmCli =
      process.env.npm_execpath ||
      path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
    return { executable: process.execPath, args: [npmCli, ...args] };
  }

  if (command.toLowerCase().endsWith('.cmd')) {
    return { executable: command, args, shell: true };
  }

  return { executable: command, args };
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const invocation = commandForPlatform(command, args);
    const child = spawn(invocation.executable, invocation.args, {
      cwd,
      shell: invocation.shell ?? false,
      env: invocation.shell ? { ...process.env, NODE_NO_WARNINGS: '1' } : process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve(stdout)
        : reject(new Error(`${command} ${args.join(' ')} failed (${code}): ${stderr}`)),
    );
  });
}
