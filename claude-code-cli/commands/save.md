Tu es un assistant de session. Tu viens de recevoir la commande /save.
Ta tâche est d'analyser toute la session actuelle, de rédiger un rapport de fin de session structuré et de l'enregistrer.

1. **Extraction de l'historique** : Analyse l'historique de la conversation de cette session de travail.
2. **Date du jour** : Détermine la date du jour au format YYYY-MM-DD (tu peux exécuter la commande PowerShell `Get-Date -Format "yyyy-MM-dd"` si tu n'es pas sûr de la date actuelle).
3. **Titre synthétique** : Détermine un titre très synthétique décrivant le travail effectué (5 à 6 mots maximum, pas plus).
4. **Nom du fichier** : Formate le nom du fichier comme ceci : `YYYY-MM-DD-[Titre_Synthetique_Avec_Tirets_Bas].md` (ex: `2026-07-12-Developpement_Script_Python_Automatisation.md`). Évite les caractères spéciaux non autorisés dans les noms de fichiers Windows.
5. **Rapport Markdown** : Rédige le rapport en respectant scrupuleusement la structure ci-dessous. Tu devez remplacer les sections entre crochets par le contenu réel extrait de cette session. Inclure TOUS les codes complets, scripts, commandes et architectures développés.

Structure stricte du Markdown :
```markdown
# Rapport de Fin de Session : [Titre Synthétique]

## 1. But et Objectif
[Expliquer clairement le but initial de la session de travail]

## 2. Réalisations Effectuées
[Résumé exhaustif et technique de ce qui a été produit. Inclure TOUS les codes, scripts, commandes et architectures développés durant la session]

## 3. Recherches et Documentation
[Synthèse des recherches effectuées sur le sujet, documentations consultées ou théories appliquées]

## 4. Rapport de Résolution
### A. Difficultés et Obstacles Rencontrés
[Liste précise des erreurs, bugs, blocages ou comportements inattendus]
### B. Stratégies et Solutions Appliquées
[Explications claires des corrections apportées et pourquoi elles ont fonctionné]
```

6. **Enregistrement physique** : Enregistre ce rapport au format Markdown (.md) à l'emplacement exact suivant sous Windows : `G:\Mon Drive\Obsidian Vault\raw\assets\<Nom_Du_Fichier>`.
   - Utilise tes outils d'écriture de fichiers (`write_file`, `write_to_file` ou équivalent) pour créer et écrire dans ce fichier.
   - Si tes outils d'écriture de fichiers échouent ou sont restreints pour écrire hors du projet, exécute une commande PowerShell pour écrire le contenu dans le fichier, par exemple :
     `[System.IO.File]::WriteAllText("G:\Mon Drive\Obsidian Vault\raw\assets\<Nom_Du_Fichier>", @"<Contenu_Du_Rapport>"@)`
     (assure-toi d'échapper correctement les caractères spéciaux s'il y en a).
7. **Confirmation** : Confirme à l'utilisateur que le fichier a bien été écrit avec succès en affichant son chemin d'accès absolu et son nom final.
