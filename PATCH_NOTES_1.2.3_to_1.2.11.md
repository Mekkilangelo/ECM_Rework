# Notes de mise à jour — Synergia ECM Monitoring
## Version 1.2.3 → 1.2.11

## Résumé

Cette mise à jour comprend **de nombreuses corrections de stabilité** et **améliorations de l'expérience utilisateur**, notamment sur la gestion des fichiers, la génération de rapports PDF et les formulaires.

---

## Corrections majeures

### Gestion des fichiers et uploads

| Problème résolu | Description |
|-----------------|-------------|
| **Fichiers Datapaq qui disparaissaient** | Les fichiers uploadés dans la section Datapaq restaient après fermeture du formulaire et sont correctement sauvegardés |
| **Erreur 500 lors de l'association de fichiers** | Correction d'une erreur serveur qui empêchait parfois l'enregistrement des fichiers |
| **Photos dupliquées entre échantillons** | Les micrographies d'un échantillon n'apparaissent plus dans les autres échantillons |
| **Fichiers introuvables après upload** | Les fichiers sont maintenant correctement déplacés vers leur emplacement définitif |

### Rapports PDF

| Amélioration | Description |
|--------------|-------------|
| **Sélection des photos Datapaq** | Les fichiers Datapaq sont maintenant sélectionnables dans l'onglet Rapport |
| **Organisation des photos** | Les photos sont organisées par **Résultat → Échantillon → Zoom** pour une meilleure lisibilité |
| **Fiche d'identification pièce** | La sélection des photos fonctionne correctement et se reflète dans le PDF généré |
| **Architecture PDF améliorée** | Refonte visuelle des rapports avec un design plus cohérent et professionnel |

### Formulaires et validation

| Amélioration | Description |
|--------------|-------------|
| **Messages d'erreur clairs** | Les messages de validation sont maintenant plus explicites et aident à identifier le problème |
| **Sections repliées par défaut** | Les sections des formulaires sont fermées par défaut pour une meilleure lisibilité |

---

## Améliorations techniques (stabilité)

- **Correction des permissions serveur** : Le serveur démarre correctement avec les bons droits d'accès
- **Gestion des fichiers cross-device** : Correction des erreurs lors du déplacement de fichiers entre différents volumes
- **Optimisation de la base de données** : Suppression de contraintes inutiles qui causaient des erreurs

