---
name: rds
description: Marquer la slide Google Slides située 1 slide en dessous du numéro indiqué avec le rectangle vert "JP / Fait / JJ/MM" dans le coin supérieur droit.
---

# Skill : fait rds <numero>

Ce skill s'exécute suite aux commandes `/ fait rds <numero>`, `fait rds <numero>` ou `/rds <numero>`.

## Workflow Complet

### Étape 1 — Générer ou récupérer le badge du jour

1. Exécuter le script de génération de badge :
   ```powershell
   python "C:\Users\Juliann\.gemini\config\skills\rds\scripts\generate_badge.py"
   ```
2. Le script :
   - Crée le dossier `C:\Users\Juliann\Documents\Fait\<JJ-MM-AA>` si absent (ex: `04-08-26`).
   - Génère le badge PNG (`badge_DDMM.png`) avec la date du jour.
   - Si le badge du jour existe déjà, il le réutilise directement (output `EXISTING_BADGE:<path>`).
   - Sinon il le génère (output `GENERATED_BADGE:<path>`).
3. Récupérer le chemin du badge depuis la sortie du script.

### Étape 2 — Identifier la slide cible

1. Trouver la slide correspondant au numéro du point (ex: "POINT 110" sur la slide 3).
2. **La slide cible est 1 slide en dessous** (ex: point 110 sur slide 3 → cible = **slide 4**).

### Étape 3 — Coller le badge sur Google Slides

1. Ouvrir/naviguer sur la slide cible dans Google Slides `[RENAULT] RDS.pptx`.
2. Insérer l'image du badge dans le **coin supérieur droit** de la slide cible.
   - Méthode : Insertion → Image → Importer depuis l'ordinateur, ou copier-coller l'image.
3. Positionner l'image dans le **coin supérieur droit**.

### Étape 4 — Nettoyage

- Si un badge erroné a été placé sur la mauvaise slide, le supprimer.

## Résumé des Règles

| Règle | Valeur |
|-------|--------|
| Dossier de stockage | `C:\Users\Juliann\Documents\Fait\<JJ-MM-AA>` |
| Fichier badge | `badge_DDMM.png` |
| Slide cible | 1 slide **en dessous** du numéro du point |
| Position sur la slide | **Coin supérieur droit** |
| Format du texte | JP / Fait / JJ/MM (sur 3 lignes) |
| Couleur fond | Vert clair `#9ebf74` |
| Cache | Si le dossier du jour existe, réutiliser le badge |
