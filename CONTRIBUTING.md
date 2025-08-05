# Guide de contribution au projet ECM Rework

Ce document explique les bonnes pratiques pour contribuer au projet ECM Rework, notamment l'utilisation de GitFlow et les processus de CI/CD.

## Stratégie de branches avec GitFlow

Nous utilisons une version simplifiée de GitFlow avec les branches principales suivantes:

### Branches principales

- `main`: Code de production stable
- `dev`: Branche de développement, intégration continue

### Branches temporaires

- `feature/*`: Pour le développement de nouvelles fonctionnalités
- `bugfix/*`: Pour la correction de bugs
- `hotfix/*`: Pour les corrections urgentes en production
- `release/*`: Pour la préparation des versions de production

## Processus de contribution

### Développement d'une nouvelle fonctionnalité

1. Créer une branche depuis `dev`:
   ```bash
   git checkout dev
   git pull
   git checkout -b feature/nom-de-la-fonctionnalite
   ```

2. Développer et commiter régulièrement:
   ```bash
   git commit -m "Description claire des changements"
   ```

3. Pousser la branche vers le dépôt distant:
   ```bash
   git push -u origin feature/nom-de-la-fonctionnalite
   ```

4. Créer une Pull Request vers `dev`

### Correction d'un bug

1. Créer une branche depuis `dev`:
   ```bash
   git checkout dev
   git pull
   git checkout -b bugfix/description-du-bug
   ```

2. Suivre le même processus que pour une fonctionnalité

### Correction urgente en production (hotfix)

1. Créer une branche depuis `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/description-du-probleme
   ```

2. Corriger le problème et commiter
3. Créer une Pull Request vers `main` ET `dev`

## CI/CD Pipeline

### Tests automatisés

Tous les pushes et les Pull Requests vers `dev` et `main` déclenchent des tests automatisés via GitHub Actions.

### Déploiement

- Push vers `dev`: Déclenche un build Docker et déploie automatiquement sur l'environnement de développement
- Merge vers `main`: Déclenche un build Docker et prépare le déploiement en production

## Bonnes pratiques

### Commits

- Utilisez des messages de commit clairs et descriptifs
- Préfixez vos messages par le type de changement:
  - `feat:` pour les nouvelles fonctionnalités
  - `fix:` pour les corrections de bugs
  - `docs:` pour la documentation
  - `refactor:` pour les refactorisations
  - `test:` pour l'ajout ou la modification de tests

### Pull Requests

- Donnez un titre clair à votre PR
- Décrivez les changements apportés
- Liez la PR aux issues concernées
- Assurez-vous que tous les tests passent
- Demandez une revue de code à au moins un autre développeur

## Workflow Docker

### Construction locale

Pour tester localement:
```bash
docker-compose up --build
```

### Variables d'environnement

- Utilisez le fichier `.env.example` comme modèle
- Ne commitez jamais de fichiers `.env` contenant des secrets

## Résolution des problèmes

Si vous rencontrez des problèmes avec les workflows CI/CD ou Docker, consultez le fichier `TROUBLESHOOTING.md` pour des solutions communes.
