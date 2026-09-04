#!/usr/bin/env node
// verify-before-done — hook Stop.
//
// Refuse de clore un tour où du code a été écrit sans qu'aucune preuve d'exécution n'ait suivi.
// Motif : 61 occurrences de « ça marche pas » / « débrouille-toi tout seul » dans les
// historiques, en réponse immédiate à une déclaration de complétion sans preuve.
//
// Invariants :
//  - `stop_hook_active` court-circuite tout : jamais de boucle.
//  - toute erreur interne => exit 0 silencieux. Ce hook ne doit jamais bloquer une session.
//  - une seule interpellation par tour ; l'agent reste libre de justifier qu'aucune preuve
//    n'est possible, il doit juste le dire.

import fs from 'node:fs';

const OK = () => process.exit(0);

// Commandes qui constituent une preuve d'exécution.
const PROOF = [
  /\b(pytest|jest|vitest|mocha|phpunit|rspec|go\s+test|cargo\s+(test|check|clippy))\b/,
  /\bnpm\s+(run\s+)?(test|lint|typecheck|build|check)\b/,
  /\b(pnpm|yarn|bun)\s+(run\s+)?(test|lint|typecheck|build|check)\b/,
  /\b(tsc|eslint|ruff|flake8|mypy|pyright|shellcheck|clippy|gofmt|black)\b/,
  /\bnode\s+[^|;]*\.(mjs|cjs|js)\b/,
  /\bpython3?\s+(-m\s+\w+|[^|;]*\.py)\b/,
  /\bpowershell[^|;]*-File\b/,
  /\b(curl|wget)\b/,
  /\bssh\s+[\w.-]+\s/,
  /\b(systemctl|journalctl|docker|pm2|ss\s+-|netstat)\b/,
  /\bgh\s+(run|pr)\s/,
  /\bgit\s+(diff|status|log)\b/,
  /\brtk\s+\w/,
];

const MUTATING_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const PROOF_TOOLS = new Set([
  'Bash', 'BashOutput', 'Read', 'Grep',
  'mcp__osauto__os_uia_inspect', 'mcp__osauto__os_probe_wait', 'mcp__osauto__os_visual_action',
  'mcp__claude-in-chrome__computer', 'mcp__claude-in-chrome__read_console_messages',
  'mcp__claude-in-chrome__read_page', 'mcp__chrome-devtools__take_screenshot',
]);

try {
  const raw = fs.readFileSync(0, 'utf8');
  const input = JSON.parse(raw || '{}');

  // Garde-fou anti-boucle : impératif.
  if (input.stop_hook_active) OK();

  const tp = input.transcript_path;
  if (!tp || !fs.existsSync(tp)) OK();

  const lines = fs.readFileSync(tp, 'utf8').split('\n').filter(Boolean);

  // Le tour courant commence au dernier vrai message utilisateur (hors résultats d'outil).
  let start = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    let e; try { e = JSON.parse(lines[i]); } catch { continue; }
    if (e.type !== 'user') continue;
    const c = e.message?.content;
    const isToolResult = Array.isArray(c) && c.some((b) => b?.type === 'tool_result');
    if (!isToolResult) { start = i; break; }
  }

  let mutatedAt = -1;   // index du dernier Write/Edit
  let provedAt = -1;    // index de la dernière preuve
  const touched = new Set();

  for (let i = start; i < lines.length; i++) {
    let e; try { e = JSON.parse(lines[i]); } catch { continue; }
    const c = e.message?.content;
    if (!Array.isArray(c)) continue;
    for (const b of c) {
      if (b?.type !== 'tool_use') continue;
      const name = b.name;
      if (MUTATING_TOOLS.has(name)) {
        mutatedAt = i;
        const p = b.input?.file_path ?? b.input?.notebook_path;
        if (p) touched.add(String(p).split(/[\\/]/).pop());
      } else if (PROOF_TOOLS.has(name)) {
        if (name !== 'Bash') { provedAt = i; continue; }
        const cmd = String(b.input?.command ?? '');
        if (PROOF.some((re) => re.test(cmd))) provedAt = i;
      }
    }
  }

  // Rien n'a été modifié, ou une preuve est venue après la dernière modification.
  if (mutatedAt < 0 || provedAt > mutatedAt) OK();

  const files = [...touched].slice(0, 6).join(', ') || 'les fichiers modifiés';
  const reason = [
    'verify-before-done : ce tour a modifié du code sans preuve d\'exécution ensuite.',
    `Fichiers touchés après la dernière vérification : ${files}.`,
    '',
    'Avant de clore, apporte une preuve adaptée à la typologie :',
    '  code      → test + lint + typecheck (la commande réelle, avec sa sortie)',
    '  CLI       → lancer le binaire et montrer la sortie',
    '  infra     → systemctl is-active / ss -tlnp / curl sur le service',
    '  UI        → capture d\'écran ou lecture de la page',
    '  config    → relire l\'effet, pas le fichier (le harness-doctor, un status, un dry-run)',
    '',
    'Si aucune preuve n\'est possible ici, dis-le explicitement et pourquoi — mais ne déclare',
    'pas « fait » sur une impression.',
  ].join('\n');

  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  process.exit(0);
} catch {
  OK();
}
