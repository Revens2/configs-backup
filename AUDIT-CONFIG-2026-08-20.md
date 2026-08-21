# Audit de configuration — 2026-08-20

Périmètre : `claude-code-cli/` (settings, hooks, agents, skills, MCP) confronté aux projets
réellement en cours, relevés dans le vault via le MCP `RAG`.

## 0. Ce que fait l'utilisateur (relevé RAG, pas supposé)

| Projet | Stack | Ce qui coûte cher en contexte |
|---|---|---|
| **NexusTrade / Nexus** (prod `allermarche`, Oracle arm64) | 4 modules : bridge Vite+React+TS, control plane Express+Prisma, front Next.js, `mt5-headless` (C#/MQL5, `NexusNet.dll` MinGW-w64). PostgreSQL 16 + Redis 7, PM2 cluster, runner GH Actions self-hosted | Jest + ts-jest + Supertest, CI/CD, migrations Prisma sur prod |
| **Watchy** (PWA auto-hébergée, suivi média) | React 19, Vite, Tailwind 3, TanStack Query v5, Fastify 5, Prisma 6, PostgreSQL 17, Nginx | Suites de tests, audits AAA/CI, dumps SQL |
| **VPS IA** (`100.99.75.104`) | Qwen 3.6 35B MoE / llama-server 8081, Hermes Gateway FastAPI 8000, LiteLLM 4000, Tool Sanitizer 4002 | Logs d'inférence, benchmarks |
| **Geyma** | Espace de travail agents, Rust (`cargo build --release`), MCP, Ollama | Rapports de build |
| **Vault Obsidian / RAG** | `mcp-obsidian-semantic`, wiki entities/sources | — |

Constante : **TypeScript + Prisma + Postgres + Fastify/Express**, déployé sur VPS, avec des
dépendances jeunes et à API mouvante (React 19, TanStack Query v5, Fastify 5, Prisma 6).
C'est cette constante qui doit piloter les décisions ci-dessous.

---

## 1. Context7 : oui — mais **pas** sur l'agent principal, et **pas** en racine

**Recommandation : l'ajouter, en portée projet, consommé par un sous-agent dédié.**

Le pour, mesuré contre la stack réelle : les quatre bibliothèques centrales de Watchy et de
NexusTrade (React 19, TanStack Query v5, Fastify 5, Prisma 6) sont exactement le segment où
la connaissance d'un modèle est périmée ou inventée — signatures de `useQuery` v5, hooks
Fastify 5, API `prisma migrate` récente. C'est là que Context7 paie, et nulle part ailleurs.

Le contre, et il vient de ta propre doctrine (`CLAUDE.md`, § Confinement MCP) : un serveur
déclaré en racine charge ses schémas dans **tout** contexte, `permissions.deny` n'y change
rien, et `tools:` d'un sous-agent filtre une liste déjà chargée. Context7 est petit en
schéma (2 outils) mais **énorme en sortie** : `get-library-docs` rend des milliers de tokens
de doc brute. Le poser sur l'agent principal, c'est réinjecter dans le fil précisément le
genre de volume que `triage-contexte` et `web-researcher` existent pour absorber.

Donc, concrètement :

1. Déclarer Context7 dans le `.mcp.json` **du projet** (Watchy, NexusTrade), jamais dans
   `~/.mcp.json`.
2. Le faire consommer par un sous-agent (`doc-librarian`, § 3) dont le livrable est un
   extrait cité + version, jamais le dump.
3. Ne pas le mettre sur Geyma (Rust/Ollama) ni sur le VPS IA : peu de gain.

Attention : `settings.local.json` porte `enableAllProjectMcpServers: true`. Tout `.mcp.json`
de projet est donc auto-approuvé — pratique ici, mais c'est une surface d'exécution ouverte
sur n'importe quel dépôt cloné. À arbitrer avec `enabledMcpjsonServers` explicite.

---

## 2. Un sous-agent « de code » : **non**

C'est la seule recommandation négative du rapport, et elle est nette.

Écrire du code est le travail de l'agent principal, et un sous-agent ne rend qu'un rapport
texte : le diff, tu devras le relire de toute façon, donc tu paies deux fois — une fois le
transcript du sous-agent, une fois la relecture. Le gain de contexte n'existe que quand le
livrable est **plus petit que le travail** (un chemin de fichier, une liste d'échecs, un
brief). Ce n'est pas le cas d'une implémentation.

Ta chaîne est déjà correctement bornée : `planificateur` en amont (exploration, `plan.md`),
agent principal au centre (écriture), `github-code-review` en aval (rayon d'impact). Le trou
n'est pas « écrire », il est **entre l'écriture et la revue** : la vérification. Voir § 3.1.

---

## 3. Sous-agents à ajouter, par valeur décroissante

### 3.1 `test-runner` — priorité haute

Le trou réel de la chaîne. Ta règle de Niveau 2 dit « aucune tâche `completed` sans
vérification effective (test, linter, typecheck) » — mais aucun sous-agent ne porte cette
vérification, donc elle se fait dans le contexte principal, où une suite Jest/Vitest qui
échoue vomit des centaines de lignes de stack. RTK compresse la sortie d'une commande ; il
ne fait pas la boucle *lancer → lire l'échec → relancer*.

- Modèle : `claude-sonnet-5` (tâche cadrée, format imposé).
- Outils : `Bash`, `Read`, `Grep`, `Glob`.
- Livrable : liste des échecs uniques (dédoublonnés, `× N`), fichier:ligne, cause probable
  en une phrase — jamais la sortie brute. Statut final vert/rouge explicite.
- Interdits : modifier le code testé, supprimer/skipper un test pour verdir.
- Couvre : Jest + ts-jest + Supertest (NexusTrade-Server), Vitest/Playwright (Watchy),
  `tsc --noEmit`, ESLint, `cargo test` (Geyma).

### 3.2 `doc-librarian` — priorité haute (c'est lui qui porte Context7)

`web-researcher` est explicitement « aucun MCP externe, WebSearch/WebFetch uniquement » —
c'est un bon agent de veille, et il ne faut pas le dénaturer. La doc de dépendance versionnée
est un besoin différent : ciblé, versionné, à faible bruit.

- Modèle : `claude-sonnet-5`.
- Outils : `mcp__context7__resolve-library-id`, `mcp__context7__get-library-docs`,
  `WebFetch`, `Read`.
- Livrable : la réponse à la question d'API, avec **la version** de la lib et le lien, plus
  un bloc « écart avec ce que le modèle croit » quand il y en a un.
- Règle : jamais plus de 40 lignes ; si la doc ne tranche pas, le dire au lieu de combler.

### 3.3 `prisma-migrator` — priorité moyenne-haute

Deux projets sur Prisma + Postgres en production, et une migration ratée sur `allermarche`
coûte une base, pas un rerun. `vps-sysadmin` couvre l'OS, Docker, PM2 — pas le schéma.
Même logique de modèle que `vps-sysadmin` : l'irréversibilité impose opus.

- Modèle : `claude-opus-5`.
- Outils : `Bash`, `Read`, `Write`, `Edit`, `Grep`.
- Workflow imposé : diff de schéma → `migrate diff` en SQL lisible → **dump vérifié avant
  toute application** (tu as déjà la procédure : `watchy_db_*.sql.gz` + restauration testée
  sur base temporaire) → application → vérification.
- Interdits : `migrate reset`, `db push --accept-data-loss`, toute application en prod sans
  accord explicite dans le fil (même posture que `github-code-review` pour `gh pr comment`).

### 3.4 Ce qu'il ne faut **pas** ajouter

- **Agent front / design** : `impeccable` (skill + hooks `PostToolUse`/`Stop`) et
  `browser_agent` activé couvrent déjà le terrain. Un agent de plus serait redondant.
- **Agent sécurité** : redondant avec `/security-review` et surtout avec les outils
  `codegraph_scan_security`, `check_owasp`, `check_cwe`, `find_injections`, `trace_taint` —
  tous déjà autorisés dans `settings.json` et **jamais mentionnés** dans la table de routage
  de `CLAUDE.md`. Gain gratuit : les router, pas créer un agent.
- **Agent MQL5 / C# bridge** : trop rare pour amortir un prompt dédié.

---

## 4. Défauts de configuration relevés

### 4.1 Chemins de plugins sur un profil mort — bloquant

`plugins/installed_plugins.json` pointe sur `C:\Users\julia\.claude\plugins\cache\...` alors
que tout le reste de la config (settings, hooks, MCP, agents) est sur `C:\Users\Juliann\`.
Les deux plugins déclarés (`caveman`, `frontend-design`) ne se résolvent donc probablement
pas depuis leur `installPath`. À corriger ou à réinstaller proprement.

### 4.2 Un agent mort est encore chargeable

`agents/retires-20260804/` contient `anytype-manager.md` — un `.md` valide, dans l'arbo des
agents. Les deux autres sont en `.bak.*` et ne se chargent pas, mais celui-ci si. Or Anytype
est explicitement noté « mort, clé révoquée » dans `CLAUDE.md`. Sortir le dossier `retires-`
de `~/.claude/agents/` (le mettre à côté, ex. `~/.claude/agents-retires/`).

### 4.3 `effortLevel: "low"` contredit `model: "opus"`

Tu paies opus pour un raisonnement que tu brides ensuite au niveau d'effort le plus bas.
Ta propre règle est « opus quand le raisonnement *est* le produit » — or `planificateur` et
`vps-sysadmin` tournent en opus précisément pour ça. `medium` est le réglage cohérent ;
`low` n'a de sens que si la majorité de tes tours sont des exécutions mécaniques, ce que
dément la chaîne brainstorm → plan → exécution.

### 4.4 Le MCP `github` en racine, alors que `gh` fait déjà le travail

`~/.mcp.json` charge `@modelcontextprotocol/server-github` dans **toutes** les sessions —
plusieurs dizaines de schémas d'outils, en permanence. Or `github-code-review`, le seul agent
qui touche aux PR, travaille par `gh pr diff` / `gh pr ...` en `Bash`, donc n'en a pas besoin.
C'est, de loin, le plus gros gain de contexte disponible dans cette config : le descendre en
portée projet, ou le retirer. À mesurer selon ta propre règle
(`cache_creation` + `cache_read` du premier tour, à cache froid).

### 4.5 Les `deny` de lecture sont contournables par `Bash`

`Read(**/.env)`, `Read(**/id_rsa*)` bloquent l'outil `Read` — pas `cat`, `type`, `Get-Content`.
Avec `defaultMode: acceptEdits` et `skipDangerousModePermissionPrompt: true`, une lecture de
secret par le shell ne rencontre aucune barrière. Ajouter les motifs correspondants côté
`Bash(...)` dans `deny` si l'intention est réellement de protéger ces fichiers.

### 4.6 `MEMORY.md` vide

L'index mémoire est déclaré source de vérité n°1 dans le `CLAUDE.md` du répertoire personnel,
et il contient « (No memory files created yet) ». Tant qu'il est vide, toute question
d'infra retombe sur le vault — ce qui marche, mais rend la source n°1 décorative.

---

## 5. Plan d'application suggéré

1. Corriger `installed_plugins.json` et sortir `agents/retires-20260804/`. *(5 min, zéro risque)*
2. Passer `effortLevel` à `medium`. *(1 min)*
3. Mesurer le contexte avec et sans le MCP `github` en racine, à cache froid, puis trancher. *(20 min)*
4. Créer `test-runner`, puis `doc-librarian` + Context7 en `.mcp.json` de Watchy. *(1 h)*
5. Ajouter les deux agents et les outils `codegraph_*_security` à la table de routage de
   `CLAUDE.md` — **et répliquer dans `gemini.md`**, conformément à ta règle de réplication.
6. `prisma-migrator` avant la prochaine migration sur `allermarche`, pas après.

Rappel de ta règle de Niveau 3 : `CLAUDE.md` se finalise **avant** de démarrer une session,
jamais en cours — appliquer l'étape 5 hors session de travail.

---

## 6. Inventaire des sous-agents — utile ou non

Revue des 7 agents existants, plus les 3 proposés. Le critère est unique : **le livrable
est-il plus petit que le travail ?** Un sous-agent ne gagne du contexte que s'il absorbe
plus de volume qu'il n'en rend.

### Existants — à garder

| Agent | Verdict | Pourquoi |
|---|---|---|
| `planificateur` (opus) | **Garder — pièce maîtresse** | Absorbe toute l'exploration de codebase et ne rend que `plan.md` + `progress.md`. Ratio volume/livrable le meilleur de la liste. C'est aussi la charnière entre le brainstorm Gemini et l'exécution : sans lui, le plan se dilue dans le fil. |
| `triage-contexte` (sonnet) | **Garder** | Un dump de 500 Ko contre 30 lignes de signal. La délégation à `agy` au-delà du seuil pousse le ratio encore plus loin — l'agent principal ne paie littéralement rien. |
| `vps-sysadmin` (opus) | **Garder** | Le gain n'est pas le contexte, c'est le **confinement du risque** : UFW, sshd, Docker, PM2 sur trois VPS dont un en prod. Un agent séparé avec un prompt qui porte les règles d'or (ports Docker jamais sur `0.0.0.0`) vaut mieux qu'une règle noyée dans un `CLAUDE.md` de 250 lignes. |
| `obsidian-context-retriever` (sonnet) | **Garder** | Seul point d'entrée du vault, et seul consommateur de `mcp__obsidian-semantic__*`. Rend un brief, jamais un dump. |
| `web-researcher` (sonnet) | **Garder tel quel** | Recherche ouverte, sourcée, sans MCP — c'est une contrainte volontaire et elle est saine. **Ne pas** y greffer Context7 : la veille et la doc de dépendance versionnée sont deux métiers, et les mélanger produit un agent qui fait mal les deux. |
| `github-code-review` (sonnet) | **Garder** | Le rayon d'impact `code-review-graph` est verbeux en JSON et le rapport final tient en 5 sections. Corrigé ce jour : recherche par `Grep`/ripgrep, `Bash` réservé à `git`/`gh`/`code-review-graph`. |

### Existant — à surveiller

| Agent | Verdict | Pourquoi |
|---|---|---|
| `little-tasks` (sonnet) | **Garder, mais c'est le plus fragile** | Le périmètre (conversion de formats, mocks, JSDoc, scaffolding) est étroit et le livrable est un chemin de fichier — excellent sur le papier. Mais il dépend entièrement de `agy` : si `agy` est indisponible ou si Gemini 3.6 Flash rate la consigne, l'agent n'a pas de repli et tu paies un aller-retour pour rien. À réévaluer après quelques usages réels : s'il sert moins d'une fois par semaine, son prompt ne s'amortit pas. |

### Proposés — par valeur

| Agent | Verdict | Pourquoi |
|---|---|---|
| `test-runner` (sonnet) | **Ajouter en premier** | Le seul vrai trou. Ta règle « rien en `completed` sans vérification » n'est portée par aucun agent : la boucle lancer → lire l'échec → relancer se fait donc dans le contexte principal, où une suite Jest ou Vitest qui casse coûte des centaines de lignes. Livrable : échecs dédoublonnés + fichier:ligne. Ratio excellent, usage quotidien sur Watchy et NexusTrade. |
| `doc-librarian` (sonnet) | **Ajouter en second** | Porte Context7 hors du contexte principal. Justifié par la stack, pas par la mode : React 19, TanStack Query v5, Fastify 5, Prisma 6 sont précisément les API que le modèle invente. Livrable : la réponse + la version + le lien, 40 lignes maximum. |
| `prisma-migrator` (opus) | **Ajouter avant la prochaine migration prod** | Même logique que `vps-sysadmin` : ce n'est pas un gain de contexte, c'est une barrière sur de l'irréversible. Deux projets sur Prisma + Postgres, dont un sur `allermarche`. À créer *avant* d'en avoir besoin, pas pendant l'incident. |

### À ne pas créer

| Idée | Pourquoi non |
|---|---|
| Sous-agent **« codeur »** générique | Le livrable (le code) n'est pas plus petit que le travail, et tu reliras le diff de toute façon : tu paies deux fois. L'écriture reste sur l'agent principal, encadrée en amont par `planificateur` et en aval par `github-code-review`. |
| Agent **front / design** | `impeccable` (skill + hooks `PostToolUse` et `Stop`) plus `browser_agent` activé couvrent déjà le terrain. Un agent de plus ne ferait que dupliquer les détecteurs. |
| Agent **sécurité** | Redondant avec `/security-review` et avec les dix outils `codegraph_scan_security`, `check_owasp`, `check_cwe`, `find_injections`, `trace_taint` — **déjà autorisés dans `settings.json` et jamais routés dans `CLAUDE.md`**. Les router coûte trois lignes ; créer un agent coûte un prompt à maintenir. |
| Agent **MQL5 / C# bridge** | Trop rare. Un prompt de sous-agent ne s'amortit qu'à partir d'un usage régulier ; en dessous, il vieillit et devient faux sans qu'on s'en aperçoive. |
| Agent **commit / git** | `git` est déjà trivial pour l'agent principal et RTK compresse la sortie. Rien à absorber. |

**Règle générale qui ressort de l'inventaire.** Un sous-agent se justifie par l'une de deux
raisons, jamais par « ça fait plus propre » : soit il **absorbe du volume** (`triage-contexte`,
`planificateur`, `test-runner`), soit il **confine un risque** (`vps-sysadmin`,
`prisma-migrator`). Un agent qui ne fait ni l'un ni l'autre est un prompt de plus à maintenir
et une source de dérive silencieuse.

---

## 7. Découper les sous-agents par couche (front / back / bdd) ?

**Non — pas sous cette forme.** L'intuition est bonne, la ligne de coupe est mauvaise.

### Pourquoi le découpage par couche casse

**Une fonctionnalité traverse les couches ; un sous-agent, non.** « Ajouter un filtre à la
watchlist » sur Watchy, c'est : `schema.prisma` → migration → route Fastify 5 → hook TanStack
Query v5 → composant React. Trois agents de couche, c'est trois contextes isolés, trois
briefs à écrire, et surtout **le contrat entre les couches n'habite nulle part** : la forme
exacte de la réponse d'API existe dans la tête de l'agent back et dans celle de l'agent
front, jamais dans un fichier. L'agent principal redevient un intégrateur qui re-dérive à la
main ce que les trois viennent de décider séparément. Tu paies trois transcripts pour
reconstruire une cohérence que tu avais gratuitement en restant seul.

**Le livrable n'est pas plus petit que le travail.** C'est le critère du § 6, et un agent
« qui gère tout le back » produit du code : tu reliras le diff. Même raison que le refus du
sous-agent codeur générique au § 2 — le découpage par couche, c'est le sous-agent codeur en
trois exemplaires.

**Un périmètre par couche est un périmètre non borné.** Compare avec `triage-contexte`
(« lis ce fichier, rends le signal ») ou `little-tasks` (4 micro-tâches énumérées) : le
prompt tient parce que la tâche est finie. « Gérer le back » n'a pas de fin, donc le prompt
devient vague, et ton propre `CLAUDE.md` dit ce qu'il faut en penser : *ne pas monter le
modèle d'un agent pour compenser un prompt vague — corriger le prompt*.

### Ce qu'il faut garder de l'idée

Découper par **verbe**, pas par couche. Et en relisant ta demande, deux des trois y sont déjà :

| Ton idée | Traduction en agent qui tient | Statut |
|---|---|---|
| **Front** avec MCP visuels + `impeccable` / `ui-ux-pro-max` | `ui-verifier` — il **constate**, il n'écrit pas : screenshot, DOM, contrastes, anti-patterns, et rend une liste de défauts avec sélecteur + capture. Livrable court, volume absorbé énorme (un DOM ou une capture ne remonte jamais dans le fil principal). Celui-là marche. | **À créer** |
| **BDD** | C'est `prisma-migrator` (§ 3.3), déjà proposé. Il ne « gère pas la bdd », il encadre l'irréversible : diff de schéma, SQL lisible, dump vérifié, application. | **Déjà au plan** |
| **Back** | Rien à isoler qui ne le soit déjà : l'écriture reste sur l'agent principal, la vérification part chez `test-runner` (§ 3.1), l'impact chez `github-code-review`. | **Ne pas créer** |

Autrement dit ton découpage en trois devient : un agent de **constat visuel**, un agent de
**migration**, et pas d'agent back — parce que le back est le seul des trois où il n'y a ni
volume à absorber ni risque à confiner.

### Notes pour `ui-verifier`

- Modèle : `claude-sonnet-5`. Il décrit ce qu'il voit contre une grille ; il n'invente pas
  de design.
- Skills dans le frontmatter : `impeccable` (détecteurs, `detect-antipatterns`, contraste par
  screenshot) — c'est là que se trouve la vraie valeur, pas dans un MCP.
- **`ui-ux-pro-max` est actuellement dans `skills-hors-scope/front-ui/`, donc désactivée.**
  La réactiver pour cet agent, ou renoncer à la citer.
- MCP visuel : `browser_agent` est déjà activé dans `settings.json` (`agents.overrides`) —
  commencer par lui plutôt que d'ajouter un serveur Playwright/Chrome DevTools de plus. Si un
  MCP navigateur s'avère nécessaire, portée **projet**, jamais racine : ces serveurs sont
  parmi les plus gros en nombre d'outils.
- Interdit : modifier le CSS ou les composants. Il constate, l'agent principal corrige —
  sinon on retombe sur l'agent front qui écrit, et sur le problème du § 2.
