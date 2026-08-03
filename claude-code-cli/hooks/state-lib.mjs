// Bibliothèque partagée des hooks d'état (PreCompact / SessionEnd / SessionStart).
// Objectif : survivre à la compaction. On extrait du transcript JSONL un état
// court et auto-suffisant, puis on le réinjecte au démarrage suivant.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';

export const MAX_STATE_CHARS = 2500; // au-delà, la réinjection coûte plus qu'elle ne rapporte

export async function readPayload() {
  const raw = await new Promise((resolve) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (buf += c));
    process.stdin.on('end', () => resolve(buf));
    setTimeout(() => resolve(buf), 3000).unref?.();
  });
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

// Un fichier d'état par répertoire de travail, centralisé pour ne polluer aucun repo.
export function statePath(cwd) {
  const slug = (cwd || process.cwd())
    .replace(/[\\/:]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const dir = path.join(os.homedir(), '.claude', 'state', slug);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'STATE.md');
}

// SessionEnd ne fournit pas toujours transcript_path : on retrouve le transcript
// le plus récent du projet à partir du cwd.
export function findTranscript(given, cwd) {
  if (given && fs.existsSync(given)) return given;
  try {
    const slug = (cwd || process.cwd()).replace(/[\\/:]/g, '-');
    const dir = path.join(os.homedir(), '.claude', 'projects', slug);
    if (!fs.existsSync(dir)) return null;
    const best = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.jsonl'))
      .map((f) => path.join(dir, f))
      .map((f) => ({ f, m: fs.statSync(f).mtimeMs }))
      .sort((a, b) => b.m - a.m)[0];
    return best ? best.f : null;
  } catch {
    return null;
  }
}

export function isEmptyScan(s) {
  return !s.prompts.length && !s.files.length && !s.errors.length && !s.todos;
}

const trim = (s, n) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
};

function textOf(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((b) => b?.type === 'text')
    .map((b) => b.text)
    .join(' ');
}

// Parcours en flux : les transcripts atteignent facilement plusieurs Mo.
export async function scanTranscript(transcriptPath) {
  const out = { prompts: [], files: [], errors: [], todos: null };
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return out;

  const rl = readline.createInterface({
    input: fs.createReadStream(transcriptPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    const msg = ev.message ?? ev;
    const role = msg?.role ?? ev.type;
    const content = msg?.content;

    if (role === 'user' && ev.type !== 'tool_result') {
      const t = textOf(content);
      // On ignore les injections système et les retours d'outils.
      if (t && !t.startsWith('<') && !/^Caveat:/.test(t)) out.prompts.push(trim(t, 180));
    }

    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block?.type === 'tool_use') {
        const name = block.name || '';
        const fp = block.input?.file_path;
        // Le scratchpad est jetable : le lister au redémarrage n'apprend rien.
        const jetable = /[\\/](Temp|tmp|scratchpad)[\\/]/i.test(fp || '');
        if (fp && !jetable && /^(Edit|Write|NotebookEdit)$/.test(name)) out.files.push(fp);
        if (/Todo|TaskCreate|TaskUpdate/.test(name) && block.input) {
          out.todos = trim(JSON.stringify(block.input), 700);
        }
      }
      if (block?.type === 'tool_result' && block.is_error) {
        out.errors.push(trim(textOf(block.content) || block.content, 200));
      }
    }
  }

  const uniq = (a) => [...new Set(a)];
  out.prompts = out.prompts.slice(-5);
  out.files = uniq(out.files).slice(-20);
  out.errors = out.errors.slice(-5);
  return out;
}

export function renderState({ cwd, trigger, scan, stamp }) {
  const L = [];
  L.push(`# STATE — ${cwd || '(inconnu)'}`);
  L.push(`_maj ${stamp} · déclencheur : ${trigger}_`);
  L.push('');
  if (scan.prompts.length) {
    L.push('## Demandes récentes (chronologique)');
    scan.prompts.forEach((p) => L.push(`- ${p}`));
    L.push('');
  }
  if (scan.todos) {
    L.push('## Todo au moment du snapshot');
    L.push('```json');
    L.push(scan.todos);
    L.push('```');
    L.push('');
  }
  if (scan.files.length) {
    L.push('## Fichiers écrits/édités');
    scan.files.forEach((f) => L.push(`- ${f}`));
    L.push('');
  }
  if (scan.errors.length) {
    // Manus : garder les erreurs en contexte évite de rejouer le même échec.
    L.push('## Erreurs à ne pas rejouer');
    scan.errors.forEach((e) => L.push(`- ${e}`));
    L.push('');
  }
  let s = L.join('\n');
  if (s.length > MAX_STATE_CHARS) s = s.slice(0, MAX_STATE_CHARS) + '\n…(tronqué)';
  return s;
}

// Un hook qui plante bloque la session : on échoue toujours en silence.
export function bail(err) {
  if (err && process.env.CLAUDE_STATE_DEBUG) console.error(String(err));
  process.stdout.write(JSON.stringify({ continue: true }));
  process.exit(0);
}

