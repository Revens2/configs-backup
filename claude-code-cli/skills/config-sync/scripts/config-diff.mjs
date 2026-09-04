#!/usr/bin/env node
// config-diff — compare la config agentique ACTIVE au dépôt configs-backup.
// LECTURE SEULE : ne copie rien, ne commite rien. Produit un diff structuré.
//
// Usage : node config-diff.mjs [--json] [--runtime claude|opencode|antigravity|all]
// Exit  : 0 aucun écart non intentionnel · 1 des écarts · 2 erreur interne

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const runtimeArg = (() => {
  const i = argv.indexOf('--runtime');
  return i >= 0 && argv[i + 1] ? argv[i + 1] : 'all';
})();

const HOME = (() => {
  const i = argv.indexOf('--home');
  return i >= 0 && argv[i + 1] ? argv[i + 1] : os.homedir();
})();
const BACKUP = path.join(HOME, 'configs-backup');

// Écarts VOULUS, à ne jamais signaler. Documenter toute nouvelle entrée ici, avec le pourquoi.
const EXCLUSIONS = {
  // Antigravity n'embarque volontairement que 2 sous-agents : les autres rôles sont inlinés en
  // clair côté AGY, car nommer un agent inexistant y fait échouer l'appel.
  // Vault : 2026-08-28_plan-de-nettoyage-et-test-sub-agents-sonnet_e447b78d.md §2bis.
  'antigravity:agents': '*',
  // Les skills hors scope sont rangés à part exprès.
  '*:skills-hors-scope': '*',
};

const RUNTIMES = {
  claude: {
    label: 'Claude Code',
    pairs: [
      { kind: 'skills', live: path.join(HOME, '.claude', 'skills'), repo: path.join(BACKUP, 'claude-code-cli', 'skills') },
      { kind: 'agents', live: path.join(HOME, '.claude', 'agents'), repo: path.join(BACKUP, 'claude-code-cli', 'agents') },
      { kind: 'hooks',  live: path.join(HOME, '.claude', 'hooks'),  repo: path.join(BACKUP, 'claude-code-cli', 'hooks') },
      { kind: 'commands', live: path.join(HOME, '.claude', 'commands'), repo: path.join(BACKUP, 'claude-code-cli', 'commands') },
    ],
    files: [
      { live: path.join(HOME, '.claude', 'settings.json'), repo: path.join(BACKUP, 'claude-code-cli', 'settings.json') },
      { live: path.join(HOME, '.claude', 'CLAUDE.md'),     repo: path.join(BACKUP, 'claude-code-cli', 'CLAUDE.md') },
      { live: path.join(HOME, '.mcp.json'),                repo: path.join(BACKUP, 'claude-code-cli', '.mcp.json') },
    ],
  },
  opencode: {
    label: 'OpenCode',
    pairs: [
      { kind: 'skills', live: path.join(HOME, '.config', 'opencode', 'skills'), repo: path.join(BACKUP, 'opencode', 'skills') },
      { kind: 'agents', live: path.join(HOME, '.config', 'opencode', 'agents'), repo: path.join(BACKUP, 'opencode', 'agents') },
    ],
    files: [
      { live: path.join(HOME, '.config', 'opencode', 'AGENTS.md'),     repo: path.join(BACKUP, 'opencode', 'AGENTS.md') },
      { live: path.join(HOME, '.config', 'opencode', 'opencode.jsonc'), repo: path.join(BACKUP, 'opencode', 'opencode.jsonc') },
    ],
  },
  antigravity: {
    label: 'Antigravity / AGY',
    pairs: [
      { kind: 'skills', live: path.join(HOME, '.agents', 'skills'), repo: path.join(BACKUP, 'antigravity', 'skills') },
      { kind: 'agents', live: path.join(HOME, '.agents', 'agents'), repo: path.join(BACKUP, 'antigravity', 'agents') },
    ],
    files: [],
  },
};

const exists = (p) => fs.existsSync(p);
const entries = (dir) => (exists(dir)
  ? fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => !e.name.startsWith('.') && (e.isDirectory() || e.isSymbolicLink() || e.name.endsWith('.md')))
      .map((e) => e.name)
  : null);

// Un lien cassé ou une course disque ne doit pas faire exploser l'outil.
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };

const hashDir = (dir) => {
  const h = crypto.createHash('sha1');
  const walk = (d, prefix = '') => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.name.startsWith('.') || /\.bak(\.|$)/.test(e.name)) continue;
      const p = path.join(d, e.name);
      // suivre les liens : c'est le contenu effectif qui compte
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p, prefix + e.name + '/');
      else h.update(prefix + e.name).update(fs.readFileSync(p));
    }
  };
  try { walk(dir); } catch { return null; }
  return h.digest('hex');
};

const hashFile = (p) => {
  try { return crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex'); } catch { return null; }
};

const excluded = (rt, kind) =>
  EXCLUSIONS[`${rt}:${kind}`] === '*' || EXCLUSIONS[`*:${kind}`] === '*';

const report = [];
const names = runtimeArg === 'all' ? Object.keys(RUNTIMES) : [runtimeArg];

for (const rt of names) {
  const cfg = RUNTIMES[rt];
  if (!cfg) { console.error(`runtime inconnu : ${rt}`); process.exit(2); }
  const section = { runtime: rt, label: cfg.label, onlyLive: [], onlyRepo: [], diverged: [], filesDiverged: [], skipped: [] };

  for (const { kind, live, repo } of cfg.pairs) {
    if (excluded(rt, kind)) { section.skipped.push(`${kind} — écart intentionnel documenté`); continue; }
    const l = entries(live), r = entries(repo);
    if (l === null || r === null) {
      section.skipped.push(`${kind} — ${l === null ? live : repo} absent`);
      continue;
    }
    for (const n of l) if (!r.includes(n)) section.onlyLive.push(`${kind}/${n}`);
    for (const n of r) if (!l.includes(n)) section.onlyRepo.push(`${kind}/${n}`);
    for (const n of l.filter((x) => r.includes(x))) {
      const a = path.join(live, n), b = path.join(repo, n);
      const [ha, hb] = isDir(a) ? [hashDir(a), hashDir(b)] : [hashFile(a), hashFile(b)];
      if (ha && hb && ha !== hb) section.diverged.push(`${kind}/${n}`);
    }
  }

  for (const { live, repo } of cfg.files) {
    if (!exists(live) || !exists(repo)) { section.skipped.push(`${path.basename(live)} — absent d'un côté`); continue; }
    if (hashFile(live) !== hashFile(repo)) section.filesDiverged.push(path.basename(live));
  }

  report.push(section);
}

const total = report.reduce((n, s) => n + s.onlyLive.length + s.onlyRepo.length + s.diverged.length + s.filesDiverged.length, 0);

if (asJson) {
  console.log(JSON.stringify({ total, report }, null, 2));
} else {
  console.log('config-sync — config active ⇄ configs-backup\n');
  for (const s of report) {
    console.log(`## ${s.label}`);
    const line = (title, arr) => { if (arr.length) { console.log(`  ${title} (${arr.length})`); arr.forEach((x) => console.log(`    - ${x}`)); } };
    line('ACTIF SEULEMENT — non versionné, perdu en cas de perte disque', s.onlyLive);
    line('DÉPÔT SEULEMENT — versionné mais pas installé', s.onlyRepo);
    line('DIVERGENT — même nom, contenu différent', s.diverged);
    line('FICHIERS DIVERGENTS', s.filesDiverged);
    if (s.skipped.length) { console.log('  ignoré'); s.skipped.forEach((x) => console.log(`    · ${x}`)); }
    if (!s.onlyLive.length && !s.onlyRepo.length && !s.diverged.length && !s.filesDiverged.length) console.log('  aligné.');
    console.log('');
  }
  console.log(total === 0 ? 'Aucun écart.' : `${total} écart(s). Aucune copie automatique — arbitrer sens par sens.`);
}

process.exit(total ? 1 : 0);
