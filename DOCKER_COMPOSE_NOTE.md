# Note sur l'utilisation de Docker Compose dans GitHub Actions

## Problème rencontré

L'erreur suivante peut se produire lors de l'exécution des workflows GitHub Actions:

```
Run docker-compose build
/home/runner/work/_temp/ce773bb9-e70a-4f63-8dd3-4423b3365c9a.sh: line 1: docker-compose: command not found
Error: Process completed with exit code 127.
```

## Explication

Cette erreur se produit car les runners GitHub Actions récents utilisent la nouvelle syntaxe `docker compose` (sans tiret) et n'ont plus préinstallé l'ancienne commande `docker-compose`.

## Solution mise en place

Nous avons mis à jour tous les workflows GitHub Actions pour:

1. **Installer explicitement le plugin Docker Compose**:
   ```yaml
   - name: Install Docker Compose
     run: |
       sudo apt-get update
       sudo apt-get install -y docker-compose-plugin
       docker compose version
   ```

2. **Utiliser la nouvelle syntaxe `docker compose` (sans tiret)** dans toutes les commandes.

3. **Mettre à jour toute la documentation** pour utiliser systématiquement cette nouvelle syntaxe.

## Pour les développements futurs

- Toujours utiliser `docker compose` (sans tiret) pour toutes les commandes Docker Compose
- Ne pas revenir à l'ancienne syntaxe `docker-compose` qui est en voie de dépréciation
- Si vous devez travailler sur un système qui ne dispose pas de la nouvelle commande, installez le plugin:
  ```bash
  sudo apt-get update
  sudo apt-get install -y docker-compose-plugin
  ```

## Compatibilité

La nouvelle commande `docker compose` est disponible:
- Sur Docker Desktop (Windows, macOS) depuis la version 3.4.0
- Sur Linux avec Docker Engine 20.10.13+ et le plugin docker-compose-plugin

Si votre système n'a que l'ancienne commande `docker-compose`, le projet fonctionnera toujours, mais nous recommandons de mettre à jour.
