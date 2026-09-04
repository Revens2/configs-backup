# Documentation des skills — inventaire complet

**Généré** : 2026-09-01 · **Source** : `C:\Users\Juliann\configs-backup`, resynchronisé sur la config active du poste.

Une ligne par skill : ce qu'il fait (frontmatter `description`, c'est ce qui décide de son déclenchement), ce qu'il embarque, et sa taille.

## Vue d'ensemble

| Runtime | Skills |
|---|---|
| Claude Code CLI | 49 |
| Antigravity (AGY) | 7 |
| OpenCode | 1 |
| **Total** | **57** |

---

## Claude Code CLI

`C:\Users\Juliann\configs-backup\claude-code-cli\skills` — 49 skills.

| Skill | Description | Annexes | SKILL.md |
|---|---|---|---|
| `agents-manager` | Expert guidance for creating, building, and using Claude Code agents and the Task tool. Use when working with agents, setting up agent configurations, understanding how agents work, or using the Task tool to l… | `agents`, `assets`, `references` | 463 l. |
| `apex` | Run adaptive APEX implementation with scoped delegation, durable checkpoints, risk-based tests and review, and proof-backed verification. Use for features, bug fixes, migrations, or code changes requiring disc… | `agents`, `assets`, `scripts`, `steps` | 125 l. |
| `api-reverse-engineer` | Reverse-engineer APIs from network capture and generate skills. | `references` | 55 l. |
| `app-icon` | Generate a vibrant dimensional iOS and Android app icon for an Expo or React Native app with AI image generation, then post-process it for store specs. Use for creating, regenerating, or polishing an app logo … | `agents`, `assets`, `references` | 142 l. |
| `appstore-connect` | Interact with App Store Connect via the asc CLI - apps, builds, TestFlight, beta testers, reviews, sales/analytics, metadata, IAP, signing, submissions. Use for "check my app", "App Store Connect", "TestFlight… | `agents`, `assets`, `scripts` | 106 l. |
| `audit-gbp` | Audite la fiche Google Business Profile d'un client local (complétude + optimisation on-profile) à partir des données DataForSEO, et produit un livrable priorisé avec score /100 et plan d'action P1/P2/P3. À la… | — | 156 l. |
| `audit-memories` | Manual-only audit and cleanup of agent-facing Markdown inside the current project. Run only from an explicit `$audit-memories` or `/audit-memories` user command; never select it implicitly. | `agents`, `assets`, `references`, `scripts` | 162 l. |
| `audit-site` | Audite le SITE d'un client local (technique/indexation, on-page, couverture services×villes, maillage interne + ancres, Core Web Vitals via DataForSEO Lighthouse, indexation via Search Console si accès). Produ… | — | 180 l. |
| `audit-skills` | Audit installed skills for observed usage, explicit-only invocation controls, duplicate discovery, and global-versus-project scope. Use only when the user explicitly invokes `$audit-skills`. | `agents`, `assets`, `scripts` | 80 l. |
| `auditeur-citations-locales` | À utiliser lorsqu'un utilisateur veut trouver tous les annuaires de citations locales pertinents pour une entreprise précise. Se déclenche sur des demandes comme « trouve les citations pour [entreprise] », « c… | — | 203 l. |
| `auditeur-page-locale` | À utiliser quand un utilisateur veut auditer une page de service ou de zone d'intervention pour le SEO local. Se déclenche sur des demandes comme « audite cette page locale », « cette page est-elle optimisée p… | — | 218 l. |
| `autoresearch` | — | — | 115 l. |
| `caveman` | — | — | 69 l. |
| `ci-verify` | Après un push, vérifie l'état des workflows GitHub Actions — y compris les jobs « skipped », en expliquant pourquoi ils l'ont été — puis confirme que le VPS a bien tiré et déployé la mise à jour. Utiliser sur … | — | 77 l. |
| `claude-chatgpt-bridge` | Use when Claude Code needs to coordinate ChatGPT (e.g. ChatGPT Solo on ia.francestudent.org), Chrome / Web connector, Cloudflare tunnels, verified bridge Restart/Reboot recovery, or task routing between local … | `.git`, `.gitignore`, `agent-setup.md`, `agents`, `CHANGELOG.md`, `chatgpt-app-setup.md`, `docs`, `install.ps1`, `LICENSE`, `package.json`, `progress.md`, `README.md`, `README_zh.md`, `references`, `scripts`, `tests` | 238 l. |
| `config-sync` | Compare la config agentique active (~/.claude, ~/.agents, ~/.config/opencode, ~/.mcp.json) au dépôt configs-backup et aux trois runtimes, et signale ce qui n'est versionné nulle part. Utiliser après toute modi… | `scripts` | 56 l. |
| `content-reviver-local` | >- | — | 259 l. |
| `defuddle` | Extract clean markdown content from web pages using Defuddle CLI, removing clutter and navigation to save tokens. Use instead of WebFetch when the user provides a URL to read or analyze, for online documentati… | — | 42 l. |
| `deleg` | >- | `scripts` | 95 l. |
| `deslop` | Remove AI-generated code slop from the current branch. Use after writing code to clean up unnecessary comments, defensive checks, and inconsistent style. | — | 17 l. |
| `dream` | Reflective pass over Juliann's Claude Code sessions — compares the last week of transcripts against the memory store and proposes memory changes as a numbered list. Use when the user types /dream, /dream apply… | `extract-user-turns.ps1`, `run-nightly.ps1` | 150 l. |
| `environments-manager` | Set up per-worktree environments for Claude Code, Cursor, or Codex. Use for worktree-ready repos, IDE environment config, worktree-up/down scripts, or dev.sh wiring. | `agents`, `assets`, `examples`, `references` | 264 l. |
| `find-skills` | Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. This skill shoul… | — | 134 l. |
| `graphify` | Use for any question about a codebase, its architecture, file relationships, or project content — especially when graphify-out/ exists, where the question should be treated as a graphify query first. Turns any… | — | 618 l. |
| `grill-me` | Grill the user in rapid batches to sharpen a plan, decision, or idea. Use when the user asks for Grill Me, wants a rigorous interview, or uses a grill trigger phrase. | `agents`, `assets` | 32 l. |
| `harness-doctor` | Vérifie l'intégrité du harness agentique : lien CLAUDE.md/AGENTS.md, hooks orphelins, skills prescrits mais absents, progress.md de mission close à la racine du home, résidus .bak et gemini.md, dérive entre la… | `scripts` | 59 l. |
| `hooks-manager` | Create, edit, configure, and debug hooks for Claude Code, Codex, and Cursor. Use for lifecycle events, command validation, routing shared hooks, notifications, automation, or platform-specific hook configurati… | `agents`, `assets`, `references` | 65 l. |
| `impeccable` | Use when the user wants to design, redesign, shape, critique, audit, polish, clarify, distill, harden, optimize, adapt, animate, colorize, extract, or otherwise improve a frontend interface. Covers websites, l… | `reference`, `scripts` | 86 l. |
| `karpathy-guidelines` | Behavioral guidelines to reduce common LLM coding mistakes. Use when writing, reviewing, or refactoring code to avoid overcomplication, make surgical changes, surface assumptions, and define verifiable success… | — | 68 l. |
| `keyword-map` | Construit la CARTE DE MOTS-CLÉS d'un client local — clusters par service×ville, volumes, difficulté, intention, questions/PAA, arbre de fan-out et gaps vs concurrents — via DataForSEO Labs. Document de FONDATI… | — | 143 l. |
| `knip` | Run knip to find and remove unused files, dependencies, and exports. Use for cleaning up dead code and unused dependencies. | — | 146 l. |
| `plan-run` | Exécute un plan de travail long en le lisant depuis `progress.md` plutôt que depuis le contexte. À utiliser dès qu'une tâche dépasse 3 étapes, s'étale sur plusieurs sessions, ou risque une compaction — migrati… | — | 72 l. |
| `reclaude` | Refactor CLAUDE.md files to follow progressive disclosure principles. Use when CLAUDE.md is too long or disorganized. | — | 118 l. |
| `rules-manager` | Create, edit, and maintain AGENTS.md and .agents/rules/ — tech stack, commands, universal rules, rule index, and rule files. Use to add, modify, restructure, or optimize project rules, conventions, and constra… | `agents`, `assets`, `references` | 205 l. |
| `seo-audit` | Audits techniques SEO (sitemap, robots.txt, codes HTTP, canonicals, redirections). | — | 7 l. |
| `seo-expert` | Parapluie de compétences SEO pour audits, maillage, Schema.org, sémantique, métadonnées et Core Web Vitals. | — | 7 l. |
| `seo-internal-linking` | Maillage interne, architecture en silos et distribution du PageRank. | — | 7 l. |
| `seo-metadata` | Optimisation des métadonnées (Title, Meta Description, OpenGraph, Twitter Cards). | — | 7 l. |
| `seo-schema` | Balisage structuré Schema.org et JSON-LD. | — | 7 l. |
| `seo-semantic` | Analyse sémantique, cocon sémantique, intentions de recherche et structuration Hn. | — | 7 l. |
| `seo-web-vitals` | Performance web et Core Web Vitals (LCP, CLS, INP). | — | 7 l. |
| `simplify` | Simplify and refine recently modified code for clarity and consistency. Use after writing code to improve readability without changing functionality. | — | 52 l. |
| `skill-creator` | Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or t… | `LICENSE.txt`, `references`, `scripts` | 357 l. |
| `skill-manager` | Create, edit, audit, or prune Claude, Codex, and Cursor skills/rules. Use for SKILL.md, .cursor/rules, AGENTS.md, prompts, frontmatter, references, scripts, discovery, and predictable skill design. | `agents`, `assets`, `references`, `scripts` | 172 l. |
| `tdd` | Test-driven development with red-green-refactor loop. Use when user wants to build features or fix bugs using TDD, mentions "red-green-refactor", wants integration tests, or asks for test-first development. | `deep-modules.md`, `interface-design.md`, `mocking.md`, `refactoring.md`, `tests.md` | 108 l. |
| `template-skill` | Replace with description of the skill and when Claude should use it. | — | 7 l. |
| `use-style` | Apply named visual style guides to landing pages, app shells, and UI. Use for $use-style, /useskill, list styles, or styles like ios-app, grid, vercel, black-grid, stripe, linear, raycast, gumroad, dusk, or lu… | `agents`, `assets`, `examples`, `styles` | 59 l. |
| `vps-connect` | Se connecter à un VPS par alias SSH et rétablir NetBird quand la connexion échoue. Utiliser sur « connecte-toi à vps-nexus », « ssh vps-etude », ou dès qu'une commande SSH/curl/ping vers une IP 10.200.x échoue… | `references`, `scripts` | 67 l. |
| `workflow` | Workflow orchestration for complex coding tasks. Use for ANY non-trivial task (3+ steps or architectural decisions) to enforce planning, subagent strategy, self-improvement, verification, elegance, and autonom… | — | 64 l. |

## Antigravity (AGY)

`C:\Users\Juliann\configs-backup\antigravity\skills` — 7 skills.

| Skill | Description | Annexes | SKILL.md |
|---|---|---|---|
| `babysit` | >- | — | 15 l. |
| `builtin` | (aucun SKILL.md) | — | 0 l. |
| `impeccable` | Use when the user wants to design, redesign, shape, critique, audit, polish, clarify, distill, harden, optimize, adapt, animate, colorize, extract, or otherwise improve a frontend interface. Covers websites, l… | `reference`, `scripts` | 80 l. |
| `loop` | >- | — | 74 l. |
| `rds` | Marquer la slide Google Slides située 1 slide en dessous du numéro indiqué avec le rectangle vert "JP / Fait / JJ/MM" dans le coin supérieur droit. | `scripts` | 52 l. |
| `review` | Review code changes with the Bugbot or Security Review subagent. | — | 17 l. |
| `shell` | >- | — | 25 l. |

## OpenCode

`C:\Users\Juliann\configs-backup\opencode\skills` — 1 skills.

| Skill | Description | Annexes | SKILL.md |
|---|---|---|---|
| `caveman` | > | — | 57 l. |

---

## Anomalies

Skills sans `description` exploitable en frontmatter. Le harness ne les ignore pas — il retombe
sur le corps du fichier — mais le texte de déclenchement n'est alors **pas écrit par toi**,
et c'est lui qui décide du chargement.

| Skill | État réel | Conséquence |
|---|---|---|
| `Claude Code CLI / caveman` | frontmatter présent, `description: ""` **vide** | Le harness affiche la 1re ligne du corps (« Respond terse like smart caveman… »). Ça marche par accident. |
| `Claude Code CLI / autoresearch` | **aucun frontmatter** (démarre sur `# autoresearch`) | Description résolue à `autoresearch` — le nom répété. Aucun déclencheur utile : le modèle ne peut pas savoir quand le charger. |

Vérifié des deux côtés (`~/.claude/skills` **et** dépôt) : ce n'est pas une dérive de
sauvegarde, les fichiers actifs sont dans le même état. `autoresearch` est le seul skill des
57 sans bloc frontmatter, `caveman` le seul avec une description vide.
