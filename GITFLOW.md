# Guide GitFlow et CI/CD

## Structure des branches

Notre workflow Git utilise une structure simple avec deux branches principales:

- **`main`** : Branche de production, contient le code stable et déployé en production.
- **`dev`** : Branche de développement, intègre les nouvelles fonctionnalités avant leur déploiement en production.

Dans le futur, avec l'agrandissement de l'équipe, nous pourrons ajouter:
- **`feature/*`** : Branches pour le développement de nouvelles fonctionnalités
- **`fix/*`** : Branches pour les corrections de bugs
- **`release/*`** : Branches pour la préparation des versions

## Workflow de développement

1. **Développement**
   - Tout développement se fait à partir de la branche `dev`
   - Pour une nouvelle fonctionnalité : `git checkout -b feature/nom-fonctionnalite dev`
   - Pour un correctif : `git checkout -b fix/nom-correctif dev`

2. **Revue et intégration**
   - Une fois la fonctionnalité ou le correctif terminé, créer une pull request vers `dev`
   - Après revue et validation, la pull request est fusionnée dans `dev`
   - Les tests automatisés sont exécutés sur la branche `dev`

3. **Déploiement en production**
   - Quand `dev` contient un ensemble cohérent de fonctionnalités testées, créer une pull request vers `main`
   - Après approbation, la pull request est fusionnée dans `main`
   - Cette fusion déclenche le pipeline de déploiement en production

## Protection des branches

Configuration des règles de protection sur GitHub:

### Pour la branche `main`:
- Requiert des pull requests avant fusion
- Requiert l'approbation d'au moins 1 reviewer
- Requiert que les status checks passent avant fusion
- Pas de push direct autorisé
- Pas de suppression autorisée

### Pour la branche `dev`:
- Requiert que les status checks passent avant fusion
- Pas de suppression autorisée

## Semantic Versioning

Nous suivons les principes du Semantic Versioning (SemVer) pour les versions de l'application:
- **MAJOR.MINOR.PATCH** (ex: 1.2.3)
- **MAJOR** : changements incompatibles avec les versions précédentes
- **MINOR** : ajout de fonctionnalités rétrocompatibles
- **PATCH** : corrections de bugs rétrocompatibles

## Tags et releases

À chaque déploiement en production, créer un tag Git avec la version:

```bash
git tag -a v1.2.3 -m "Version 1.2.3"
git push origin v1.2.3
```

## CI/CD avec GitHub Actions

Les workflows CI/CD sont configurés dans le dossier `.github/workflows` et comprennent:

1. **build-and-test.yml** : Exécuté sur les push et pull requests vers `dev` et `main`
2. **deploy.yml** : Exécuté uniquement sur les push vers `main`

Voir les fichiers correspondants pour les détails d'implémentation.
