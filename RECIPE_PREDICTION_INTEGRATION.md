# Intégration de l'API de Prédiction de Recette

## Vue d'ensemble

Cette intégration ajoute une fonctionnalité de prédiction automatique des recettes de carburation basée sur un modèle XGBoost et un simulateur physique CBPWin.

## Architecture

```
┌──────────────────┐
│  Frontend React  │
│  ChemicalCycle   │ ──┐
│  Section         │   │
└──────────────────┘   │
                       │ POST /api/recipe/predict
                       ▼
           ┌────────────────────────┐
           │  Node.js Backend       │
           │  (Proxy/Auth)          │
           └───────────┬────────────┘
                       │ POST http://localhost:8000/predict
                       ▼
           ┌────────────────────────┐
           │  Python FastAPI        │
           │  (ML Model + CBPWin)   │
           └────────────────────────┘
```

## Fichiers Modifiés/Créés

### Nouveaux Fichiers

1. **`client/src/services/predictionService.js`**
   - Service frontend pour gérer la validation des paramètres et mapper les résultats
   - Fonctions principales :
     - `validateAndPrepareParams()` : Valide et prépare les 9 paramètres requis
     - `predictRecipe()` : Appelle l'API backend
     - `mapToChemicalCycles()` : Transforme les résultats en format de l'app

2. **`server/routes/recipe.js`**
   - Route proxy Node.js vers l'API Python
   - Endpoint : `POST /api/recipe/predict`
   - Gère l'authentification JWT et les erreurs de connexion

3. **`RECIPE_PREDICTION_INTEGRATION.md`** (ce fichier)
   - Documentation complète de l'intégration

### Fichiers Modifiés

1. **`server/startup/routes.js`**
   - Ajout de la route `/api/recipe`

2. **`client/src/components/.../ChemicalCycleSection.jsx`**
   - Ajout du bouton "Prédire la recette"
   - Logique de prédiction et gestion d'erreurs
   - Alertes de succès/erreur

3. **`client/src/components/.../RecipeDataSection.jsx`**
   - Passage de la prop `trial` à ChemicalCycleSection

4. **`server/.env`**
   - Ajout de `PYTHON_API_URL=http://localhost:8000`

## Configuration Requise

### 1. API Python

L'API Python de prédiction doit être démarrée sur le port 8000 (par défaut).

```bash
cd api
uv run uvicorn api.main:app --port 8000
```

### 2. Variable d'Environnement

Dans `server/.env` :
```env
PYTHON_API_URL=http://localhost:8000
```

### 3. Dépendances Backend

Aucune nouvelle dépendance. L'intégration utilise `axios` (déjà installé).

## Paramètres de Prédiction

L'API nécessite 9 paramètres qui sont automatiquement collectés depuis les données existantes :

| Paramètre | Source | Description |
|-----------|--------|-------------|
| `hardness_value` | `specs_ecd.hardness` | Dureté visée (HV) depuis les specs ECD de la pièce parente |
| `target_depth` | `(specs_ecd.depthMin + depthMax) / 2` | Profondeur cible (médiane) |
| `load_weight` | `trial.load_weight_value` | Poids de la charge (kg) |
| `weight` | `part.dim_weight_value` | Poids de la pièce (kg) |
| `is_weight_unknown` | Calculé | 0 ou 1 selon disponibilité du poids |
| `recipe_temperature` | Fixe | 950°C (pour l'instant) |
| `recipe_carbon_max` | Fixe | 1.7 (à 950°C) |
| `recipe_carbon_flow` | Fixe | 14.7 (à 950°C) |
| `carbon_percentage` | `steel.composition.C` | % de carbone initial de l'acier |

## Utilisation

### Depuis l'Interface

1. Ouvrir un essai (trial) dans le formulaire
2. Aller dans l'onglet "Before" > Section "Cycle Chimique"
3. Cliquer sur le bouton **"Prédire la recette"**
4. La recette est automatiquement générée avec :
   - Les cycles de cémentation/diffusion
   - Les gaz pré-sélectionnés (C2H2 pour cémentation, N2 pour diffusion)
   - Le temps d'attente final (waitTime)
5. Compléter manuellement les débits de gaz et les pressions

### Validation Automatique

Le système valide automatiquement :
- ✅ Présence des specs ECD avec dureté et profondeurs
- ✅ Poids de la charge dans le trial
- ✅ Composition de l'acier (% carbone)
- ✅ Données de la pièce parente

Si des données manquent, une alerte claire indique ce qui doit être complété.

## Gestion des Erreurs

### Erreurs Gérées

1. **Données manquantes** : Liste détaillée des paramètres manquants
2. **API Python indisponible** : Message clair invitant à démarrer le serveur
3. **Timeout** : Si la prédiction prend trop de temps (> 30s)
4. **Erreurs de validation** : Types de données invalides

### Messages d'Erreur

```javascript
// Exemple de message pour données manquantes
{
  "Données manquantes pour effectuer la prédiction" :
  - Dureté ECD valide (hardness) dans la pièce parente
  - Poids de la charge (loadData.weight) dans l'essai
}
```

## Format de Sortie

### Réponse API

```json
{
  "predicted_features": {
    "res_first_carb": 132.46,
    "res_first_diff": 68.17,
    "res_second_carb": 92.43,
    "res_second_diff": 59.52,
    "res_last_carb": 60.48,
    "res_last_diff": 544.74,
    "res_final_time": 8045.90,
    "res_num_cycles": 12.19
  },
  "reconstructed_recipe": [
    [132, 68],
    [92, 60],
    ...,
    [60, 545, 8046]
  ]
}
```

### Mapping vers Cycles Chimiques

Chaque cycle `[carb_time, diff_time]` est transformé en :

```javascript
{
  step: 1,
  time: 200,          // carb_time + diff_time (secondes)
  debit1: '',         // À remplir (Gaz 1 = C2H2)
  debit2: '',         // À remplir (Gaz 2 = N2)
  debit3: '',
  pressure: '',       // À remplir
  turbine: false,
  _predicted: true,   // Métadonnée interne
  _carbTime: 132,
  _diffTime: 68
}
```

## Évolutions Futures

### 1. Température Variable

**Objectif** : Permettre à l'utilisateur de choisir la température de traitement

**Implémentation** :
- Ajouter un champ `recipe_temperature` dans le formulaire du trial
- Créer un fichier de lookup Excel : `temperature_lookup.xlsx`
  - Colonnes : `temperature`, `carbon_max`, `carbon_flow`
  - Températures : 880°C à 980°C (pas de 10°C)
- Modifier `predictionService.js` pour lire le fichier Excel

**Fichier Excel Structure** :
```
| Temperature | Carbon Max | Carbon Flow |
|------------|------------|-------------|
| 880        | 1.45       | 12.3        |
| 890        | 1.50       | 12.8        |
| ...        | ...        | ...         |
| 950        | 1.70       | 14.7        |
| ...        | ...        | ...         |
| 980        | 1.85       | 16.5        |
```

### 2. Historique des Prédictions

- Logger chaque prédiction avec ses paramètres d'entrée
- Permettre de comparer prédictions vs résultats réels
- Améliorer le modèle avec feedback utilisateur

### 3. Validation Étendue

- Vérifier la cohérence des profondeurs (depthMin < depthMax)
- Convertir automatiquement les unités si différentes
- Avertir si les paramètres sont hors plage acceptable

## Tests

### Test Manuel

1. Créer une pièce avec :
   - Specs ECD : hardness=550, depthMin=1.0, depthMax=1.2, unit=mm
   - Poids : 5 kg
   - Acier avec composition C=0.2%

2. Créer un trial pour cette pièce :
   - Load weight : 50 kg

3. Cliquer sur "Prédire la recette"
4. Vérifier :
   - ✅ Cycles générés (environ 10-15 cycles)
   - ✅ Gaz pré-sélectionnés (C2H2, N2)
   - ✅ WaitTime rempli

### Test d'Erreurs

1. **Test données manquantes** :
   - Retirer le poids de la pièce
   - Vérifier l'alerte d'erreur claire

2. **Test API indisponible** :
   - Arrêter l'API Python
   - Vérifier le message "API de prédiction non disponible"

## Logs et Debugging

### Logs Backend

```javascript
logger.info('Recipe prediction request', {
  userId: req.user?.id,
  params: { hardness_value, target_depth, recipe_temperature }
});
```

### Logs Frontend

Les erreurs de prédiction sont loggées dans la console :
```javascript
console.error('Erreur lors de la prédiction:', error);
```

## Support

Pour toute question ou problème :
1. Vérifier que l'API Python est démarrée (`http://localhost:8000/docs`)
2. Vérifier les logs Node.js (`server/logs/`)
3. Consulter la documentation de l'API Python (`api/DOCUMENTATION.md`)

## Auteurs

- **Intégration** : Claude Code
- **API Python** : Collègue (modèle XGBoost + simulateur CBPWin)
- **Date** : 2026-01-05
