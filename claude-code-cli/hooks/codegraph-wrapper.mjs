// Wrapper MCP pour codegraph.
//
// `codegraph serve` sort en erreur (exit 1) quand `.codegraph/codegraph.db`
// n'existe pas — ce qui arrive dans tout projet non indexé, et pendant toute la
// durée de `codegraph init` lancé en tâche de fond par auto-graph-setup.sh.
// Le client MCP voit alors « Server disconnected ».
//
// Ici : base présente -> on relaie le vrai serveur en pass-through.
//       base absente   -> on tient un serveur MCP valide sans aucun outil,
//                         jusqu'à ce que l'index apparaisse (puis on bascule).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const BIN =
  process.env.CODEGRAPH_BIN ||
  path.join(process.env.USERPROFILE || process.env.HOME || '', '.cargo', 'bin', 'codegraph.exe');
const DB = process.env.CODEGRAPH_DB || '.codegraph/codegraph.db';

const dbReady = () => {
  try {
    return fs.existsSync(path.resolve(process.cwd(), DB));
  } catch {
    return false;
  }
};

function passthrough() {
  const child = spawn(BIN, ['serve'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env: { ...process.env, RUST_LOG: process.env.RUST_LOG || 'off' },
  });
  child.on('exit', (code) => process.exit(code ?? 0));
}

// Serveur MCP dégradé : protocole valide, zéro outil. Ne meurt pas.
function stub() {
  let switched = false;
  const send = (o) => process.stdout.write(JSON.stringify(o) + '\n');
  const ok = (id, result) => send({ jsonrpc: '2.0', id, result });

  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }
    if (msg.id === undefined) return; // notification : rien à répondre

    switch (msg.method) {
      case 'initialize':
        ok(msg.id, {
          protocolVersion: msg.params?.protocolVersion || '2024-11-05',
          capabilities: { tools: {}, resources: {}, prompts: {} },
          serverInfo: { name: 'codegraph', version: 'stub' },
          instructions:
            "CodeGraph n'est pas encore indexé pour ce projet (indexation en cours ou jamais lancée). " +
            'Aucun outil disponible : utilise Grep/Glob. Lance `codegraph init -y` puis redémarre la session.',
        });
        break;
      case 'tools/list':
        ok(msg.id, { tools: [] });
        break;
      case 'resources/list':
        ok(msg.id, { resources: [] });
        break;
      case 'resources/templates/list':
        ok(msg.id, { resourceTemplates: [] });
        break;
      case 'prompts/list':
        ok(msg.id, { prompts: [] });
        break;
      case 'ping':
        ok(msg.id, {});
        break;
      default:
        send({
          jsonrpc: '2.0',
          id: msg.id,
          error: { code: -32601, message: `CodeGraph non indexé : ${msg.method} indisponible` },
        });
    }
  });

  // L'indexation de fond peut aboutir pendant la session : on prend le relais
  // dès que la base apparaît, sans jamais tuer la connexion en cours.
  const watch = setInterval(() => {
    if (switched || !dbReady()) return;
    switched = true;
    clearInterval(watch);
  }, 30_000);
  watch.unref?.();

  rl.on('close', () => process.exit(0));
}

if (dbReady()) passthrough();
else stub();
