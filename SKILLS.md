# Skills — index léger

Ce fichier n'est **pas** un inventaire figé des skills installés. Les descriptions, compteurs et tailles vieillissent dès qu'un runtime change et créent une seconde source de vérité inutile.

## Source de vérité

Pour connaître les skills réellement versionnés, inspecter le répertoire du runtime concerné :

- Claude Code : `claude-code-cli/skills/`
- Antigravity / AGY : `antigravity/skills/` et les `skills/` embarqués dans ses plugins
- OpenCode : `opencode/skills/`
- Freebuff : `freebuff/global-skills/`
- Codex : `codex/` et ses agents/règles propres

Lire le `SKILL.md` exact uniquement quand son comportement ou son déclenchement est pertinent pour la mission. Ne jamais charger tous les skills dans le contexte « au cas où ».

## Règle d'architecture

Les fichiers globaux (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `PROMPT-BRAINSTORMING.md`) doivent connaître **les catégories de capacités et les règles de routage**, pas recopier le contenu des skills.

Un skill de placeholder, une ancienne copie `.bak`, un rapport d'audit ponctuel ou un catalogue généré ne doit pas rester dans la gouvernance active. Git conserve déjà l'historique.

Pour auditer ou régénérer un inventaire ponctuel, utiliser le skill/outillage d'audit approprié puis traiter le rapport comme un artefact temporaire, pas comme une source canonique.