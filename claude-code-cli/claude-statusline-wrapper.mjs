#!/usr/bin/env node
// claude-statusline-wrapper.mjs
// Exécute claude-statusline.mjs puis idlepay-statusline.mjs en parallèle,
// lit le stdin une seule fois, le passe aux deux scripts, et concatène les sorties.
// Zéro dépendance. Ne throw jamais.

import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

const HOME = homedir();
const STATUSLINE   = join(HOME, '.claude', 'claude-statusline.mjs');
const IDLEPAY      = join(HOME, '.idlepay', 'idlepay-statusline.mjs');
const STDIN_DEADLINE_MS = 300;

async function readStdin() {
  if (process.stdin.isTTY) return Buffer.alloc(0);
  try {
    const chunks = [];
    const dl = setTimeout(() => process.stdin.destroy(), STDIN_DEADLINE_MS);
    dl.unref();
    for await (const c of process.stdin) chunks.push(c);
    clearTimeout(dl);
    return Buffer.concat(chunks);
  } catch { return Buffer.alloc(0); }
}

async function runScript(scriptPath, stdinData) {
  return new Promise((resolve) => {
    let out = '';
    const child = spawn(process.execPath, [scriptPath], { stdio: ['pipe', 'pipe', 'ignore'] });
    child.stdout.on('data', d => out += d.toString());
    child.on('close', () => resolve(out));
    child.on('error', () => resolve(''));
    child.stdin.write(stdinData);
    child.stdin.end();
  });
}

async function scriptExists(p) {
  try { await readFile(p); return true; } catch { return false; }
}

async function main() {
  const stdinData = await readStdin();

  const tasks = [runScript(STATUSLINE, stdinData)];
  if (await scriptExists(IDLEPAY)) {
    tasks.push(runScript(IDLEPAY, stdinData));
  }

  const results = await Promise.all(tasks);
  const DIM = '\x1b[2m';
  const R   = '\x1b[0m';
  const SEP = `  ${DIM}┃${R}  `;

  const combined = results.filter(Boolean).join(SEP);
  process.stdout.write(combined);
}

main().catch(() => process.stdout.write('⬡ claude'));

