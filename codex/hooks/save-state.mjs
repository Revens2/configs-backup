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
  const stateDir = path.join(os.homedir(), '.codex', 'state', slug);
  fs.mkdirSync(stateDir, { recursive: true });
  const progress = path.join(cwd, 'progress.md');
  const lines = fs.existsSync(progress) ? fs.readFileSync(progress, 'utf8').split(/\r?\n/) : [];
  const tasks = lines.filter((line) => /^\s*[-*]\s*\[[ ~x]\]/i.test(line));
  const done = tasks.filter((line) => /^\s*[-*]\s*\[x\]/i.test(line)).length;
  const next = tasks.filter((line) => /^\s*[-*]\s*\[[ ~]\]/.test(line)).slice(0, 3);
  const state = [
    `# Codex state — ${cwd}`,
    `_updated ${new Date().toISOString()} · event: ${payload.hook_event_name || 'unknown'}_`,
    '',
    progress ? `Source of truth: ${progress}` : 'No progress.md exists in this workspace.',
    tasks.length ? `Progress: ${done}/${tasks.length} tasks checked.` : '',
    ...(next.length ? [''] : []),
    ...(next.length ? ['Next tasks:'] : []),
    ...next.map((line) => `- ${line.trim().replace(/^[-*]\s*/, '')}`),
  ].filter(Boolean).join('\n').slice(0, 4000);
  fs.writeFileSync(path.join(stateDir, 'STATE.md'), `${state}\n`, 'utf8');
} catch {
  // Hooks are advisory and must never break a session.
}
process.stdout.write('{}');
