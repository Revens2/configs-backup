import { spawnSync } from 'node:child_process';

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
  const result = spawnSync('codegraph.exe', ['hook-post-edit'], {
    cwd,
    encoding: 'utf8',
    timeout: 20000,
    windowsHide: true,
    env: { ...process.env, CODEGRAPH_DB: process.env.CODEGRAPH_DB || '.codegraph/codegraph.db', RUST_LOG: 'off' },
  });
  if (result.error) process.stderr.write(`CodeGraph hook unavailable: ${result.error.message}\n`);
} catch {
  // Indexing is advisory and must never break an edit.
}
process.stdout.write('{}');
