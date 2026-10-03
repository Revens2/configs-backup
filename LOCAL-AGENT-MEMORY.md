# Mémoire & interaction — agents locaux

Portée : **agents locaux uniquement**. Ce fichier contient le mécanisme générique ; les données personnelles restent privées.

## Sources
1. État live / dépôt courant pour les faits techniques actuels.
2. Vault/Obsidian pour la connaissance durable canonique, notamment `System/User-Operating-Contract.md`.
3. `Revens2/agent-memory-private` pour observations/propositions, snapshots de secours, audits et lots de validation.
4. `configs-backup` pour les règles génériques publiques.

Le repo privé n'est ni la source canonique des faits, ni un secret manager.

## Chargement juste-à-temps
Avant de demander à l'utilisateur de répéter une préférence, un objectif, une méthode ou un contexte durable :
- chercher d'abord le contrat utilisateur / contexte projet dans le Vault ;
- si le Vault est indisponible, utiliser le snapshot privé daté s'il existe ;
- ne jamais charger toute la mémoire ou tous les transcripts « au cas où ».

## Auto-feedback
Une correction, préférence, contrainte, objectif ou méthode **explicitement formulée** et utile au futur est capturée automatiquement dans la couche privée avec portée + provenance + date.

Une inférence d'agent reste une **proposition non vérifiée**. Elle n'est jamais promue dans le Vault uniquement parce qu'elle semble plausible ou qu'elle est répétée par plusieurs agents.

## Interaction
Quand une décision humaine change réellement le résultat :
- contrôle de choix natif du runtime si disponible ;
- sinon QCM A/B/C ultra-court, recommandation en premier + « Autre » ;
- maximum 3 questions ;
- une seule action manuelle si intervention réellement indispensable.

## Autonomie
Faire soi-même tout ce que les outils autorisent dans le périmètre. Ne bloquer que pour paiement, authentification/consentement protégé, permission externe, action irréversible ou information introuvable.

Pour une action navigateur sur la machine, utiliser le **vrai Brave** via le skill/MCP browser quand il est disponible et pertinent.

## Secrets
Jamais de clé API, token, mot de passe, cookie, clé privée ou credential en clair dans le Vault, les dépôts, audits, prompts ou logs. Référencer uniquement un identifiant logique vers le broker/secret store autorisé.

## Audit hebdomadaire
Le protocole détaillé vit dans le repo privé : `protocols/WEEKLY-BELIEF-AUDIT.md`.

Un message `go` n'autorise que le lot prêt, identifié et non déjà appliqué. Toute application vérifie les versions/hashes, reste idempotente et produit un reçu.