# GitHub Actions Composites - Synergia

Ce dossier contient les actions composites réutilisables pour le projet Synergia.

## 📦 Actions disponibles

### 1. **build-images**
Construit les images Docker frontend et backend avec cache GitHub Actions.

**Usage :**
```yaml
- uses: ./.github/actions/build-images
  with:
    version: '1.0.0'
    frontend-path: './client'  # optionnel
    backend-path: './server'   # optionnel
```

**Outputs :**
- `frontend-image`: Nom complet de l'image frontend
- `backend-image`: Nom complet de l'image backend

**Avantages :**
- ✅ Cache Docker activé (5-10x plus rapide)
- ✅ Build parallélisé
- ✅ Tags automatiques (version + latest)

---

### 2. **export-images**
Exporte les images Docker vers des fichiers TAR pour déploiement hors ligne.

**Usage :**
```yaml
- uses: ./.github/actions/export-images
  with:
    version: '1.0.0'
    output-dir: 'release/images'  # optionnel
    include-mysql: 'true'          # optionnel
    include-nginx: 'true'          # optionnel
```

**Outputs :**
- `frontend-tar`: Chemin vers frontend.tar
- `backend-tar`: Chemin vers backend.tar
- `mysql-tar`: Chemin vers mysql.tar
- `nginx-tar`: Chemin vers nginx.tar

**Avantages :**
- ✅ Bundle complet pour environnement sans internet
- ✅ Validation automatique des exports
- ✅ Rapport de taille détaillé

---

### 3. **generate-env**
Génère un fichier .env depuis les secrets GitHub.

**Usage :**
```yaml
- uses: ./.github/actions/generate-env
  with:
    environment: 'production'
    output-file: 'server/.env'
    mysql-root-password: ${{ secrets.MYSQL_ROOT_PASSWORD }}
    mysql-database: ${{ secrets.MYSQL_DATABASE }}
    db-host: ${{ secrets.DB_HOST }}
    db-user: ${{ secrets.DB_USER }}
    db-password: ${{ secrets.DB_PASSWORD }}
    jwt-secret: ${{ secrets.JWT_SECRET }}
    client-url: ${{ secrets.CLIENT_URL }}
    api-url: ${{ secrets.API_URL }}
```

**Outputs :**
- `env-file`: Chemin vers le fichier .env généré

**Avantages :**
- ✅ Centralise la gestion des variables d'environnement
- ✅ Validation automatique du fichier généré
- ✅ Évite la duplication de code

---

## 🔧 Maintenance

### Modifier une action

1. Éditer le fichier `action.yml` de l'action concernée
2. Tester localement si possible
3. Commit et push
4. Les workflows utiliseront automatiquement la nouvelle version

### Ajouter une nouvelle action

1. Créer un nouveau dossier dans `.github/actions/`
2. Créer un fichier `action.yml` avec la structure suivante :

```yaml
name: 'Action Name'
description: 'Action description'
author: 'Synergia Team'

inputs:
  input-name:
    description: 'Input description'
    required: true

outputs:
  output-name:
    description: 'Output description'
    value: ${{ steps.step-id.outputs.value }}

runs:
  using: 'composite'
  steps:
    - name: Step name
      shell: bash
      run: echo "Hello World"
```

3. Documenter l'action dans ce README
4. Utiliser dans les workflows avec `uses: ./.github/actions/action-name`

---

## 📚 Ressources

- [Documentation GitHub Actions Composites](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)
- [Bonnes pratiques GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Cache Docker dans GitHub Actions](https://docs.docker.com/build/ci/github-actions/cache/)

---

## 🎯 Avantages de cette approche

1. **DRY (Don't Repeat Yourself)** : Code partagé entre workflows
2. **Maintenance simplifiée** : Modification unique pour tous les workflows
3. **Testabilité** : Actions isolées et testables
4. **Performance** : Cache Docker activé par défaut
5. **Lisibilité** : Workflows plus courts et clairs

---

*Dernière mise à jour : $(date)*
