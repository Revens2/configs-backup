# Triage des skills utilisateur — préparation de la Phase 2.3

État au 2026-08-04, **avant modification**. 63 skills dans `~/.claude/skills/`, dont 62 avec
frontmatter valide. Coût mesuré : **6 057 tokens** de listing à chaque démarrage (`name` +
`description` de chaque skill), soit 12 % du contexte de démarrage du CLI.

Objectif de la phase : < 20 skills au niveau utilisateur.
Proposition ci-dessous : **15 conservés (906 tok)**, 47 redescendus en projet (**5 151 tok rendus, −85 %**).

Le coût listé est celui du *listing* (frontmatter). Le corps du `SKILL.md` n'est chargé qu'à
l'invocation — déplacer un skill ne le rend pas moins disponible dans son projet, il cesse
seulement d'être annoncé partout.

---

## À conserver au niveau utilisateur (15 — 906 tok)

Critère : invocable depuis n'importe quel répertoire, ou imposé par `~/.claude/CLAUDE.md`.

| Skill | tok | Justification |
|---|---:|---|
| `caveman` | 106 | mode de communication, transverse |
| `vps-connect` | 98 | imposé par `CLAUDE.md` (reprise Tailscale) |
| `graphify` | 92 | imposé par `CLAUDE.md` (navigation de code) |
| `workflow` | 92 | orchestration, transverse |
| `defuddle` | 90 | imposé par `CLAUDE.md` (lecture d'URL) |
| `find-skills` | 80 | méta — sert à retrouver ce qu'on a descendu en projet |
| `skill-creator` | 61 | méta |
| `karpathy-guidelines` | 61 | discipline d'écriture de code, transverse |
| `tdd` | 54 | transverse |
| `deslop` | 41 | transverse |
| `simplify` | 41 | transverse |
| `knip` | 33 | transverse |
| `reclaude` | 33 | méta |
| `template-skill` | 22 | méta |
| `autoresearch` | 2 | coût nul, aucun intérêt à déplacer |

---

## À redescendre en projet (47 — 5 151 tok)

### Métier comptable / juridique — 1 063 tok
`fiscaliste` 265 · `notaire` 227 · `syndic` 171 · `comptable` 137 · `commissaire-aux-comptes` 132 ·
`controleur-fiscal` 131

Le groupe le plus coûteux du lot, et le moins souvent utile. **Destination : un unique projet métier**
(ex. `~/Documents/cabinet/.claude/skills/`).

### Outillage dev & agents — 1 265 tok
`agent-reach` 240 · `claude-api` 190 · `agent-browser` 127 · `electron-wrapper` 116 ·
`fix-sentry-issues` 83 · `chrome-webstore-release-blueprint` 80 · `mcp-builder` 74 ·
`notebooklm` 70 · `notebooklm-py` 70 · `grill-me` 61 · `webapp-testing` 56 · `react-doctor` 42 ·
`bun` 32 · `sentry` 24

`notebooklm` / `notebooklm-py` font doublon avec le worker `web-researcher` qui porte déjà les MCP
NotebookLM — à fusionner plutôt qu'à déplacer.

### Front / UI — 935 tok
`ui-ux-pro-max` 234 · `make-interfaces-feel-better` 122 · `shadcn` 99 · `algorithmic-art` 86 ·
`web-artifacts-builder` 79 · `canvas-design` 77 · `theme-factory` 70 · `frontend-design` 64 ·
`video-to-website` 38 · `favicon` 33 · `rams` 33

`frontend-design` existe **aussi en plugin** → supprimer la copie utilisateur, pas la déplacer.

### Bureautique / documents — 925 tok
`xlsx` 239 · `docx` 199 · `pptx` 176 · `doc-coauthoring` 112 · `pdf` 112 · `internal-comms` 87

### Charte CKM — 643 tok
`ckm-design` 158 · `ckm-banner-design` 130 · `ckm-ui-styling` 127 · `ckm-design-system` 75 ·
`brand-guidelines` 64 · `ckm-brand` 50 · `ckm-slides` 39

Groupe monolithique dédié à un client/marque : **descendre en bloc** dans le projet CKM.

### Obsidian — 321 tok
`obsidian-cli` 121 · `obsidian-markdown` 71 · `obsidian-bases` 69 · `json-canvas` 60

Destination naturelle : le projet du vault, aux côtés du worker `obsidian-context-retriever`.

---

## Doublons constatés

| Skill | Copie utilisateur | Copie plugin | Action |
|---|---|---|---|
| `caveman` | oui | oui | supprimer la copie utilisateur (−106 tok) |
| `skill-creator` | oui | oui | supprimer la copie utilisateur (−61 tok) |
| `frontend-design` | oui | oui | supprimer la copie utilisateur (−64 tok) |

Les 42 skills fournis par des plugins s'ajoutent aux 63 utilisateur et **ne sont pas comptés** dans les
6 057 tok ci-dessus. Le coût réel du listing est donc supérieur à la mesure. Levier complémentaire
repéré dans le schéma des settings : `disableBundledSkills` et `skillOverrides`.

**Écart CLI / Desktop à connaître :** côté Desktop, un plugin `anthropic-skills` fournit en plus
`docx`, `pdf`, `pptx`, `xlsx`, `caveman`, `skill-creator` — les mêmes noms que des skills utilisateur,
donc **chargés deux fois**. Ce plugin est absent de `~/.claude/plugins/` (côté CLI). Vérifier avant de
supprimer quoi que ce soit : un skill supprimé côté utilisateur reste disponible sur Desktop mais
disparaît du CLI.

---

## Ordre d'exécution proposé (quand la Phase 1 sera dégelée)

1. Supprimer les 3 doublons — gain immédiat 231 tok, risque nul.
2. Descendre les blocs monolithiques : CKM (643), métier (1 063), Obsidian (321) — 2 027 tok,
   aucun arbitrage nécessaire, ces skills n'ont de sens que dans leur projet.
3. Bureautique (925) et Front (935) — nécessitent de choisir les projets de destination.
4. Outillage dev (1 265) — le plus dispersé, à traiter en dernier ; fusionner d'abord
   `notebooklm` / `notebooklm-py` dans `web-researcher`.
5. Re-mesurer et écrire le delta dans `MESURE-AVANT.md` → Phase 7.
