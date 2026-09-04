---
name: ci-verify
description: "Après un push, vérifie l'état des workflows GitHub Actions — y compris les jobs « skipped », en expliquant pourquoi ils l'ont été — puis confirme que le VPS a bien tiré et déployé la mise à jour. Utiliser sur « est-ce que la CI est passée », « pourquoi ce job a été skip », « le VPS a bien récupéré la MAJ ? », ou après tout push sur un dépôt déployé."
---

# ci-verify — état de la CI **et** état du déploiement, en une passe

## Pourquoi ce skill

La question posée est presque toujours double : « la CI passe ? » **et** « le VPS a bien
récupéré ? ». Y répondre à moitié force un aller-retour. Ce skill impose de répondre aux deux.

Un `skipped` n'est pas un échec, mais ce n'est pas non plus un succès : il faut dire **pourquoi**
le job a été sauté, et si c'était voulu.

## Procédure

### 1. Contexte
```bash
gh repo view --json nameWithOwner,defaultBranchRef -q '.nameWithOwner + " @ " + .defaultBranchRef.name'
git log -1 --format='%h %s'
```

### 2. État des runs
```bash
gh run list --limit 5
```
Pour le run qui nous intéresse — **toujours descendre au niveau job**, la conclusion globale
masque les `skipped` :
```bash
gh run view <id> --json status,conclusion,headSha,workflowName,jobs \
  -q '.workflowName + " " + .status + "/" + (.conclusion//"—"), (.jobs[] | "  " + .name + " : " + (.conclusion//"en cours"))'
```

### 3. Expliquer chaque `skipped`
Ne jamais se contenter de « c'est normal ». Ouvrir le workflow et citer la clause responsable :
```bash
gh workflow view <nom> --yaml | grep -n -B2 -A6 'paths:\|paths-ignore:\|^\s*if:\|needs:'
```
Causes, par ordre de fréquence :

| Cause | Signature dans le YAML | Voulu ? |
|---|---|---|
| Filtre de chemins | `on.push.paths` / `paths-ignore` | Oui — le commit ne touche pas les chemins surveillés |
| Condition `if:` non remplie | `if: github.ref == ...` | Oui, si la branche/l'événement ne correspond pas |
| Dépendance échouée ou sautée | `needs: <job>` | **Non** — un `needs` sauté en cascade masque un vrai échec en amont |
| Concurrence | `concurrency.cancel-in-progress` | Oui, un run plus récent l'a annulé |

Un job sauté par `needs:` mérite une alerte, pas un « c'est normal ».

### 4. Vérifier le déploiement côté serveur
Le modèle est un **déploiement pull** : le VPS tire ses images lui-même, il n'y a plus d'accès
GitHub → VPS. Vérifier ne consiste donc pas à regarder la CI, mais l'état réel de la machine.

Déléguer au sous-agent **`vps-sysadmin`** (et passer par le skill `vps-connect` si la connexion
échoue). Ce qu'il doit rapporter :
```bash
docker compose ps                                  # conteneurs up, et depuis quand
docker image inspect <image> --format '{{.Created}}' # date de l'image réellement en place
systemctl is-active <service> && journalctl -u <service> --since '30 min ago' -n 30 --no-pager
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:<port>/health
```
La preuve attendue est **la date de l'image ou le uptime du conteneur**, pas un « ça a l'air
bon ». Un conteneur up depuis 6 jours n'a pas reçu le push d'il y a 10 minutes.

### 5. Répondre
Trois lignes, dans cet ordre : état CI par job (avec l'explication de chaque `skipped`) · état
réel du VPS (avec la date de l'image) · verdict. Si la MAJ n'est pas arrivée, dire à quelle
étape la chaîne s'est arrêtée.

## Interdits

- **Ne jamais relancer un workflow** (`gh run rerun`) sans accord explicite : ça peut redéployer.
- Ne pas conclure « déployé » sur la seule foi d'une CI verte. Le pull est asynchrone : vert en CI
  et pas encore tiré est un état normal, qu'il faut nommer plutôt que masquer.
- Ne pas boucler sur une connexion VPS qui échoue — maximum 2 tentatives (cf. `vps-connect`).
