# 📋 Guide du Système de Logging ECM Synergia

## Vue d'ensemble

Ce système permet de contrôler précisément le niveau de verbosité des logs du serveur pour faciliter le débogage sans être submergé par les messages.

## Niveaux de Logs

- **0 - ERROR** : Erreurs critiques seulement
- **1 - WARN** : Erreurs + Avertissements
- **2 - INFO** : Erreurs + Avertissements + Informations importantes
- **3 - DEBUG** : Tout ce qui précède + Messages de débogage
- **4 - TRACE** : Tous les messages possibles (très verbeux)

## Configuration Rapide

### Pour réduire drastiquement les logs (recommandé pour la production)
```bash
# Dans votre fichier .env
LOG_LEVEL=0
LOG_ROUTES_LEVEL=0
LOG_CONTROLLERS_LEVEL=0
LOG_MIDDLEWARE_LEVEL=0
```

### Pour un débogage normal
```bash
LOG_LEVEL=2
LOG_ROUTES_LEVEL=1
LOG_CONTROLLERS_LEVEL=1
LOG_FILE_SERVICE_LEVEL=2
```

### Pour un débogage intensif
```bash
LOG_LEVEL=4
```

## Utilisation dans le Code

```javascript
const { createLogger } = require('../config/logging');
const logger = createLogger('monModule');

// Dans vos contrôleurs/services
logger.error('Erreur critique', { error: err });
logger.warn('Avertissement', { userId: 123 });
logger.info('Information importante', { action: 'login' });
logger.debug('Info de débogage', { query: 'SELECT...' });
logger.trace('Trace détaillée', { data: fullObject });

// Vérifier si un niveau est activé avant de calculer des données coûteuses
if (logger.isLevelEnabled('DEBUG')) {
  logger.debug('Données complexes', computeExpensiveDebugData());
}
```

## Modules Configurables

- `routes` - Logs des routes Express
- `controllers` - Logs des contrôleurs
- `middleware` - Logs des middleware
- `authentication` - Logs d'authentification
- `database` - Logs de base de données
- `queries` - Logs des requêtes SQL
- `fileService` - Logs du service de fichiers
- `reportService` - Logs du service de rapports
- `security` - Logs de sécurité
- `performance` - Logs de performance

## Exemples de Configuration

### Configuration Production (minimal)
```bash
LOG_LEVEL=0
LOG_SECURITY_LEVEL=1
LOG_DB_LEVEL=0
```

### Configuration Développement (équilibré)
```bash
LOG_LEVEL=2
LOG_CONTROLLERS_LEVEL=2
LOG_FILE_SERVICE_LEVEL=2
LOG_REPORT_SERVICE_LEVEL=3
```

### Configuration Debug Intensif (temporaire)
```bash
LOG_LEVEL=4
LOG_REPORT_SERVICE_LEVEL=4
```

## Migration du Code Existant

Remplacez progressivement vos `console.log()` par :

```javascript
// Ancien code
console.log('Fichier téléchargé:', filename);
console.error('Erreur DB:', error);

// Nouveau code
const logger = createLogger('fileService');
logger.info('Fichier téléchargé', { filename });
logger.error('Erreur DB', { error });
```

## Avantages

✅ **Contrôle granulaire** par module  
✅ **Performance** - pas de calculs inutiles si le niveau est désactivé  
✅ **Lisibilité** - messages formatés avec timestamps et couleurs  
✅ **Flexible** - configuration via variables d'environnement  
✅ **Production-ready** - facile de désactiver tous les logs non-critiques  

## Recommandations

1. **Production** : Utilisez `LOG_LEVEL=0` ou `LOG_LEVEL=1` maximum
2. **Développement** : Utilisez `LOG_LEVEL=2` par défaut
3. **Débogage** : Montez temporairement à `LOG_LEVEL=3` ou `LOG_LEVEL=4`
4. **Performance** : Utilisez `isLevelEnabled()` pour les calculs coûteux

Ce système vous permettra de déboguer efficacement sans être submergé par les logs !