#!/usr/bin/env node
// harness-doctor — audit en LECTURE SEULE de l'intégrité du harness agentique.
// Node stdlib uniquement. Ne corrige rien : un doctor qui répare est un doctor qu'on n'ose
// plus lancer.
//
// Usage :  node harness-doctor.mjs [--json] [--home <chemin>]
// Sortie :  0 = tout vert · 1 = au moins un ÉCHEC · 2 = erreur interne

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const HOME = (() => {
  const i = argv.indexOf('--home');
  return i >= 0 && argv[i + 1] ? argv[i + 1] : os.homedir();
})();

const CLAUDE = path.join(HOME, '.claude');
const AGENTS = path.join(HOME, '.agents');
const BACKUP = path.join(HOME, 'configs-backup');

const results = [];
const check = (id, title, fn) => {
  try {
    const r = fn();
    results.push({ id, title, status: r.ok ? 'OK' : 'FAIL', detail: r.detail ?? [] });
  } catch (e) {
    results.push({ id, title, status: 'SKIP', detail: [`non évaluable : ${e.message}`] });
  }
};

const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, 'utf8');
const readJson = (p) => JSON.parse(read(p).replace(/^﻿/, ''));
const walk = (dir, out = []) => {
  if (!exists(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isSymbolicLink()) out.push({ path: f, link: true, dir: false });
    else if (e.isDirectory()) { out.push({ path: f, link: false, dir: true }); walk(f, out); }
    else out.push({ path: f, link: false, dir: false });
  }
  return out;
};
const rel = (p) => path.relative(HOME, p) || p;

// --- 1. CLAUDE.md ⇄ AGENTS.md : même fichier ? -----------------------------------
check(1, 'CLAUDE.md et AGENTS.md sont le même fichier', () => {
  const bad = [];
  const roots = [HOME, CLAUDE, path.join(HOME, '.config', 'opencode')];
  for (const r of roots) {
    const c = path.join(r, 'CLAUDE.md');
    const a = path.join(r, 'AGENTS.md');
    if (!exists(c) || !exists(a)) continue;
    const lc = fs.lstatSync(c), la = fs.lstatSync(a);
    const linked = lc.isSymbolicLink() || la.isSymbolicLink() ||
      (lc.ino !== 0 && lc.ino === la.ino && lc.dev === la.dev);
    if (linked) continue;
    const same = read(c) === read(a);
    bad.push(`${rel(r)} : deux fichiers réguliers, contenus ${same ? 'IDENTIQUES (lien à rétablir)' : 'DIVERGENTS'}`);
  }
  return { ok: bad.length === 0, detail: bad };
});

// --- 2. Tout hook de settings.json pointe sur un fichier existant -----------------
const settingsFiles = ['settings.json', 'settings.local.json']
  .map((f) => path.join(CLAUDE, f)).filter(exists);

const hookCommands = () => {
  const cmds = [];
  for (const sf of settingsFiles) {
    let s; try { s = readJson(sf); } catch { continue; }
    const visit = (n) => {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) return n.forEach(visit);
      if (typeof n.command === 'string') cmds.push({ cmd: n.command, from: rel(sf) });
      Object.values(n).forEach(visit);
    };
    visit(s.hooks);
  }
  return cmds;
};

check(2, 'Chaque hook déclaré pointe sur un fichier existant', () => {
  const bad = [];
  for (const { cmd, from } of hookCommands()) {
    // extraire les chemins de script cités dans la commande
    const m = cmd.match(/[A-Za-z0-9_./\\:~$-]+\.(mjs|js|sh|ps1|py|cjs)/g) || [];
    for (let f of m) {
      let p = f.replace(/\$CLAUDE_PROJECT_DIR|%CLAUDE_PROJECT_DIR%/g, HOME)
              .replace(/^~/, HOME).replace(/\\/g, path.sep);
      if (!path.isAbsolute(p)) p = path.join(CLAUDE, p.replace(/^\.claude[\\/]/, ''));
      if (!exists(p)) bad.push(`${from} : « ${f} » introuvable (résolu en ${p})`);
    }
  }
  return { ok: bad.length === 0, detail: bad };
});

// --- 3. Tout script de .claude/hooks est référencé quelque part -------------------
check(3, 'Aucun script orphelin dans .claude/hooks', () => {
  const dir = path.join(CLAUDE, 'hooks');
  if (!exists(dir)) return { ok: true, detail: [] };
  const scripts = fs.readdirSync(dir).filter((f) => /\.(mjs|js|sh|ps1|py|cjs)$/.test(f));
  // corpus de référence : settings, .mcp.json, et les autres scripts (imports croisés)
  let corpus = '';
  for (const f of [...settingsFiles, path.join(HOME, '.mcp.json'), path.join(CLAUDE, '.mcp.json')]) {
    if (exists(f)) corpus += read(f);
  }
  // un script ne contient pas son propre nom : toute occurrence est une vraie référence
  for (const s of scripts) corpus += read(path.join(dir, s));
  const bad = scripts.filter((s) => corpus.split(s).length - 1 === 0);
  return {
    ok: bad.length === 0,
    detail: bad.map((b) => `${b} n'est cité ni dans settings.json, ni dans .mcp.json, ni par un autre hook`),
  };
});

// --- 4. Tout skill nommé dans un CLAUDE.md existe --------------------------------
const skillsDir = path.join(CLAUDE, 'skills');
const installedSkills = exists(skillsDir)
  ? fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() || e.isSymbolicLink()).map((e) => e.name)
  : [];

check(4, 'Tout skill prescrit par un CLAUDE.md est installé', () => {
  const bad = [];
  const mds = [path.join(CLAUDE, 'CLAUDE.md'), path.join(HOME, 'CLAUDE.md')].filter(exists);
  for (const md of mds) {
    const txt = read(md);
    // on ne considère que les noms en `backticks` explicitement qualifiés de skill
    const re = /(?:skill|compétence)\s+`([a-z0-9][a-z0-9-]{2,})`/gi;
    for (const m of txt.matchAll(re)) {
      const name = m[1];
      if (!installedSkills.includes(name)) bad.push(`${rel(md)} prescrit le skill « ${name} », absent de .claude/skills`);
    }
  }
  return { ok: bad.length === 0, detail: [...new Set(bad)] };
});

// --- 5. Tout script cité dans un SKILL.md existe ---------------------------------
check(5, 'Tout script cité dans un SKILL.md existe', () => {
  const bad = [];
  for (const s of installedSkills) {
    const sk = path.join(skillsDir, s, 'SKILL.md');
    if (!exists(sk)) { bad.push(`${s} : SKILL.md manquant`); continue; }
    const txt = read(sk);
    // Uniquement `scripts/` : un SKILL.md cite couramment des `references/` en exemple
    // pédagogique (skill-creator, graphify), ce qui noie le signal sous les faux positifs.
    for (const m of txt.matchAll(/scripts[\\/][A-Za-z0-9_.-]+\.(?:mjs|js|sh|ps1|py)/g)) {
      const target = path.join(skillsDir, s, m[0].replace(/\\/g, path.sep));
      if (!exists(target)) bad.push(`${s} : « ${m[0]} » cité mais absent`);
    }
  }
  return { ok: bad.length === 0, detail: [...new Set(bad)] };
});

// --- 6. Pas de progress.md / plan.md à la racine du home -------------------------
check(6, 'Aucun progress.md/plan.md à la racine du home', () => {
  const bad = ['progress.md', 'plan.md', 'PROGRESS.md', 'PLAN.md']
    .filter((f) => exists(path.join(HOME, f)))
    .map((f) => `${f} présent à la racine du home — il sera réinjecté par SessionStart dans TOUTES les sessions`);
  return { ok: bad.length === 0, detail: bad };
});

// --- 7. Résidus gemini.md et .bak -----------------------------------------------
check(7, 'Aucun résidu .bak ni gemini.md égaré', () => {
  const bad = [];
  // `state/archive-*` et `backups/` SONT les destinations d'archivage : y trouver un résidu
  // est le comportement voulu, pas une dérive.
  const skipArchive = (p) => /[\\/](state[\\/]archive-|backups[\\/])/.test(p);
  for (const f of walk(CLAUDE)) {
    if (f.dir || skipArchive(f.path)) continue;
    if (/\.bak(\.|$)/.test(path.basename(f.path))) bad.push(`résidu .bak : ${rel(f.path)}`);
    if (/^gemini\.md$/i.test(path.basename(f.path))) bad.push(`gemini.md égaré : ${rel(f.path)}`);
  }
  // le fichier natif du runtime Gemini n'est PAS un résidu : ~/.gemini/GEMINI.md est exclu.
  return { ok: bad.length === 0, detail: bad.slice(0, 30) };
});

// --- 8. configs-backup propre ----------------------------------------------------
check(8, 'configs-backup est commité et à jour', () => {
  if (!exists(path.join(BACKUP, '.git'))) return { ok: true, detail: ['configs-backup absent — contrôle sans objet'] };
  const out = execFileSync('git', ['-C', BACKUP, 'status', '--porcelain'], { encoding: 'utf8' });
  const lines = out.split('\n').filter(Boolean);
  const last = execFileSync('git', ['-C', BACKUP, 'log', '-1', '--format=%h %ad', '--date=short'], { encoding: 'utf8' }).trim();
  if (lines.length === 0) return { ok: true, detail: [`propre · dernier commit ${last}`] };
  return {
    ok: false,
    detail: [`${lines.length} entrée(s) non commitée(s) · dernier commit ${last}`, ...lines.slice(0, 15).map((l) => '  ' + l)],
  };
});

// --- 9. Serveurs MCP ⇄ liste documentée ------------------------------------------
check(9, 'Serveurs .mcp.json conformes à la liste documentée', () => {
  const mcp = path.join(HOME, '.mcp.json');
  if (!exists(mcp)) return { ok: true, detail: ['.mcp.json absent'] };
  const declared = Object.keys(readJson(mcp).mcpServers ?? {});
  const md = path.join(CLAUDE, 'CLAUDE.md');
  if (!exists(md)) return { ok: true, detail: [`déclarés : ${declared.join(', ')} (pas de CLAUDE.md pour comparer)`] };
  const txt = read(md);
  const undocumented = declared.filter((s) => !txt.includes(`\`${s}\``));
  return {
    ok: undocumented.length === 0,
    detail: undocumented.map((s) => `serveur « ${s} » déclaré dans .mcp.json mais absent de ~/.claude/CLAUDE.md`),
  };
});

// --- 10. Doublons .claude/skills ⇄ .agents/skills en copie réelle ----------------
check(10, 'Aucun skill dupliqué en copie réelle entre les deux magasins', () => {
  const other = path.join(AGENTS, 'skills');
  if (!exists(other) || !exists(skillsDir)) return { ok: true, detail: ['un des deux magasins est absent'] };
  const bad = [];
  for (const s of fs.readdirSync(other)) {
    if (s.startsWith('.')) continue;
    const a = path.join(skillsDir, s), b = path.join(other, s);
    if (!exists(a)) continue;
    if (fs.lstatSync(a).isSymbolicLink() || fs.lstatSync(b).isSymbolicLink()) continue;
    bad.push(`${s} existe en copie réelle des deux côtés — deux versions qui vont diverger`);
  }
  return { ok: bad.length === 0, detail: bad };
});

// --- Rapport ---------------------------------------------------------------------
const fails = results.filter((r) => r.status === 'FAIL');

if (asJson) {
  console.log(JSON.stringify({ home: HOME, results, failed: fails.length }, null, 2));
} else {
  console.log(`harness-doctor — ${HOME}\n`);
  for (const r of results) {
    const mark = r.status === 'OK' ? ' OK ' : r.status === 'FAIL' ? 'FAIL' : 'SKIP';
    console.log(`[${mark}] ${String(r.id).padStart(2)}. ${r.title}`);
    for (const d of r.detail) console.log(`         ${d}`);
  }
  console.log(`\n${results.length - fails.length}/${results.length} contrôles au vert.`);
  if (fails.length) console.log(`Échecs : ${fails.map((f) => f.id).join(', ')}. Aucune correction automatique — corriger à la main.`);
}

process.exit(fails.length ? 1 : 0);
