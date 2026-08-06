// PreInvocation — réinjecte le pointeur `progress.md` avant chaque appel au modèle.
//
// Antigravity n'expose aucun événement de pré-compaction (ses cinq événements sont
// PreToolUse, PostToolUse, PreInvocation, PostInvocation, Stop). Le relais est donc
// `PreInvocation` : plutôt que de sauvegarder l'état avant la perte, on le réécrit
// à chaque tour. Une compaction ne peut pas faire perdre la tâche en cours.
//
// Le message est `ephemeralMessage` : transitoire, il ne s'accumule pas dans
// l'historique. Coût réel mesuré : ~160 tokens par invocation.
//
// Contrat : JSON sur stdin (champs communs, dont `workspacePaths`), JSON sur stdout.
// Un hook qui plante bloque la boucle de l'agent : on échoue toujours en silence.

import fs from 'node:fs';
import path from 'node:path';

function readStdin() {
  return new Promise((resolve) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (buf += c));
    process.stdin.on('end', () => resolve(buf));
    setTimeout(() => resolve(buf), 3000).unref?.();
  });
}

function planPointer(dir) {
  const file = path.join(dir, 'progress.md');
  if (!fs.existsSync(file)) return null;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const done = lines.filter((l) => /^\s*[-*]\s*\[x\]/i.test(l)).length;

  // Une tâche = sa ligne cochable + ses lignes de continuation indentées
  // (`critère :`, `cible :`). Sans son critère, une reprise à froid ne sait pas
  // à quoi reconnaître que la tâche est finie.
  const todo = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*[-*]\s*\[[ ~]\]/.test(lines[i])) continue;
    const block = [lines[i].trim()];
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\s*[-*]\s*\[[ x~]\]/i.test(lines[j]) || !/^\s+\S/.test(lines[j])) break;
      block.push(lines[j].trim());
    }
    todo.push(block);
  }
  if (!todo.length) return null;

  const L = [];
  L.push("Plan en cours — source de vérité, prioritaire sur ta mémoire de session.");
  L.push(`${file} — ${done}/${done + todo.length} tâches cochées.`);
  L.push('');
  L.push("Tâche en cours, avec son critère d’acceptation :");
  todo[0].forEach((l, i) => L.push(i === 0 ? l : `  ${l}`));
  if (todo.length > 1) {
    L.push('');
    L.push('Ensuite : ' + todo.slice(1, 3).map((b) => b[0]).join(' · '));
  }
  L.push('');
  L.push("Relire progress.md avant d'agir ; ne rien cocher sans vérification.");
  return L.join('\n');
}

try {
  const raw = await readStdin();
  let p = {};
  try {
    p = JSON.parse(raw || '{}');
  } catch {
    p = {};
  }
  const roots = Array.isArray(p.workspacePaths) && p.workspacePaths.length
    ? p.workspacePaths
    : [process.env.USERPROFILE || process.cwd()];

  let msg = null;
  for (const r of roots) {
    msg = planPointer(r);
    if (msg) break;
  }

  // Trace de vérification, inerte hors mesure : sans la variable d'environnement,
  // rien n'est écrit. Aucune commande d'AGY ne permet autrement de constater
  // qu'un hook s'est déclenché.
  if (process.env.AGY_PLAN_POINTER_TRACE) {
    try {
      fs.appendFileSync(
        process.env.AGY_PLAN_POINTER_TRACE,
        `PreInvocation racines=${roots.join(',')} pointeur=${msg ? 'oui' : 'non'}\n`,
        'utf8'
      );
    } catch {
      /* une trace ne doit jamais bloquer la boucle */
    }
  }

  process.stdout.write(
    JSON.stringify(msg ? { injectSteps: [{ ephemeralMessage: msg }] } : {})
  );
} catch {
  process.stdout.write('{}');
}
