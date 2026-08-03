// PreCompact / SessionEnd — sérialise l'état vivant AVANT la perte d'information.
import fs from 'node:fs';
import {
  readPayload,
  statePath,
  scanTranscript,
  findTranscript,
  isEmptyScan,
  renderState,
  bail,
} from './state-lib.mjs';

try {
  const p = await readPayload();
  const cwd = p.cwd || process.cwd();
  const trigger = p.hook_event_name
    ? `${p.hook_event_name}${p.trigger ? ` (${p.trigger})` : ''}`
    : 'manuel';

  const scan = await scanTranscript(findTranscript(p.transcript_path, cwd));
  const file = statePath(cwd);

  // Un snapshot vide n'apporte rien et écraserait un état antérieur utile.
  if (isEmptyScan(scan) && fs.existsSync(file)) {
    process.stdout.write(JSON.stringify({ continue: true }));
    process.exit(0);
  }

  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
  fs.writeFileSync(file, renderState({ cwd, trigger, scan, stamp }), 'utf8');
  process.stdout.write(JSON.stringify({ continue: true }));
} catch (e) {
  bail(e);
}

