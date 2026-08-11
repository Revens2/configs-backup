#!/usr/bin/env node
// claude-statusline.mjs — version ultra-rapide sans parsing lourd de fichiers transcripts
// Affiche : modèle | thinking effort | ctx tokens (%) | 5h restant % | 7d restant % | répertoire | idlepay ad

import { readFile, writeFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const HOME = homedir();
const STATS_CACHE   = join(HOME, '.claude', 'stats-cache.json');
const IDLEPAY_DIR   = join(HOME, '.idlepay');
const AD_CACHE_FILE = join(IDLEPAY_DIR, 'ad-cache.json');
const HEARTBEAT_FILE = join(IDLEPAY_DIR, 'heartbeat');

const STDIN_DEADLINE_MS = 80; // Tranchant pour éviter tout blocage du CLI
const AD_STALE_MS = 5 * 60_000;
const ACTIVITY_WINDOW_MS = 5 * 60_000;

const R  = '\x1b[0m';
const B  = (s) => `\x1b[1m${s}${R}`;
const DIM = (s) => `\x1b[2m${s}${R}`;
const rgb  = (r,g,b) => `\x1b[38;2;${r};${g};${b}m`;
const bgrb = (r,g,b) => `\x1b[48;2;${r};${g};${b}m`;

function pill(text, fr, fg, fb, br, bg, bb) {
  return `${bgrb(br,bg,bb)}${rgb(fr,fg,fb)} ${text} ${R}`;
}

async function readStdin() {
  if (process.stdin.isTTY) return null;
  try {
    const chunks = [];
    const deadline = setTimeout(() => process.stdin.destroy(), STDIN_DEADLINE_MS);
    deadline.unref();
    for await (const chunk of process.stdin) chunks.push(chunk);
    clearTimeout(deadline);
    if (!chunks.length) return null;
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return null; }
}

function cleanAd(s) {
  if (typeof s !== 'string') return '';
  let out = '';
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (c <= 31 || (c >= 127 && c <= 159)) continue;
    out += ch;
  }
  return out.trim();
}
function safeUrl(u) {
  const c = cleanAd(u);
  return /^https?:\/\//i.test(c) ? c : null;
}
function hexToRgb(hex) {
  if (typeof hex !== 'string') return null;
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function contrastFg({ r, g, b }) {
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? 30 : 97;
}
function link(url, text) {
  if (!url) return text;
  return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
}
function renderAd(ad) {
  const style = ad.style ?? {};
  const text = cleanAd(ad.text).slice(0, 50) || 'Sponsored';
  const url = safeUrl(ad.url);
  const bg = hexToRgb(style.badgeColorHex) ?? { r: 245, g: 158, b: 11 };
  const badge = `\x1b[1;${contrastFg(bg)};48;2;${bg.r};${bg.g};${bg.b}m SPONSORED ${R}`;
  const weight = style.bold === false ? '' : '1;';
  const fg = hexToRgb(style.textColorHex);
  const color = fg ? `38;2;${fg.r};${fg.g};${fg.b}` : '97';
  return `${badge} \x1b[${weight}${color}m${link(url, text)}${R}${url ? ' ↗' : ''}`;
}
function renderPaused() {
  return `\x1b[2;37m${link('https://idlepay.co/paused', '⏸ idlepay paused — open VS Code')} ↗${R}`;
}
async function touchHeartbeat() {
  try { await writeFile(HEARTBEAT_FILE, String(Date.now())); } catch { /**/ }
}

function fmtTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

function shortModel(id, displayName) {
  const name = displayName || id || 'unknown';
  return name.replace(/^claude[- ]/i, '').replace(/-(\d+)-(\d+)$/, '-$1.$2').replace(/ \(Thinking\)/i, ' 🧠');
}

function effortBadge(effort) {
  switch ((effort ?? '').toLowerCase()) {
    case 'low':    return pill('LOW',    255,255,255, 60,80,100);
    case 'medium': return pill('MED',    255,255,255, 80,100,50);
    case 'high':   return pill('HIGH',   255,255,255, 160,80,0);
    case 'max':    return pill('MAX 🔥', 255,255,255, 180,30,30);
    default:       return pill('LOW',    255,255,255, 60,80,100);
  }
}

function ctxTokens(usedTokens, windowSize) {
  const used = usedTokens ?? 0;
  const total = windowSize ?? 0;
  const pct = total > 0 ? used / total : 0;
  const color = pct < 0.60 ? rgb(80,200,120) : pct < 0.85 ? rgb(255,200,60) : rgb(255,80,60);
  return `${color}${fmtTokens(used)}${total > 0 ? '/' + fmtTokens(total) : ''} (${Math.round(pct * 100)}%)${R}`;
}

// Calcule les tokens du jour depuis stats-cache (ultra-rapide)
function getCacheTokensToday(cache) {
  const entries = cache?.dailyModelTokens;
  if (!entries) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find(e => e.date === today);
  return todayEntry ? Object.values(todayEntry.tokensByModel ?? {}).reduce((s,v) => s+v, 0) : 0;
}

function getCacheTokens7d(cache) {
  const entries = cache?.dailyModelTokens;
  if (!entries) return 0;
  const cutoff = Date.now() - 7 * 24 * 3_600_000;
  let total = 0;
  for (const entry of entries) {
    if (new Date(entry.date + 'T23:59:59').getTime() >= cutoff) {
      total += Object.values(entry.tokensByModel ?? {}).reduce((s,v) => s+v, 0);
    }
  }
  return total;
}

async function main() {
  const session = await readStdin();

  let cache = null;
  try { cache = JSON.parse(await readFile(STATS_CACHE, 'utf8')); } catch { /**/ }
  let adCache = null;
  try { adCache = JSON.parse(await readFile(AD_CACHE_FILE, 'utf8')); } catch { /**/ }

  if (session && session.transcript_path) {
    try {
      const { mtimeMs } = await stat(session.transcript_path);
      if (Date.now() - mtimeMs < ACTIVITY_WINDOW_MS) {
        await touchHeartbeat();
      }
    } catch { /**/ }
  }

  // --- Modèle ---
  const modelId   = session?.model?.id ?? session?.model ?? '';
  const modelDisp = session?.model?.display_name ?? '';
  const model     = shortModel(modelId, modelDisp) || (cache?.modelUsage ? Object.keys(cache.modelUsage).pop()?.replace('claude-','') : 'model?');

  // --- Effort ---
  const effort = session?.thinking_level ?? session?.effortLevel ?? session?.thinking_budget ?? session?.effort_level ?? 'low';

  // --- Contexte ---
  const ctxUsed   = session?.context_window?.total_input_tokens ?? session?.context_window?.used_tokens ?? null;
  const ctxWindow = session?.context_window?.context_window_size ?? session?.context_window?.total_tokens ?? null;

  // --- Quotas ---
  let pct5h = 0;
  let pct7d = 0;
  let reset5hStr = '';
  let reset7dStr = '';

  const rl = session?.rate_limits ?? session?.rateLimits;
  if (rl) {
    const fH = rl.five_hour ?? rl.fiveHour;
    const sD = rl.seven_day ?? rl.sevenDay;
    if (fH) {
      pct5h = fH.used_percentage ?? fH.usedPercentage ?? 0;
      let rTs = fH.resets_at ?? fH.resetsAt ?? 0;
      if (rTs > 0) {
        if (rTs < 10000000000) rTs *= 1000;
        const msLeft = rTs - Date.now();
        if (msLeft > 0) {
          const totM = Math.round(msLeft / 60000);
          reset5hStr = ` (${Math.floor(totM / 60)}h ${totM % 60}m)`;
        }
      }
    }
    if (sD) {
      pct7d = sD.used_percentage ?? sD.usedPercentage ?? 0;
      let rTs = sD.resets_at ?? sD.resetsAt ?? 0;
      if (rTs > 0) {
        if (rTs < 10000000000) rTs *= 1000;
        const msLeft = rTs - Date.now();
        if (msLeft > 0) {
          const totH = Math.round(msLeft / 3600000);
          reset7dStr = ` (${Math.floor(totH / 24)}j ${totH % 24}h)`;
        }
      }
    }
  } else {
    // Utiliser le stats-cache rapide (pas d'IO bloquant ou de parcours de dossier transcripts)
    const tToday = getCacheTokensToday(cache);
    const t7d = getCacheTokens7d(cache);
    pct5h = Math.min(100, (tToday / 40_000_000) * 100);
    pct7d = Math.min(100, (t7d / 400_000_000) * 100);
  }

  // --- Pourcentages RESTANTS ---
  const left5h = Math.max(0, 100 - pct5h);
  const left7d = Math.max(0, 100 - pct7d);

  // ── Rendu ──────────────────────────────────────────────────────────────────
  const sep = DIM(' │ ');
  const modelChunk = `${rgb(130,160,255)}⬡ ${B(model)}${R}`;
  const effortChunk = effortBadge(effort);
  const ctxChunk = (ctxUsed != null) ? `${DIM('ctx:')}${ctxTokens(ctxUsed, ctxWindow)}` : '';

  const col5h = left5h > 40 ? rgb(80,200,120) : left5h > 15 ? rgb(255,200,60) : rgb(255,80,60);
  const col7d = left7d > 40 ? rgb(80,200,120) : left7d > 15 ? rgb(255,200,60) : rgb(255,80,60);

  const tok5hChunk = `${DIM('5h:')}${col5h}${left5h.toFixed(1)}% rest.${reset5hStr}${R}`;
  const tok7dChunk = `${DIM('7d:')}${col7d}${left7d.toFixed(1)}% rest.${reset7dStr}${R}`;
  const dirChunk = `${rgb(100,200,160)}📁 ${session?.workspace?.current_dir ?? session?.cwd ?? process.cwd()}${R}`;

  const parts = [modelChunk, effortChunk];
  if (ctxChunk) parts.push(ctxChunk);
  parts.push(tok5hChunk, tok7dChunk, dirChunk);

  let adString = '';
  if (adCache && Date.now() - adCache.fetchedAt < AD_STALE_MS) {
    adString = renderAd(adCache.ad);
  } else {
    adString = renderPaused();
  }
  parts.push(adString);

  process.stdout.write(parts.join(sep));
}

main().catch(() => {
  process.stdout.write('⬡ claude');
});
