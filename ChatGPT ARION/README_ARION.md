# ARION — description projet (ChatGPT, 2026-10-02)

Source : https://chatgpt.com/g/g-p-6aa064ced1308191bf245a487ec9e7c9-arion/project
ID projet : `g-p-6aa064ced1308191bf245a487ec9e7c9`

## Vision
Assistant de réalité mixte (Meta Quest) : observation du réel, interaction vocale,
compréhension objets/pièces/documents, reconstruction spatiale, localisation/suivi,
overlays et guidage étape par étape, vérification de l'état du monde quand possible.
Runtimes : Codex + GPT-6 Astra (science terminal, simulations, fitting, computer use),
Claude Code + Opus (architecture, diagnostic, géométrie), OpenCode + Muse Spark (tâches bornées).
Cible initiale : prototype personnel. Dépôt canonique : `Revens2/ARION`.

## Config versionnée ici (refonte JIT 2026-10-03)

- `00-instructions-projet.md` : loader orchestrateur (~2k car., < 8000).
  Ne duplique pas la gouvernance : pointe vers `ARION-RULES.md`, le canonique
  et le repo live.
- `ARION-RULES.md` : delta ARION (~6k car., < 8000) — vision, routage, Opus,
  invariants scientifiques, gels/holdouts, APK, Git/secrets. Remplace
  `Prompt-global-canonique.md` (archivé sous `archive/`).
- `Model-prompt-astra-6-extrait.md` : comportement cible Astra **JIT uniquement
  si cible Astra** (~2.5k car. assaini) — jamais en bootstrap. Ancienne version
  contenait un collage d'état web avec identifiants privés : supprimé du HEAD
  (historique Git à traiter par le propriétaire).
- `archive/` : `Prompt-global-canonique-20260918.md` + note de migration.

## Chats du projet (15 vus le 2026-10-02)
- Branche · État vérifié Geometry 3 (2 oct.) — carte mère inutile ?
- État vérifié Geometry 3 (29 sept.) — réglage PPP
- Branche · État vérifié Geometry 3 (28 sept.) — point de référence distance
- Bootstrap et audit FACE_PLANE (24 sept. x2) — handoff + état Git vs GitHub 3b09b46
- Audit du projet / avancement (23 sept. x2)
- Bootstrap et audit FACE_PLANE (21/20 sept.) — arbre repo, audit Astra
- Mission RGB-D terminée (18/17/10/9/8 sept.) — produit_rgbd_v1 (31 fichiers),
  prompt vierge de vérification, doc Astra
- Créer README projet (18 sept.)
- Compactage du prompt ARION (hors projet, récents)

## État local constaté
- `C:\Users\Juliann\Desktop\ARION` absent du disque (seule trace : entrée Codex
  `~/.codex/config.toml` + transcripts `.claude/projects/...ARION/`).
- Mémoire projet ↔ chats externes : activée. Accès bibliothèque : activé (privé).