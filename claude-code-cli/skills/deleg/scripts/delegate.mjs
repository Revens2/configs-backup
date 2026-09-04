import fs from 'fs';
import path from 'path';

async function main() {
  const args = process.argv.slice(2);
  let userPrompt = '';
  let workspace = process.cwd();
  let outputFile = '';
  let continueSession = false;
  let timeoutMs = 360000; // 6 minutes max

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prompt' && args[i + 1]) {
      userPrompt = args[++i];
    } else if (args[i] === '--workspace' && args[i + 1]) {
      workspace = path.resolve(args[++i]);
    } else if (args[i] === '--output' && args[i + 1]) {
      outputFile = path.resolve(args[++i]);
    } else if (args[i] === '--continue') {
      continueSession = true;
    } else if (args[i] === '--fresh') {
      continueSession = false;
    } else if (args[i] === '--timeout' && args[i + 1]) {
      timeoutMs = parseInt(args[++i], 10);
    }
  }

  if (!userPrompt) {
    console.error(JSON.stringify({ ok: false, error: 'Argument --prompt obligatoire' }));
    process.exit(1);
  }

  if (!outputFile) {
    outputFile = path.join(workspace, '.deleg', 'plan.md');
  }

  const sessionFile = path.join(workspace, '.deleg', 'session.json');

  // 1. Découverte Chrome CDP
  let list;
  try {
    const lRes = await fetch('http://127.0.0.1:9222/json/list');
    list = await lRes.json();
  } catch (e) {
    console.error(JSON.stringify({
      ok: false,
      error: 'Chrome CDP injoignable sur 127.0.0.1:9222. Vérifiez que Chrome est lancé avec --remote-debugging-port=9222.'
    }));
    process.exit(1);
  }

  const target = list.find(t => t.url && t.url.includes('ia.francestudent.org'));
  if (!target) {
    console.error(JSON.stringify({
      ok: false,
      error: 'Onglet ia.francestudent.org non trouvé dans Chrome. Ouvrez la session ChatGPT Solo.'
    }));
    process.exit(1);
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let msgId = 1;

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  await send('Page.enable');
  await send('Runtime.enable');

  // 2. Gestion de l'isolation du fil (Nouveau fil par défaut vs Continuer fil existant)
  let isContinuing = false;
  let targetChatUrl = '';

  if (continueSession && fs.existsSync(sessionFile)) {
    try {
      const sessData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      if (sessData.conversationUrl && sessData.conversationUrl.includes('/chat/')) {
        targetChatUrl = sessData.conversationUrl;
        isContinuing = true;
      }
    } catch (e) {
      console.warn('Session existante illisible, création d\'un nouveau fil.');
    }
  }

  if (isContinuing) {
    const currentUrlEval = await send('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    });
    if (currentUrlEval.result?.value !== targetChatUrl) {
      await send('Page.navigate', { url: targetChatUrl });
      await new Promise(r => setTimeout(r, 2000));
    }
  } else {
    // Mode nouveau fil vierge : cliquer sur "Nouvelle discussion" ou naviguer sur /
    const clickNew = await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const newChatBtn = buttons.find(b => b.innerText && b.innerText.includes('Nouvelle discussion')) ||
                           buttons.find(b => b.getAttribute('aria-label')?.includes('Nouvelle discussion')) ||
                           buttons.find(b => b.getAttribute('data-testid')?.includes('new-chat'));
        if (newChatBtn) {
          newChatBtn.click();
          return { ok: true };
        }
        return { ok: false };
      })()`,
      returnByValue: true
    });

    if (!clickNew.result?.value?.ok) {
      await send('Page.navigate', { url: 'https://ia.francestudent.org/' });
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  // 3. Attendre que le textarea et le formulaire soient disponibles et hydratés
  let textareaReady = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    const readyCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const ta = document.querySelector('textarea[name="message"]') || document.querySelector('textarea');
        const form = ta ? ta.closest('form') : null;
        return !!ta && !ta.disabled && !!form;
      })()`,
      returnByValue: true
    });
    if (readyCheck.result?.value) {
      textareaReady = true;
      break;
    }
    await new Promise(r => setTimeout(r, 400));
  }

  if (!textareaReady) {
    ws.close();
    console.error(JSON.stringify({ ok: false, error: 'Zone de texte non trouvée après initialisation de la discussion.' }));
    process.exit(1);
  }

  await new Promise(r => setTimeout(r, 1000));

  const formattedMessage = `[DÉLÉGATION DE RÉFLEXION & ARCHITECTURE /deleg]
Tu es le partenaire de réflexion, d'exploration et de planification pour le workspace local ci-dessous.
L'agent d'exécution local (Antigravity / Claude Code) prendra en charge l'application exacte du code, les commandes système et la validation des tests.

Workspace local : ${workspace}
Demande utilisateur :
${userPrompt}

Directives de réponse :
1. Utilise l'outil MCP open_workspace avec le chemin '${workspace.replace(/\\/g, '\\\\')}'.
2. Explore la codebase nécessaire (fichiers de code, documentation, structure).
3. Rédige un plan de conception rigoureux et un MANIFESTE D'ACTIONS comprenant :
   - ## Diagnostic & Analyse technique
   - ## Choix d'Architecture
   - ## Plan d'Exécution pas à pas (avec chemins exacts de fichiers à créer/éditer et commandes de test)
   - ## Points de vigilance & Sécurité`;

  const initialCountRes = await send('Runtime.evaluate', {
    expression: `(() => document.querySelectorAll('.prose, [class*="group/message"]').length)()`,
    returnByValue: true
  });
  const initialMessagesCount = initialCountRes.result?.value || 0;

  // 4. Injecter et Soumettre
  const injected = await send('Runtime.evaluate', {
    expression: `(async () => {
      function setReactValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(element, value);
        } else if (valueSetter) {
          valueSetter.call(element, value);
        } else {
          element.value = value;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const ta = document.querySelector('textarea[name="message"]') || document.querySelector('textarea');
      if (!ta) return { ok: false, error: 'No textarea' };

      ta.focus();
      setReactValue(ta, ${JSON.stringify(formattedMessage)});

      const form = ta.closest('form');
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 100));
        const buttons = form ? Array.from(form.querySelectorAll('button')) : [];
        const sendBtn = buttons.length > 0 ? buttons[buttons.length - 1] : document.querySelector('[data-testid="send-button"]');
        if (sendBtn && (!sendBtn.disabled && (sendBtn.className.includes('bg-primary') || sendBtn.getAttribute('type') === 'submit' || !sendBtn.className.includes('bg-muted')))) {
          sendBtn.click();
          return { ok: true, method: 'submit-click' };
        }
      }

      // Fallback click on last button in form
      const buttons = form ? Array.from(form.querySelectorAll('button')) : [];
      const fallbackBtn = buttons[buttons.length - 1];
      if (fallbackBtn) {
        fallbackBtn.click();
        return { ok: true, method: 'fallback-click' };
      }

      return { ok: false, error: 'Bouton d\'envoi désactivé ou introuvable' };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  if (!injected.result?.value?.ok) {
    ws.close();
    console.error(JSON.stringify({ ok: false, error: injected.result?.value?.error || 'Échec envoi prompt' }));
    process.exit(1);
  }

  // 5. Attente active de la génération et extraction
  const startTime = Date.now();
  let responseText = '';
  let lastStableText = '';
  let stableIterations = 0;
  let activeChatUrl = '';

  while (Date.now() - startTime < timeoutMs) {
    await new Promise(r => setTimeout(r, 3000));

    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        const stopBtn = Array.from(document.querySelectorAll('button')).find(b => {
          const text = (b.innerText || '') + (b.getAttribute('aria-label') || '') + (b.getAttribute('data-testid') || '');
          return /arr[êe]ter|stop/i.test(text);
        });

        const activeTools = document.querySelectorAll('[data-testid*="tool-call"], [class*="tool-calling"], [class*="executing"]').length > 0;
        const isGenerating = !!stopBtn || activeTools;

        const messageElements = Array.from(document.querySelectorAll('[data-message-author-role="assistant"], .prose, [class*="group/message"]'));
        const messages = messageElements.map(el => el.innerText.trim()).filter(Boolean);
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : '';

        return {
          isGenerating,
          messagesCount: messages.length,
          lastMessage,
          currentHref: window.location.href
        };
      })()`,
      returnByValue: true
    });

    const status = check.result?.value;
    if (!status) continue;

    if (status.currentHref && status.currentHref.includes('/chat/')) {
      activeChatUrl = status.currentHref;
    }

    const currentLastMsg = status.lastMessage || '';

    if (status.messagesCount > initialMessagesCount && currentLastMsg && currentLastMsg !== formattedMessage) {
      if (!status.isGenerating) {
        if (currentLastMsg === lastStableText && currentLastMsg.length > 30) {
          stableIterations++;
          if (stableIterations >= 2) {
            responseText = currentLastMsg;
            break;
          }
        } else {
          lastStableText = currentLastMsg;
          stableIterations = 1;
        }
      } else {
        stableIterations = 0;
      }
    }
  }

  const finalHrefEval = await send('Runtime.evaluate', {
    expression: 'window.location.href',
    returnByValue: true
  });
  const finalHref = activeChatUrl || finalHrefEval.result?.value || targetChatUrl;

  ws.close();

  if (!responseText) {
    console.error(JSON.stringify({
      ok: false,
      error: 'Délai d\'attente dépassé pour la réponse de ChatGPT Solo.',
      lastKnownUrl: finalHref
    }));
    process.exit(1);
  }

  const convMatch = finalHref.match(/\/chat\/([a-zA-Z0-9-]+)/);
  const conversationId = convMatch ? convMatch[1] : null;

  // Persistance dans .deleg/session.json
  const delegDir = path.join(workspace, '.deleg');
  if (!fs.existsSync(delegDir)) fs.mkdirSync(delegDir, { recursive: true });

  const sessionData = {
    conversationId,
    conversationUrl: finalHref,
    workspace,
    lastUpdated: new Date().toISOString()
  };
  fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2), 'utf8');

  // Persistance du plan
  const outDir = path.dirname(outputFile);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outputFile, responseText, 'utf8');

  console.log(JSON.stringify({
    ok: true,
    mode: isContinuing ? 'continued' : 'fresh-isolated',
    conversationId,
    conversationUrl: finalHref,
    workspace,
    outputFile,
    durationSeconds: Math.round((Date.now() - startTime) / 1000),
    plan: responseText
  }, null, 2));
}

main().catch(err => {
  console.error(JSON.stringify({ ok: false, error: err.message }));
  process.exit(1);
});
