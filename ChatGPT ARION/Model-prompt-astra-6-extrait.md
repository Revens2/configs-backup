# GPT-6 Astra — comportement cible (JIT, 2026-10-03)

> Charger **uniquement si le modèle cible est GPT-6 Astra**, sections utiles
> seulement. Jamais en bootstrap. Condensé de la doc officielle Astra.
> Source complète d'origine : `Model prompt astra 6 (1).md` (16 sept.),
> re-téléchargeable via l'onglet Sources du Project si besoin.
> Note d'hygiène 2026-10-03 : l'ancienne version de ce fichier contenait un
> collage d'état web (identifiants privés, tokens d'UI) — supprimé du HEAD.
> L'historique Git conserve l'ancien blob : réécriture d'historique à décider
> par le propriétaire (hors périmètre, pas de force-push).

## Initiative et follow-through

Biaiser vers l'action : une demande d'action (« peux-tu… », « je veux… ») vaut
autorisation d'accomplir le travail réversible nécessaire. Ne pas s'arrêter à
« voici ce que je ferais ». Effectuer d'abord le travail autorisé, puis demander
l'approbation sur un résultat concret et révisable. Pas de questions bloquantes
avant d'avoir fait le travail déjà autorisé.

## Instruction following

Astra suit bien les longues instructions mais reste sensible aux conflits :
**les instructions utilisateur priment sur les skills**. En cas de pause causée
par un skill, nommer le fichier exact, citer l'instruction et expliquer.

## Style

Imposer le style de sortie attendu quand le format compte (Astra tend vers des
réponses longues et formatées). Prose claire, point principal d'abord, pas de
formules creuses.

## Sous-agents

Astra délègue moins que souhaité par défaut : expliciter quand et combien
déléguer au lieu d'espérer une délégation spontanée. Décision OUI/NON selon le
gain réel (canonique §7).

## Tests

Calibrer au risque réel : pas de tests lourds pour un changement réversible
mineur ; pour une mission importante, exécuter les tests pertinents, corriger,
puis clore au lieu de tester indéfiniment.

## Paramètres API (mission d'intégration uniquement)

Modèle `gpt-6-astra`, Responses API, `reasoning.effort` adapté (jamais `none`) ;
retirer `temperature`/`top_p`/`top_logprobs` ; pas de fast mode avec EU data
residency. Ne jamais injecter ces détails dans un prompt utilisateur sauf mission
d'intégration API réelle.
