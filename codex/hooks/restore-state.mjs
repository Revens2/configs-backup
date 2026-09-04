import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const input = await new Promise((resolve) => {
  let value = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => (value += chunk));
  process.stdin.on('end', () => resolve(value));
  setTimeout(() => resolve(value), 2500).unref?.();
});

try {
  const payload = JSON.parse(input || '{}');
  const cwd = payload.cwd || process.cwd();
  const slug = cwd.replace(/[\\/:]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'default';
  const stateFile = path.join(os.homedir(), '.codex', 'state', slug, 'STATE.md');
  if (fs.existsSync(stateFile)) process.stdout.write(fs.readFileSync(stateFile, 'utf8').slice(0, 4000));
} catch {
  // Hooks are advisory and must never break a session.
}
