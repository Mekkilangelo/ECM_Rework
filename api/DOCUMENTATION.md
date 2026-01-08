# Documentation Technique - ECM Recipe Prediction API

## Vue d'ensemble

Cette API prédit des recettes de carburation optimales pour le traitement thermique de l'acier en utilisant un modèle XGBoost et un simulateur physique CBPWin.

### Objectif
Prédire les paramètres de traitement de carburation (cycles de carburisation/diffusion) pour atteindre une profondeur de carburation cible sur un acier donné.

---

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Utilisateur)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP POST /predict
                         │ (9 paramètres d'entrée)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FASTAPI APPLICATION                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  api/main.py - Point d'entrée de l'application           │  │
│  │  - Initialisation FastAPI                                 │  │
│  │  - Enregistrement des routers                             │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                       │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │  api/routers/predict.py - Route /predict                  │  │
│  │  - Validation des données (Pydantic)                      │  │
│  │  - Appel du service de prédiction                         │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                       │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │  api/services/predictor.py - Logique métier              │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ Étape 1: Préparation des features                   │  │  │
│  │  │ - 9 features d'entrée (hardness, depth, etc.)       │  │  │
│  │  │ - Appel simulateur CBPWin pour 8 features calculées │  │  │
│  │  │ - Total: 17 features pour le modèle                 │  │  │
│  │  └────────────────────┬───────────────────────────────┘  │  │
│  │                       │                                   │  │
│  │  ┌────────────────────▼───────────────────────────────┐  │  │
│  │  │ Étape 2: Prédiction avec modèle XGBoost            │  │  │
│  │  │ - Chargement du modèle .pkl                         │  │  │
│  │  │ - Prédiction de 8 valeurs de sortie                │  │  │
│  │  └────────────────────┬───────────────────────────────┘  │  │
│  │                       │                                   │  │
│  │  ┌────────────────────▼───────────────────────────────┐  │  │
│  │  │ Étape 3: Reconstruction de la recette              │  │  │
│  │  │ - Conversion des features en cycles                │  │  │
│  │  │ - Format [[carb, diff], [carb, diff], ...]         │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │  MODULES UTILITAIRES          │
          │  ┌────────────────────────┐  │
          │  │ utils/cbpwin.py        │  │
          │  │ Simulateur physique    │  │
          │  │ de carburation         │  │
          │  └────────────────────────┘  │
          │  ┌────────────────────────┐  │
          │  │ utils/util.py          │  │
          │  │ - Extraction features  │  │
          │  │ - Reconstruction       │  │
          │  │ - Helpers              │  │
          │  └────────────────────────┘  │
          └──────────────────────────────┘
```

---

## Détail des Composants

### 1. Point d'entrée: `api/main.py`

**Rôle**: Initialisation de l'application FastAPI

```python
app = FastAPI(
    title="ECM Recipe Prediction API",
    version="1.0"
)
app.include_router(predict_router)
```

**Responsabilités**:
- Créer l'instance FastAPI
- Enregistrer les routers (endpoints)
- Configuration globale de l'API

---

### 2. Modèles de données: `api/models.py`

**Rôle**: Validation et schémas de données avec Pydantic

#### `PredictRequest` - Données d'entrée (9 paramètres)
```python
{
    "hardness_value": float,       # Dureté visée (HV) ex: 550, 600, 650
    "target_depth": float,         # Profondeur de carburation visée (mm)
    "load_weight": float,          # Poids de charge (kg)
    "weight": float,               # Poids de la pièce (kg)
    "is_weight_unknown": int,      # 0 ou 1, poids inconnu?
    "recipe_temperature": float,   # Température du traitement (°C)
    "recipe_carbon_max": float,    # Teneur max carbone visée (%)
    "recipe_carbon_flow": float,   # Flux de carbone (%)
    "carbon_percentage": float     # Carbone initial de l'acier (%)
}
```

#### `PredictResponse` - Données de sortie
```python
{
    "predicted_features": {        # 8 features prédites
        "res_first_carb": float,   # Temps carb cycle 1 (s)
        "res_first_diff": float,   # Temps diff cycle 1 (s)
        "res_second_carb": float,  # Temps carb cycle 2 (s)
        "res_second_diff": float,  # Temps diff cycle 2 (s)
        "res_last_carb": float,    # Temps carb dernier cycle (s)
        "res_last_diff": float,    # Temps diff dernier cycle (s)
        "res_final_time": float,   # Temps phase finale (s)
        "res_num_cycles": float    # Nombre de cycles
    },
    "reconstructed_recipe": [      # Recette reconstruite
        [132, 68],                 # [carb_time, diff_time] cycle 1
        [92, 60],                  # cycle 2
        ...
        [60, 545, 8046]            # dernier cycle + final_time
    ]
}
```

---

### 3. Router: `api/routers/predict.py`

**Rôle**: Définir l'endpoint HTTP et orchestrer les appels

```python
@router.post("/predict", response_model=PredictResponse)
def predict_recipe(req: PredictRequest):
    # 1. Validation automatique par Pydantic
    # 2. Appel du service de prédiction
    predicted, recipe = predictor.predict(req)
    # 3. Retour de la réponse formatée
    return PredictResponse(...)
```

**Flux**:
1. Reçoit la requête HTTP POST
2. Pydantic valide automatiquement les données
3. Délègue au `PredictorService`
4. Retourne la réponse formatée

---

### 4. Service de prédiction: `api/services/predictor.py`

**Rôle**: Cœur de la logique métier - orchestration de la prédiction

#### 4.1 Initialisation
```python
class PredictorService:
    def __init__(self):
        # Chargement du modèle XGBoost depuis le fichier .pkl
        with open(XGB_MODEL_PATH, "rb") as f:
            self.model = pickle.load(f)
```

#### 4.2 Construction des features (méthode `build_full_feature_row`)

Cette méthode prépare les **17 features** nécessaires au modèle:

**Étape 1: 9 features d'entrée (fournies par l'utilisateur)**
```python
input_features = {
    "hardness_value": req.hardness_value,
    "target_depth": req.target_depth,
    "load_weight": req.load_weight,
    "weight": req.weight,
    "is_weight_unknown": req.is_weight_unknown,
    "recipe_temperature": req.recipe_temperature,
    "recipe_carbon_max": req.recipe_carbon_max,
    "recipe_carbon_flow": req.recipe_carbon_flow,
    "carbon_percentage": req.carbon_percentage,
}
```

**Étape 2: 8 features calculées par le simulateur CBPWin**

Le simulateur CBPWin est appelé avec les paramètres d'entrée pour simuler un traitement de carburation initial:

```python
params = {
    "temperature": req.recipe_temperature,
    "carbon_flow": req.recipe_carbon_flow,
    "carbon_max": req.recipe_carbon_max,
    "carbon_min": 0.7 * req.recipe_carbon_max,
    "carbon_final": 0.69 * req.recipe_carbon_max,
    "target_depth": req.target_depth,
    "eff_carbon": get_eff_carbon(req.hardness_value),  # Carbone effectif
    "steel_name": "Predicted Steel",
    "initial_carbon": req.carbon_percentage
}

# Simulation physique
sim_results = calculate_recipe(params)

# Extraction des features CBPWin
cbpwin_features = extract_features(sim_results)
# Résultat: 8 features (first_carb, first_diff, second_carb, ...)
```

**Étape 3: Fusion des features**
```python
# Total: 9 (input) + 8 (cbpwin) = 17 features
full_features = {**input_features, **cbpwin_features}
return pd.DataFrame([full_features])
```

#### 4.3 Prédiction (méthode `predict`)

```python
def predict(self, req):
    # 1. Construire les 17 features
    X = self.build_full_feature_row(req)

    # 2. Prédire avec le modèle XGBoost
    y_pred = self.model.predict(X)[0]  # 8 valeurs

    # 3. Formater les prédictions
    predicted_features = {
        'res_first_carb': y_pred[0],
        'res_first_diff': y_pred[1],
        'res_second_carb': y_pred[2],
        'res_second_diff': y_pred[3],
        'res_last_carb': y_pred[4],
        'res_last_diff': y_pred[5],
        'res_final_time': y_pred[6],
        'res_num_cycles': y_pred[7]
    }

    # 4. Reconstruire la recette complète
    reconstructed = reconstruct_recipe(predicted_features)

    return predicted_features, reconstructed
```

---

### 5. Simulateur CBPWin: `utils/cbpwin.py`

**Rôle**: Simulateur physique de carburation (reproduction du logiciel CBPWin)

#### Principe de fonctionnement

Le simulateur CBPWin modélise la **diffusion du carbone** dans l'acier lors d'un traitement thermique de carburation.

**Modèle physique**:
- Simulation par couches (2000 couches de 0.05mm chacune)
- Équations de diffusion de Fick
- Facteur de diffusion: `D = D₀ * exp(-K/(T+273.15))`
  - D₀ = 9.332 cm²/s
  - K = 21393.1 K (énergie d'activation)

**Trois phases de traitement**:

1. **Carburisation** (`calc_layers_carburizing`):
   - Apport de carbone en surface
   - Diffusion vers l'intérieur
   - Arrêt quand surface atteint `carbon_max`

2. **Diffusion** (`calc_layers_diffusion`):
   - Pas d'apport externe
   - Homogénisation du carbone
   - Arrêt quand surface descend à `carbon_min`

3. **Phase finale** (`calc_layers_final`):
   - Diffusion jusqu'à `carbon_final`
   - Stabilisation du profil

**Cycle de simulation**:
```python
def run_automatic_simulation(self, params):
    results = []
    while profondeur < target_depth:
        # 1. Phase carburisation
        carb_time = calc_layers_carburizing(carbon_max)

        # 2. Phase diffusion
        diff_time = calc_layers_diffusion(carbon_min)

        # 3. Phase finale
        final_time = calc_layers_final(carbon_final)

        # 4. Calculer profondeur effective
        depth = calculate_effective_depth(eff_carbon)

        results.append((carb_time, diff_time, final_time, depth))

    return results  # Liste de tuples (temps, temps, temps, profondeur)
```

**Sortie du simulateur**:
```python
# Exemple: 12 cycles pour atteindre la profondeur
[
    (132, 68, 0, 0.15),    # Cycle 1: 132s carb, 68s diff, profondeur 0.15mm
    (92, 60, 0, 0.28),     # Cycle 2
    ...
    (60, 545, 8046, 2.1)   # Cycle 12: atteint 2.1mm
]
```

---

### 6. Utilitaires: `utils/util.py`

#### 6.1 `get_eff_carbon(hardness_value)`

Convertit la dureté visée en teneur en carbone effective:

```python
def get_eff_carbon(hardness_value):
    # Table de correspondance dureté → carbone effectif
    mapping = {
        700: 0.45,
        650: 0.42,
        600: 0.39,
        550: 0.36,
        513: 0.32
    }
    return mapping.get(hardness_value, 0.36)
```

#### 6.2 `calculate_recipe(params)`

Wrapper pour lancer le simulateur CBPWin:

```python
def calculate_recipe(predicted_params):
    simulator = CBPWinSimulatorExact()
    return simulator.run_automatic_simulation(process_params)
```

#### 6.3 `extract_features(recipe)`

Extrait 8 features clés d'une recette simulée:

```python
def extract_features(recipe):
    # recipe = [(carb, diff), (carb, diff), ..., (carb, diff, final_time)]

    return {
        'num_cycles': len(recipe),
        'first_carb': recipe[0][0],      # Premier temps de carburisation
        'first_diff': recipe[0][1],      # Premier temps de diffusion
        'second_carb': recipe[1][0],     # Deuxième temps de carburisation
        'second_diff': recipe[1][1],     # Deuxième temps de diffusion
        'last_carb': recipe[-1][0],      # Dernier temps de carburisation
        'last_diff': recipe[-1][1],      # Dernier temps de diffusion
        'final_time': recipe[-1][2]      # Temps de phase finale
    }
```

#### 6.4 `reconstruct_recipe(features)`

Reconstruit une recette complète à partir des 8 features prédites:

```python
def reconstruct_recipe(features):
    num_cycles = int(round(features['res_num_cycles']))

    # Calcul de la décroissance du carbone et croissance de la diffusion
    if num_cycles > 2:
        carb_decay = (second_carb - last_carb) / (num_cycles - 2)
        diff_growth = (last_diff - second_diff) / (num_cycles - 2)

    recipe = []
    for i in range(num_cycles):
        if i == 0:
            # Cycle 1: valeurs directes
            carb, diff = first_carb, first_diff
        elif i == 1:
            # Cycle 2: valeurs directes
            carb, diff = second_carb, second_diff
        else:
            # Cycles suivants: interpolation linéaire
            steps = i - 1
            carb = second_carb - carb_decay * steps
            diff = second_diff + diff_growth * steps

        if i == num_cycles - 1:
            recipe.append([carb, diff, final_time])
        else:
            recipe.append([carb, diff])

    return recipe
```

---

## Le Modèle XGBoost (.pkl)

### Qu'est-ce qu'un fichier .pkl?

**PKL = Pickle** (format de sérialisation Python)

Le fichier `models/best_recipe_model_XGBoost.pkl` est un modèle XGBoost **sérialisé** (sauvegardé) qui contient:

1. **L'architecture du modèle**: XGBoost (Gradient Boosting)
2. **Les poids entraînés**: Arbre de décision avec leurs valeurs
3. **Les paramètres**: Configuration du modèle
4. **Les features**: Ordre et noms attendus (17 features)

### Pourquoi est-il illisible?

Le fichier .pkl est un **format binaire** qui:
- Contient des données sérialisées Python
- N'est pas lisible en texte brut
- Ne peut être chargé qu'avec `pickle.load()`

**Analogie**: C'est comme un fichier .exe - il contient du code compilé, pas du texte lisible.

### Contenu du modèle (conceptuel)

Le modèle a été entraîné pour apprendre la relation:

```
[17 features d'entrée] → [8 features de sortie]
```

**Entrées (17 features)**:
- 9 features directes (hardness, depth, weight, temperature, etc.)
- 8 features CBPWin simulées (first_carb, first_diff, second_carb, etc.)

**Sorties (8 features)**:
- res_first_carb, res_first_diff
- res_second_carb, res_second_diff
- res_last_carb, res_last_diff
- res_final_time, res_num_cycles

### Comment a-t-il été créé?

Probablement avec un code d'entraînement comme:

```python
import xgboost as xgb
from sklearn.model_selection import train_test_split
import pickle

# 1. Préparation des données historiques
X_train = ...  # 17 features pour chaque recette
y_train = ...  # 8 targets pour chaque recette

# 2. Entraînement
model = xgb.XGBRegressor(...)
model.fit(X_train, y_train)

# 3. Sauvegarde
with open('best_recipe_model_XGBoost.pkl', 'wb') as f:
    pickle.dump(model, f)
```

### Inspecter le modèle (si nécessaire)

Si vous voulez voir les détails du modèle:

```python
import pickle

with open('models/best_recipe_model_XGBoost.pkl', 'rb') as f:
    model = pickle.load(f)

# Informations disponibles
print(model.get_params())           # Paramètres du modèle
print(model.feature_importances_)   # Importance des features
print(model.n_estimators)           # Nombre d'arbres
```

---

## Flux de Données Complet

### Exemple concret avec valeurs

**Requête utilisateur**:
```json
{
    "hardness_value": 550.0,
    "target_depth": 1.12,
    "load_weight": 188.0,
    "weight": 221,
    "is_weight_unknown": 0,
    "recipe_temperature": 960,
    "recipe_carbon_max": 1.80,
    "recipe_carbon_flow": 15.36,
    "carbon_percentage": 0.2
}
```

### Étape 1: Appel du simulateur CBPWin

**Paramètres construits**:
```python
{
    "temperature": 960,
    "carbon_flow": 15.36,
    "carbon_max": 1.80,
    "carbon_min": 1.26,          # 0.7 * carbon_max
    "carbon_final": 1.24,        # 0.69 * carbon_max
    "target_depth": 1.12,
    "eff_carbon": 0.36,          # get_eff_carbon(550)
    "initial_carbon": 0.2
}
```

**Simulation CBPWin** → Résultats:
```python
# 12 cycles simulés
[(130, 65, 0, 0.09),
 (91, 58, 0, 0.18),
 (88, 105, 0, 0.27),
 ...
 (60, 540, 8000, 1.12)]  # Atteint 1.12mm
```

**Features extraites**:
```python
cbpwin_features = {
    'cbpwin_first_carb': 130,
    'cbpwin_first_diff': 65,
    'cbpwin_second_carb': 91,
    'cbpwin_second_diff': 58,
    'cbpwin_last_carb': 60,
    'cbpwin_last_diff': 540,
    'cbpwin_final_time': 8000,
    'cbpwin_num_cycles': 12
}
```

### Étape 2: Construction du vecteur de features

**Fusion**: 9 features d'entrée + 8 features CBPWin = **17 features**

```python
X = [
    550.0,    # hardness_value
    1.12,     # target_depth
    188.0,    # load_weight
    221,      # weight
    0,        # is_weight_unknown
    960,      # recipe_temperature
    1.80,     # recipe_carbon_max
    15.36,    # recipe_carbon_flow
    0.2,      # carbon_percentage
    130,      # cbpwin_first_carb
    65,       # cbpwin_first_diff
    91,       # cbpwin_second_carb
    58,       # cbpwin_second_diff
    60,       # cbpwin_last_carb
    540,      # cbpwin_last_diff
    8000,     # cbpwin_final_time
    12        # cbpwin_num_cycles
]
```

### Étape 3: Prédiction par le modèle XGBoost

```python
y_pred = model.predict(X)  # → [132.46, 68.17, 92.43, 59.52, 60.48, 544.74, 8045.90, 12.19]
```

**Formatage**:
```python
predicted_features = {
    'res_first_carb': 132.46,
    'res_first_diff': 68.17,
    'res_second_carb': 92.43,
    'res_second_diff': 59.52,
    'res_last_carb': 60.48,
    'res_last_diff': 544.74,
    'res_final_time': 8045.90,
    'res_num_cycles': 12.19
}
```

### Étape 4: Reconstruction de la recette

```python
reconstructed_recipe = [
    [132, 68],      # Cycle 1: 132s carb, 68s diff
    [92, 60],       # Cycle 2
    [89, 108],      # Cycle 3 (interpolé)
    [86, 157],      # Cycle 4 (interpolé)
    ...
    [60, 545, 8046] # Cycle 12: final_time ajouté
]
```

### Étape 5: Réponse API

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
        [89, 108],
        [86, 157],
        [83, 205],
        [80, 254],
        [76, 302],
        [73, 351],
        [70, 399],
        [67, 448],
        [64, 496],
        [60, 545, 8046]
    ]
}
```

---

## Communication entre les Blocs

```
┌─────────────┐
│   Client    │ ─── POST /predict ────────┐
└─────────────┘                           │
                                          ▼
┌──────────────────────────────────────────────────────┐
│ FastAPI (main.py)                                     │
│   ├─ Reçoit requête HTTP                              │
│   └─ Route vers predict_router                        │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ Router (predict.py)                                   │
│   ├─ Valide données (Pydantic)                        │
│   └─ Appelle predictor.predict(req)                   │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ PredictorService (predictor.py)                       │
│   ┌──────────────────────────────────────────────┐   │
│   │ 1. build_full_feature_row(req)              │   │
│   │    ├─ Extrait 9 features d'entrée           │   │
│   │    ├─ Appelle calculate_recipe() ──────┐    │   │
│   │    │                                    │    │   │
│   │    │   ┌────────────────────────────────▼──┐ │   │
│   │    │   │ CBPWinSimulator (cbpwin.py)       │ │   │
│   │    │   │  ├─ Simule carburation physique   │ │   │
│   │    │   │  ├─ Calcule diffusion carbone     │ │   │
│   │    │   │  └─ Retourne cycles simulés       │ │   │
│   │    │   └────────────┬──────────────────────┘ │   │
│   │    │                │                        │   │
│   │    ├─ Appelle extract_features() ◄──────────┘   │
│   │    │  (utils/util.py)                        │   │
│   │    │  └─ Extrait 8 features CBPWin          │   │
│   │    └─ Fusionne → 17 features                │   │
│   └──────────────────────────────────────────────┘   │
│                                                       │
│   ┌──────────────────────────────────────────────┐   │
│   │ 2. model.predict(X)                         │   │
│   │    └─ Modèle XGBoost (.pkl) prédit 8 valeurs│   │
│   └──────────────────────────────────────────────┘   │
│                                                       │
│   ┌──────────────────────────────────────────────┐   │
│   │ 3. reconstruct_recipe(predicted)            │   │
│   │    └─ Appelle utils/util.py                 │   │
│   │    └─ Reconstruit recette complète          │   │
│   └──────────────────────────────────────────────┘   │
│                                                       │
│   └─ Retourne (predicted_features, recipe)           │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ Router (predict.py)                                   │
│   └─ Formate réponse PredictResponse                 │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌─────────────┐
│   Client    │ ◄─── JSON Response
└─────────────┘
```

---

## Points Clés à Retenir

### 1. Rôle du simulateur CBPWin
- **Objectif**: Générer des features physiquement cohérentes
- **Input**: Paramètres de traitement (température, carbone, etc.)
- **Output**: 8 features de référence (temps de cycles)
- **Utilité**: Enrichir les données d'entrée avec des informations physiques

### 2. Rôle du modèle XGBoost
- **Objectif**: Corriger/optimiser les prédictions du simulateur
- **Input**: 17 features (9 directes + 8 simulées)
- **Output**: 8 features optimisées
- **Utilité**: Le modèle a appris sur des données réelles à ajuster les prédictions physiques

### 3. Pourquoi 17 features en entrée et 8 en sortie?
- Le modèle utilise les features simulées (CBPWin) comme **contexte**
- Il prédit des features similaires mais **optimisées** basées sur l'apprentissage
- Les features CBPWin aident le modèle à comprendre le comportement physique attendu

### 4. Flux hybride: Physique + Machine Learning
```
Physique (CBPWin) → Simulation initiale
         ↓
Machine Learning (XGBoost) → Correction basée sur données réelles
         ↓
Reconstruction → Recette finale optimisée
```

### 5. Avantages de cette approche
- **Cohérence physique**: Le simulateur garantit des résultats réalistes
- **Optimisation**: Le ML corrige les écarts entre modèle physique et réalité
- **Robustesse**: Combinaison des deux approches

---

## Commandes Utiles

### Lancer l'API
```bash
# Avec uv
uv run uvicorn api.main:app --port 8000

# Avec auto-reload (développement)
uv run uvicorn api.main:app --port 8000 --reload

# Avec Docker
docker build -t cbpwin-api .
docker run -p 8000:8000 cbpwin-api
```

### Tester l'API
```bash
# Documentation interactive
http://localhost:8000/docs

# Test avec Python
python test-api.py

# Test avec curl
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"hardness_value": 550, "target_depth": 1.12, ...}'
```

### Installer les dépendances
```bash
# Avec uv (recommandé)
uv venv
uv pip install -r requirements.txt

# Avec pip
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r requirements.txt
```

---

## Dépendances

```
fastapi        # Framework web
uvicorn        # Serveur ASGI
pydantic       # Validation de données
numpy          # Calculs numériques
pandas         # Manipulation de données
xgboost        # Modèle de prédiction
scikit-learn   # Utilitaires ML
```

---

## Structure des Fichiers

```
api/
├── api/
│   ├── main.py                 # Point d'entrée FastAPI
│   ├── models.py               # Schémas Pydantic
│   ├── routers/
│   │   └── predict.py          # Endpoint /predict
│   └── services/
│       └── predictor.py        # Logique de prédiction
├── utils/
│   ├── cbpwin.py              # Simulateur physique
│   └── util.py                # Fonctions utilitaires
├── models/
│   └── best_recipe_model_XGBoost.pkl  # Modèle entraîné
├── requirements.txt           # Dépendances Python
├── Dockerfile                 # Configuration Docker
├── README.md                  # Instructions de démarrage
└── test-api.py               # Script de test
```

---

## Glossaire

| Terme | Définition |
|-------|------------|
| **Carburation** | Traitement thermique enrichissant la surface de l'acier en carbone |
| **Profondeur de carburation** | Distance depuis la surface où le carbone a diffusé |
| **Dureté (HV)** | Dureté Vickers, mesure de résistance à la pénétration |
| **Cycle de carburation** | Alternance carburisation (ajout carbone) / diffusion (homogénéisation) |
| **Carbone effectif** | Teneur en carbone à la profondeur visée |
| **XGBoost** | Algorithme de machine learning basé sur gradient boosting |
| **Pickle (.pkl)** | Format de sérialisation Python pour sauvegarder des objets |
| **Features** | Variables d'entrée ou de sortie du modèle |
| **CBPWin** | Logiciel de simulation de carburation |

---

*Documentation générée le 2025-12-24*
