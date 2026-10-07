import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const release = process.argv.includes('--release');
const pkg = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'));

if (pkg.name !== '@noxgild/cli') throw new Error('Unexpected package name');
if (pkg.repository?.url !== 'git+https://github.com/Noxgild/noxgild-cli.git') {
  throw new Error('Repository metadata must point to the public Noxgild CLI repository');
}
if (pkg.scripts?.install || pkg.scripts?.postinstall || pkg.scripts?.preinstall) {
  throw new Error('The bootstrap package must not have install lifecycle scripts');
}

if (release) {
  if (pkg.license === 'UNLICENSED')
    throw new Error('Release blocked: public CLI license decision is still pending');
  await fs.access(new URL('../LICENSE', import.meta.url));
}

const output = await new Promise((resolve, reject) => {
  const windows = process.platform === 'win32';
  const command = windows ? process.env.ComSpec || 'cmd.exe' : 'npm';
  const args = windows ? ['/d', '/s', '/c', 'npm pack --dry-run --json'] : ['pack', '--dry-run', '--json'];
  const child = spawn(command, args, {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  let stdout = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.on('error', reject);
  child.on('close', (code) =>
    code === 0 ? resolve(stdout) : reject(new Error(`npm pack failed with ${code}`)),
  );
});

const report = JSON.parse(output)[0];
const files = report.files.map((entry) => entry.path).sort();
const expected = ['README.md', 'dist/index.js', 'package.json'];
try {
  await fs.access(new URL('../LICENSE', import.meta.url));
  expected.push('LICENSE');
} catch {
  // LICENSE is intentionally absent until the final public-license decision.
}
expected.sort();

assertArray(files, expected, 'tarball file allowlist');
if (
  report.files.some((entry) => /(?:\.env|source\.map|\.map$|private|credential|secret)/i.test(entry.path))
) {
  throw new Error('Unexpected sensitive-looking tarball path');
}

console.log(`PACKAGE_GATE_PASS files=${files.join(',')}`);

function assertArray(actual, expectedValues, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expectedValues)) {
    throw new Error(
      `${label} mismatch: expected ${JSON.stringify(expectedValues)}, got ${JSON.stringify(actual)}`,
    );
  }
}
