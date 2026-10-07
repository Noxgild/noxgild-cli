import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
const allowedExtensions = new Set(['.md', '.json', '.mjs', '.ts', '.yml', '.yaml', '']);
const forbidden = [
  new RegExp(['AGENT', 'PORT_'].join('')),
  new RegExp(['DeIt', 'Guy23'].join(''), 'i'),
  new RegExp(['GOOGLE', '_APPLICATION_CREDENTIALS'].join('')),
  new RegExp(['-----BEGIN ', '(?:RSA |EC |OPENSSH )?', 'PRIVATE KEY-----'].join('')),
  /\bsk_(?:live|test)_[A-Za-z0-9]{12,}\b/,
  /\bwhsec_[A-Za-z0-9]{12,}\b/,
  /\bAIza[0-9A-Za-z_-]{20,}\b/,
];

for (const file of await walk(root)) {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  if (rel.startsWith('node_modules/') || rel.startsWith('dist/') || rel.startsWith('.git/')) continue;
  if (!allowedExtensions.has(path.extname(file)) && path.extname(file)) continue;
  const text = await fs.readFile(file, 'utf8').catch(() => '');
  for (const pattern of forbidden) {
    if (pattern.test(text)) throw new Error(`Public-tree scan rejected ${rel}: ${pattern}`);
  }
}
console.log('PUBLIC_TREE_SCAN_PASS');

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}
