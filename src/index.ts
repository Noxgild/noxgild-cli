#!/usr/bin/env node
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DEFAULT_ACCOUNT_ORIGIN = 'https://app.noxgild.com';
export const CLI_VERSION = '1.0.2';
type Platform = 'win32' | 'darwin' | 'linux';
type Arch = 'x64' | 'arm64';

export function normalizedPlatform(value = process.platform): Platform {
  if (value === 'win32' || value === 'darwin' || value === 'linux') return value;
  throw new Error(`Noxgild does not support ${value} yet.`);
}
export function normalizedArch(value = process.arch): Arch {
  if (value === 'x64' || value === 'arm64') return value;
  throw new Error(`Noxgild does not support ${value} architecture yet.`);
}
export function platformLabel(platform: Platform): string {
  return platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'macOS' : 'Linux';
}

async function requestJson(
  url: string,
  init: RequestInit = {},
): Promise<{ status: number; data: any; error?: string; code?: string }> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...((init.headers as Record<string, string>) ?? {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  return {
    status: response.status,
    data: payload?.data,
    error: payload?.error,
    code: payload?.code,
  };
}
function run(
  command: string,
  args: string[],
  options: {
    detached?: boolean;
    stdio?: 'ignore' | 'inherit';
    env?: NodeJS.ProcessEnv;
  } = {},
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      detached: options.detached ?? false,
      stdio: options.stdio ?? 'inherit',
      ...(options.env ? { env: options.env } : {}),
    });
    child.on('error', reject);
    child.on('close', (code: number | null) => resolve(code ?? 1));
    if (options.detached) {
      child.unref();
      resolve(0);
    }
  });
}
export async function openBrowser(url: string, platform: Platform): Promise<boolean> {
  if (process.env.NOXGILD_NO_BROWSER === '1') return false;
  try {
    if (platform === 'win32')
      return (
        (await run('cmd.exe', ['/d', '/s', '/c', 'start', '', url], {
          stdio: 'ignore',
        })) === 0
      );
    if (platform === 'darwin') return (await run('open', [url], { stdio: 'ignore' })) === 0;
    return (await run('xdg-open', [url], { stdio: 'ignore' })) === 0;
  } catch {
    return false;
  }
}
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface DoctorOptions {
  platform?: Platform;
  agentRoot?: string;
  runner?: (
    command: string,
    args: string[],
    options?: {
      detached?: boolean;
      stdio?: 'ignore' | 'inherit';
      env?: NodeJS.ProcessEnv;
    },
  ) => Promise<number>;
}
export function installedRuntimePaths(
  agentRoot = process.env.NOXGILD_AGENT_ROOT?.trim() ||
    (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'NoxgildAgent') : ''),
) {
  if (!agentRoot) throw new Error('LOCALAPPDATA is required to locate the installed Noxgild runtime.');
  return {
    root: agentRoot,
    node: path.join(agentRoot, 'node.exe'),
    main: path.join(agentRoot, 'dist', 'apps', 'desktop-agent', 'src', 'main.js'),
    dataHome: path.join(path.dirname(agentRoot), 'NoxgildData'),
  };
}
export async function doctor(options: DoctorOptions = {}): Promise<void> {
  const platform = options.platform ?? normalizedPlatform();
  const posixDataHome =
    platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support', 'Noxgild')
      : path.join(process.env.XDG_DATA_HOME?.trim() || path.join(os.homedir(), '.local', 'share'), 'noxgild');
  const posixRoot = options.agentRoot ?? path.join(posixDataHome, 'runtime');
  const runtime =
    platform === 'win32'
      ? installedRuntimePaths(options.agentRoot)
      : {
          root: posixRoot,
          node: path.join(posixRoot, 'node'),
          main: path.join(posixRoot, 'dist', 'apps', 'desktop-agent', 'src', 'main.js'),
          dataHome: posixDataHome,
        };
  await fs.access(runtime.node).catch(() => {
    throw new Error('Noxgild runtime is not installed. Run: npx @noxgild/cli@latest connect');
  });
  await fs.access(runtime.main).catch(() => {
    throw new Error('Noxgild runtime is incomplete. Reconnect this computer to repair the installation.');
  });
  const code = await (options.runner ?? run)(runtime.node, [runtime.main, 'doctor'], {
    stdio: 'inherit',
    env: { ...process.env, NOXGILD_HOME: runtime.dataHome },
  });
  if (code !== 0) throw new Error(`Noxgild doctor exited with code ${code}.`);
}

async function installPosix(grant: any): Promise<void> {
  if (grant.installer !== 'posix') throw new Error('Noxgild returned an unexpected installer type.');
  const temp = path.join(os.tmpdir(), `noxgild-installer-${process.pid}-${Date.now()}.sh`);
  const response = await fetch(String(grant.installerUrl));
  if (!response.ok) throw new Error(`Could not download Noxgild installer (${response.status}).`);
  await fs.writeFile(temp, Buffer.from(await response.arrayBuffer()), {
    mode: 0o700,
  });
  try {
    const code = await run('/bin/sh', [
      temp,
      String(grant.apiBaseUrl),
      String(grant.pairingCode),
      String(grant.packageUrl),
      String(grant.packageSha256),
      String(grant.deviceName || os.hostname()),
      os.homedir(),
    ]);
    if (code !== 0) throw new Error(`Noxgild installer exited with code ${code}.`);
  } finally {
    await fs.rm(temp, { force: true }).catch(() => {});
  }
}

async function installWindows(grant: any): Promise<void> {
  if (grant.installer !== 'powershell') throw new Error('Noxgild returned an unexpected installer type.');
  const temp = path.join(os.tmpdir(), `noxgild-installer-${process.pid}-${Date.now()}.ps1`);
  const response = await fetch(String(grant.installerUrl));
  if (!response.ok) throw new Error(`Could not download Noxgild installer (${response.status}).`);
  await fs.writeFile(temp, Buffer.from(await response.arrayBuffer()), {
    mode: 0o600,
  });
  try {
    const code = await run('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      temp,
      '-InstallerUrl',
      String(grant.installerUrl),
      '-ApiBaseUrl',
      String(grant.apiBaseUrl),
      '-PairingCode',
      String(grant.pairingCode),
      '-ApprovedTenantId',
      String(grant.tenantId ?? ''),
      '-PackageUrl',
      String(grant.packageUrl),
      '-PackageSha256',
      String(grant.packageSha256),
      '-DeviceName',
      String(grant.deviceName || os.hostname()),
      '-Workspace',
      os.homedir(),
      '-Quiet',
    ]);
    if (code !== 0) throw new Error(`Noxgild installer exited with code ${code}.`);
  } finally {
    await fs.rm(temp, { force: true }).catch(() => {});
  }
}

export interface ConnectOptions {
  accountOrigin?: string;
  platform?: Platform;
  arch?: Arch;
  deviceName?: string;
  open?: boolean;
  installer?: (grant: any, platform: Platform) => Promise<void>;
}
export async function connect(options: ConnectOptions = {}): Promise<void> {
  const accountOrigin = (
    options.accountOrigin ??
    process.env.NOXGILD_ACCOUNT_ORIGIN ??
    DEFAULT_ACCOUNT_ORIGIN
  ).replace(/\/$/, '');
  const platform = options.platform ?? normalizedPlatform();
  const arch = options.arch ?? normalizedArch();
  const deviceName = (options.deviceName ?? os.hostname()).trim() || 'Computer';
  process.stdout.write(`Noxgild\nConnecting ${deviceName} (${platformLabel(platform)} ${arch})...\n`);

  const started = await requestJson(`${accountOrigin}/cli/connect/start`, {
    method: 'POST',
    body: JSON.stringify({ platform, arch, deviceName }),
  });
  if (started.status === 409 && started.code === 'PLATFORM_NOT_AVAILABLE') {
    throw new Error(
      `${platformLabel(platform)} ${arch} is recognized by Noxgild, but its local runtime is not published yet.`,
    );
  }
  if (
    started.status !== 201 ||
    !started.data?.sessionId ||
    !started.data?.pollSecret ||
    !started.data?.verificationUri
  ) {
    throw new Error(started.error || 'Could not start Noxgild connection.');
  }

  const verificationUri = String(started.data.verificationUri);
  const opened = options.open === false ? false : await openBrowser(verificationUri, platform);
  process.stdout.write(
    opened
      ? 'Approve this computer in the browser window that just opened.\n'
      : `Open this URL to approve the computer:\n${verificationUri}\n`,
  );
  process.stdout.write('Waiting for approval...\n');

  const deadline = Date.parse(started.data.expiresAt || '') || Date.now() + 10 * 60_000;
  const interval = Math.max(1000, Math.min(5000, Number(started.data.pollIntervalSeconds ?? 2) * 1000));
  let grant: any;
  while (Date.now() < deadline) {
    const polled = await requestJson(`${accountOrigin}/cli/connect/poll`, {
      method: 'POST',
      body: JSON.stringify({
        sessionId: started.data.sessionId,
        pollSecret: started.data.pollSecret,
      }),
    });
    if (polled.status === 202 || polled.data?.status === 'PENDING') {
      await delay(interval);
      continue;
    }
    if (polled.status !== 200 || polled.data?.status !== 'APPROVED') {
      throw new Error(polled.error || 'Noxgild connection could not be approved.');
    }
    grant = polled.data;
    break;
  }
  if (!grant) throw new Error('Noxgild connection approval expired. Run the command again.');

  process.stdout.write('Approved. Installing Noxgild...\n');
  if (options.installer) await options.installer(grant, platform);
  else if (platform === 'win32') await installWindows(grant);
  else await installPosix(grant);
  process.stdout.write(`Connected: ${deviceName} is now online in Noxgild.\nRun: noxgild doctor\n`);
}

function usage(): void {
  process.stdout.write(
    'Noxgild CLI\n\nUsage:\n  noxgild connect\n  noxgild remote      Alias for connect\n  noxgild doctor      Check the installed computer connection\n  noxgild --version\n',
  );
}
export async function main(argv = process.argv.slice(2)): Promise<number> {
  const command = argv[0] ?? 'connect';
  if (command === '--version' || command === '-v' || command === 'version') {
    process.stdout.write(`${CLI_VERSION}\n`);
    return 0;
  }
  if (command === '--help' || command === '-h' || command === 'help') {
    usage();
    return 0;
  }
  if (command === 'doctor') {
    try {
      await doctor();
      return 0;
    } catch (error) {
      process.stderr.write(`Noxgild: ${error instanceof Error ? error.message : String(error)}\n`);
      return 1;
    }
  }
  if (command !== 'connect' && command !== 'remote') {
    usage();
    return 2;
  }
  try {
    await connect();
    return 0;
  } catch (error) {
    process.stderr.write(`Noxgild: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : '';
const modulePath = fileURLToPath(import.meta.url);
const invokedReal = invoked ? await fs.realpath(invoked).catch(() => invoked) : '';
const moduleReal = await fs.realpath(modulePath).catch(() => modulePath);
if (invokedReal && moduleReal === invokedReal) {
  process.exitCode = await main();
}
