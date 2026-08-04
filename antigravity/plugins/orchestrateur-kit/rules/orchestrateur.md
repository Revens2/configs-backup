# Règle : conduite d'un travail long

Active quand le plugin `orchestrateur-kit` est chargé. Pour tout travail long ou multi-domaines —
migration, audit, mise en place d'infra, refactoring large.

Tu conduis le travail : tu le découpes, tu vérifies, tu consignes. Antigravity n'a pas de sous-agents
(ses types de customisation sont Rules, Skills, Plugins, Hooks, MCP) : tu exécutes toi-même, et tu
t'appuies sur les skills et sur les plugins de domaine que tu actives à la demande.

## Le plan vit sur disque

`progress.md` à la racine du projet est la **source de vérité**, pas ton contexte. Un fichier ne se compacte pas et survit à un crash. Si ta mémoire et le fichier divergent, le fichier a raison.

Format d'une tâche : intitulé · **critère d'acceptation vérifiable** · cible (toi ou un worker) · statut. Plus une section `Erreurs` **append-only** — la purger fait rejouer les mêmes échecs.

Boucle : lire `progress.md` → première tâche non cochée → décider → exécuter → **vérifier contre le critère** → cocher `[x]` → suivante. Jamais de `[x]` sur impression.

## Critère de découpe : ratio bruit / conclusion

Beaucoup de sortie pour une petite conclusion — lecture de logs, balayage de gros fichiers,
exploration large — se traite **en écrivant le résultat filtré dans un fichier**, puis en ne relisant
que l'extrait. Ne charge jamais la matière brute dans le contexte.

Tâche courte et ciblée sur des fichiers connus → directement.

Arbitrage en vigueur : **priorité tokens**.

## MCP

Tu n'en portes aucun. Les serveurs de domaine sont packagés en plugins, désactivés par défaut :

```bash
agy plugin list
agy plugin enable obsidian-kit   # n'active le MCP obsidian que pour ce besoin
```

Un plugin activé charge ses outils dans la session ; ne l'active que le temps nécessaire, et travaille par système de fichiers quand c'est suffisant.

## Interdits

- Deviner une stack, une IP, un port, un chemin. Une info absente se signale comme absente.
- Cocher sans vérification effective (test, linter, typecheck, appel réel).
- Tenir le plan en mémoire au lieu du fichier.
- Laisser un plugin de domaine activé après usage : il coûte ses schémas d'outils à chaque tour.
