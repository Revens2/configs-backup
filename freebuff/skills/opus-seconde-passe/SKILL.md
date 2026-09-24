---
name: opus-seconde-passe
description: >
  Seconde passe de réflexion pour toute tâche complexe (audit, architecture, diagnostic,
  décision multicritère, migration, revue). Critique l'analyse de passe 1, détecte les angles
  morts, regroupe par causes, hiérarchise risques et actions. Utiliser systématiquement avant
  toute décision/stratégie non triviale. Jamais pour trivial/déterministe.
---

# opus-seconde-passe — Seconde passe de réflexion (Freebuff)

> Freebuff ne parle pas MCP : pas d'appel `opus_think` possible. Ce skill applique la MÊME
> discipline en auto-critique explicite et structurée. Marquer `source: auto-critique`.

## Quand l'utiliser (systématique, sans confirmation)

Audit, architecture, diagnostic, comparaison, décision multicritère, recherche approfondie,
plan de migration, revue d'un travail produit. Jamais pour trivial/déterministe.

## Protocole

### Passe 1 — déjà faite avant l'appel (jamais par ce skill)
L'agent a exploré et vérifié lui-même : preuves, métriques, contradictions, anomalies,
détails techniques, signaux faibles.

### Passe 2 — auto-critique structurée (ce skill)
Contexte d'entrée = faits vérifiés + contraintes + incertitudes + résultats d'outils +
points précis à critiquer. Rien d'inutile. Produire :

1. Angles morts (ce que la passe 1 a manqué)
2. Regroupement par causes (symptômes → causes racines)
3. Risques hiérarchisés (critique > majeur > mineur, preuve chacun)
4. Actions priorisées (quick wins → structurel)
5. Synthèse améliorée (5-10 lignes)

## Fusion (obligatoire, par l'agent appelant)

Ne supprime JAMAIS un constat technique, une anomalie ou un signal faible utile parce que
la passe 2 ne l'a pas repris. En désaccord : les preuves priment, incertitude explicitée.
