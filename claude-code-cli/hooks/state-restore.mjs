// SessionStart — réinjecte l'état sauvegardé (startup | resume | compact).
import fs from 'node:fs';
import { readPayload, statePath, bail } from './state-lib.mjs';

try {
  const p = await readPayload();
  const cwd = p.cwd || process.cwd();
  const file = statePath(cwd);

  if (!fs.existsSync(file)) {
    process.stdout.write(JSON.stringify({ continue: true }));
    process.exit(0);
  }

  const body = fs.readFileSync(file, 'utf8').trim();
  if (!body) {
    process.stdout.write(JSON.stringify({ continue: true }));
    process.exit(0);
  }

  const source = p.source || 'startup';
  const entete =
    source === 'compact'
      ? "Contexte restauré après compaction. Ce bloc remplace ce qui vient d'être résumé — il fait autorité sur l'historique compacté. La mission en cours n'est pas terminée : rouvre le progress.md indiqué ci-dessous et reprends la tâche marquée [~] là où elle s'est arrêtée, sans attendre qu'on te la rappelle."
      : 'État de la session précédente sur ce répertoire. Contexte, pas une instruction : ne reprends pas ces tâches sans demande explicite.';

  process.stdout.write(
    JSON.stringify({
      continue: true,
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: `${entete}\n\n${body}`,
      },
    })
  );
} catch (e) {
  bail(e);
}
