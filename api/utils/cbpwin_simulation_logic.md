# Mécanique de Simulation CBPWin : Calcul du Profil Carbone

Ce document détaille la logique mathématique et algorithmique utilisée par le simulateur CBPWin (C++) pour calculer la pénétration du carbone dans l'acier au cours du temps. L'objectif est de vous fournir les clés pour reproduire ce comportement fidèlement dans n'importe quel langage de programmation (C#, Java, Python, etc.).

## 1. Le Principe Physique

Le modèle repose sur la **Seconde Loi de Fick**, qui décrit la diffusion de la matière (ici le carbone) à l'intérieur d'un milieu solide (l'acier) sous l'effet d'un gradient de concentration.

La formule continue est la suivante :
$$ \frac{\partial C}{\partial t} = D \frac{\partial^2 C}{\partial x^2} $$

Où :
- $C$ est la concentration en carbone (%)
- $t$ est le temps (secondes)
- $x$ est la profondeur (mètres ou millimètres)
- $D$ est le coefficient de diffusion (dépendant de la température et de l'alliage)

## 2. La Discrétisation (Finite Difference Method - FDM)

Puisqu'un ordinateur ne peut pas résoudre des équations continues directement, CBPWin utilise la méthode des **Différences Finies (FDM)**. L'espace (la profondeur de la pièce) et le temps sont découpés en petits "morceaux" (pas).

### Les Constantes Fondamentales du Modèle CBPWin

Ces valeurs sont "gravées dans le marbre" du moteur de CBPWin et DOIVENT être respectées pour obtenir le même résultat :

1.  **Le Pas de Temps ($\Delta t$) :** 1 seconde. À chaque itération de la boucle de calcul, on fait avancer le temps de 1 seconde.
2.  **Le Pas d'Espace ($\Delta x$) :** 0.05 mm par couche.
3.  **Nombre de Couches Max :** 2000 couches (soit une profondeur simulable théorique de 100 mm).

### Structure de Données (Le Vecteur d'État)

Le cœur du simulateur est un tableau (ou liste/array) que nous appellerons `layer_array`.
- **Taille :** 2001 éléments (de l'index 0 à 2000).
- **Initialisation :** Au démarrage (Temps $t=0$), on remplit CHAQUE "case" de ce tableau avec la teneur en carbone initial de l'acier (ex: `0.20%`).

> [!IMPORTANT]
> **Type de données exact (source C++) :** Dans le code source C++ de CBPWin, le fichier `CBPWinCoreCommon.h` déclare :
> ```c
> typedef double CBPWinReal;
> ```
> **Toutes** les variables du moteur (`layer_array`, `diffusion_factor_static`, `out_carbon_quantity`, `step_time`, `total_time`, etc.) sont des **`double` IEEE 754 64 bits** (~15-17 chiffres significatifs). Il n'y a aucun `float` 32-bit dans le moteur de calcul. Pour reproduire CBPWin exactement, vous devez utiliser des doubles 64-bit partout et **ne jamais arrondir** les valeurs intermédiaires.
>
> En Python : utilisez `float` natif (= double 64-bit). En JS/TS : utilisez `Float64Array` (pas `Float32Array`). En C# : utilisez `double` (pas `float`).

**Signification des index :**
- `layer_array[0]` : L'extrême surface (0.00 mm).
- `layer_array[1]` : La sous-couche immédiate (entre 0 et 0.05 mm, centrée à 0.025 mm).
- `layer_array[2]` : La couche suivante (centrée à 0.075 mm).
- `layer_array[N]` : Couche à la profondeur approchée $N \times 0.05$ mm.

*(Note technique : CBPWin traite l'index 0 comme la surface mathématique pure, et les index 1, 2... comme des couches physiques de 0.05mm d'épaisseur).*

---

## 3. Les Calculs Préparatoires

Avant de lancer la boucle temporelle (les "secondes"), deux paramètres constants doivent être calculés.

### A. Le Facteur de Diffusion Statique (`diffusion_factor_static`)
Ce facteur dépend de la température de traitement et de la nuance d'acier. Il traduit la "facilité" avec laquelle le carbone voyage dans la matière à cette température.

```math
diffusion\_factor = d0\_factor \times \exp\left(\frac{-k\_factor}{Temperature + 273.15}\right)
```
*   `Temperature` : En degrés Celsius (ex: 980.0)
*   `d0_factor` et `k_factor` : Constantes de l'acier (standard CBPWin : `9.332` et `21393.1`)

### B. Le Flux Carbone Externe (`out_carbon_quantity`)
C'est la quantité de carbone "poussée" par le gaz atmosphérique vers la surface de la pièce pendant **1 seconde**.

```math
out\_carbon\_quantity = carbon\_flow \times \frac{1.0}{3600.0 \times mass \times 0.05}
```
*   [carbon_flow](file:///c:/Users/mekki/Desktop/CIA/ECM/CBPWin%202022/code_source_cbpwin_2022/cbpwin_reverse.py#42-83) : Le débit équivalent configuré (ex: 16.0). En mode "reverse", ce flow est parfois déduit d'une abaque température/débit C2H2.
*   `mass` : Masse volumique de l'acier (standard CBPWin : `7.87`).
*   $3600$ : Conversion Heures -> Secondes.
*   $0.05$ : L'épaisseur d'une couche en mm.

---

## 4. La Boucle de Simulation (Exécution Seconde par Seconde)

Voici ce qui se passe EXACTEMENT pour **chaque seconde** de traitement.

### Phase 1 : Initialisation de la Seconde
À chaque début de seconde, on prépare le transfert de carbone depuis l'extérieur vers la première couche.
- En période de **Cémentation (Boost)** : L'apport externe `ext_delta_c` = `out_carbon_quantity`.
- En période de **Diffusion / Final** : L'apport externe `ext_delta_c` = `0.0` (on laisse le carbone interne "s'étaler").

### Phase 2 : Calcul Couche par Couche

On parcourt notre tableau `layer_array` depuis l'index `1` jusqu'à la `couche maximale impactée` (pour éviter de calculer inutilement jusqu'à 2000 si le carbone n'a pénétré que de 5 couches).

Pour la couche actuelle `n` (de 1 à N) :

1.  **Calcul du Carbone Transitif (`int_delta_c`) :**
    C'est la quantité de carbone qui s'échappe de la couche `n` vers la couche plus profonde `n+1`.
    ```pseudocode
    C_actuel = layer_array[n]
    C_suivant = layer_array[n + 1]
    
    // Le "0.000025" est une constante mathématique issue de la FDM de CBPWin
    // (lié à (delta_x)^2)
    int_delta_c = diffusion_factor_static * ((C_actuel - C_suivant) / 0.000025)
    ```

2.  **Mise à jour du Bilan Carbone de la Couche `n` :**
    Le nouveau % de carbone de la couche `n` est :
    Ce qu'elle avait AVANT + Ce qui est ENTRÉ (depuis `n-1` ou l'extérieur) - Ce qui SORT (vers `n+1`).
    ```pseudocode
    layer_array[n] = layer_array[n] + ext_delta_c - int_delta_c
    ```

3.  **Mise à jour de la Surface (L'index 0) :**
    Dans le modèle CBPWin, l'index 0 est recalculé après chaque mise à jour de couche par une extrapolation linéaire simple entre les couches 1 et 2. Cela permet d'avoir une valeur de surface mathématiquement lisse.
    ```pseudocode
    layer_array[0] = layer_array[1] + ((layer_array[1] - layer_array[2]) / 2.0)
    ```

4.  **Préparation de la Couche Suivante :**
    Ce qui est *sorti* de la couche `n` (`int_delta_c`) devient ce qui *entre* (`ext_delta_c`) dans la couche `n+1`. On incrémente `n` et on recommence depuis l'étape 1.

### Phase 3 : Condition d'Arrêt de la Boucle Spatiale

On ne calcule pas les 2000 couches à chaque seconde. On s'arrête de descendre en profondeur quand la quantité de carbone transmise (`int_delta_c`) devient infime (inférieure à `0.000001`). 

Quand cette condition est atteinte :
- On enregistre cette couche comme la nouvelle limite pour la seconde suivante.
- **La seconde est considérée comme écoulée.** Le temps de l'étape (`step_time`) avance de +1s.

*(Si on atteint la limite des 2000 couches sans passer sous `0.000001`, la simulation s'arrête net, la pièce est "traversée" de part en part).*

---

## 4bis. La Structure Complète d'un Step : 3 Phases + Snapshots

Un **step** dans CBPWin n'est pas une seule boucle temps : c'est la répétition de **3 phases séquentielles** — Cémentation, Diffusion, Final — chacune avec sa propre condition d'arrêt et son propre compteur de secondes.

### A. Les 3 Phases et leurs Conditions d'Arrêt

| Phase | Apport externe | Condition d'arrêt (`stop = True`) | Temps retourné |
|---|---|---|---|
| **Cémentation (Boost)** | `out_carbon_quantity` | `layer_array[0] > carbon_max` | `carb_time` |
| **Diffusion** | `0.0` | `layer_array[0] < carbon_min` | `diff_time` |
| **Final** | `0.0` | `layer_array[0] < carbon_final` | `final_time` |

Chaque phase applique exactement le même algorithme FDM seconde par seconde (décrit en §4), seule la condition d'arrêt et l'apport externe changent.

### B. Le Mécanisme de Snapshot / Restauration

Point **critique** : entre chaque phase, CBPWin sauvegarde un snapshot du `layer_array` et **restaure** cet état avant de démarrer la phase suivante. Ceci évite que les secondes supplémentaires d'une phase "contaminent" le point de départ de la phase suivante.

```pseudocode
// === STEP N ===

// PHASE 1 : CÉMENTATION
runner la boucle FDM avec apport externe jusqu'à surface > carbon_max
→ carb_time secondes écoulées

// Snapshot A (état post-cémentation)
snapshot_carb = copie complète de layer_array

// PHASE 2 : DIFFUSION
Restaurer layer_array depuis snapshot_carb      // ← RESTAURATION
runner la boucle FDM sans apport jusqu'à surface < carbon_min
→ diff_time secondes écoulées

// Snapshot B (état post-diffusion)
snapshot_diff = copie complète de layer_array

// PHASE 3 : FINAL
Restaurer layer_array depuis snapshot_diff      // ← RESTAURATION
runner la boucle FDM sans apport jusqu'à surface < carbon_final
→ final_time secondes écoulées

// === CALCUL PROFONDEUR EFFICACE ===
// (sur le layer_array actuel = état post-Final)

// === PRÉPARATION DU STEP SUIVANT ===
// ⚠️ On repart de snapshot_diff, PAS de l'état Final !
Restaurer layer_array depuis snapshot_diff      // ← RESTAURATION (diff, pas final)
```

### C. Pourquoi le Step Suivant repart de snapshot_diff ?

Cette règle reproduit exactement le comportement du code C++ CBPWin original (`pOldLayerDiffusion`). La phase **Final** sert uniquement à **mesurer** (calculer `final_time` et la profondeur) sans influencer la physique du step suivant. Concrètement :

- `final_time` n'est qu'un indicateur de convergence vers une surface stabilisée.
- Le step suivant de cémentation repart du profil post-diffusion, ce qui correspond à l'état réel de la pièce à l'entrée du prochain cycle four.

### D. Schéma Complet d'un Cycle de Steps

```
État initial (carbone uniforme)
   │
   ▼──────────────────────────── STEP 1 ─────────────────────────────
   │  CÉMENTATION  : boucle FDM avec apport → surface monte > carbon_max
   │                 → carb_time_1 secondes
   │  [snapshot_carb_1]
   │  DIFFUSION    : repart de snapshot_carb_1, sans apport → surface descend < carbon_min
   │                 → diff_time_1 secondes
   │  [snapshot_diff_1]
   │  FINAL        : repart de snapshot_diff_1, sans apport → surface descend < carbon_final
   │                 → final_time_1 secondes
   │  PROFONDEUR   : calculée sur état post-Final → depth_1
   │  depth_1 < target_depth ? → continuer
   │  Restauration de snapshot_diff_1 pour le step suivant
   ▼──────────────────────────── STEP 2 ─────────────────────────────
   │  (même séquence, état de départ = snapshot_diff_1)
   ...
   ▼──────────────────────────── STEP N ─────────────────────────────
   │  depth_N >= target_depth ? → ARRÊT SIMULATION ✅
```

---

## 4ter. Règles de Précision Numérique (Source : Code C++ CBPWin)

> [!CAUTION]
> Cette section documente les règles de précision **directement extraites du code source C++ original**. Le non-respect de ces règles provoque des écarts de résultats dès le premier step, qui s'accumulent aux steps suivants.

### A. Type de Données Exact : `double` 64-bit Partout

Extrait de `CBPWinCoreCommon.h` (ligne 21) :
```c
typedef double CBPWinReal;
```

**Chaque variable du moteur** est déclarée avec ce type :

| Variable C++ | Type réel | Equiv. Python | Equiv. JS/TS | Equiv. C# |
|---|---|---|---|---|
| `m_pLayerArray[2001]` | `double[2001]` | `array('d', ...)` | `Float64Array` | `double[]` |
| `m_dDiffusionFactorStatic` | `double` | `float` | `number` | `double` |
| `m_dOutCarbonQuantity` | `double` | `float` | `number` | `double` |
| `m_dCurrentStepTime` | `double` | `float` | `number` | `double` |
| `m_dCurrentTotalTime` | `double` | `float` | `number` | `double` |
| `dIntDeltaC`, `dExtDeltaC` | `double` | `float` | `number` | `double` |
| Couches Carb/Diff/Final (`CBPWinStep`) | `double[2001]` | `array('d', ...)` | `Float64Array` | `double[]` |

> [!WARNING]
> **Ne jamais arrondir ou tronquer** les valeurs intermédiaires lors de la reproduction. Tout arrondi introduit un biais qui se propage et s'amplifie à chaque seconde de simulation.

### B. Reset du Temps Global après la Phase Final (Point Critique)

C'est **la principale source d'écart** en dehors des arrondis. Le code C++ (ligne 260 de `CBPWinEngineIterative.cpp`) exécute :

```cpp
// C++ EXACT — après calcLayers() de la phase Final :
m_dCurrentTotalTime = dLastCurrentTotalTime;
// ^ dLastCurrentTotalTime a été sauvegardé juste APRÈS la Diffusion (ligne 212)
```

**Ce que cela signifie :**
La phase **Final** fait avancer `current_total_time` pendant son déroulement (une seconde par itération), mais une fois terminée, ce compteur est **remis** à la valeur qu'il avait à la fin de la Diffusion. Le `current_total_time` affiché pour un step est donc :

```
total_time_step_N = carb_time_1 + diff_time_1 + ... + carb_time_N + diff_time_N
```

**Le `final_time` ne s'additionne PAS au temps global cumulé.** Il est uniquement retourné comme indicateur de «combien de secondes supplémentaires de diffusion seraient nécessaires pour atteindre le seuil `carbon_final`».

Pseudocode correct pour la reproduction :

```pseudocode
// Après la phase Diffusion, sauvegarder le temps global
last_total_time_after_diff = current_total_time   // ← Sauvegarder ICI

// Lancer la phase Final (current_total_time augmente pendant calcLayers)
final_time = calc_layers_final(carbon_final)

// Reset du temps global au niveau post-Diffusion (annuler la contribution de Final)
current_total_time = last_total_time_after_diff   // ← RESET CRITIQUE

// Calculer la profondeur sur l'état post-Final
effective_depth = calculate_effective_depth(eff_carbon)
```

### C. Initialisation des Snapshots avec Copie Stricte

Lors de la copie d'état entre phases (snapshots), CBPWin ne copie que les couches jusqu'à `current_layer_max`, pas les 2001 couches en entier. C'est une optimisation qui **ne change pas le résultat** (les couches au-delà sont encore au niveau du carbone initial), mais elle est à noter :

```cpp
// C++ EXACT — copie sélective
for (int idx = 0; idx <= m_iCurrentLayerMax; idx++) {
    m_pLayerArray[idx] = pOldLayerDiffusion[idx];
}
// Les couches > m_iCurrentLayerMax ne sont PAS copiées
// (elles ont déjà leur valeur correcte = carbone initial)
```

---

## 5. Comment obtenir la "Profondeur Efficace" ?

La profondeur efficace est la profondeur géométrique (en mm) à laquelle le carbone redescend à une valeur cible définie (ex: 0.36%).

Puisque nos couches sont discrètes (tous les 0.05mm), la valeur cible de 0.36% a toutes les chances de tomber *entre* deux couches. On utilise donc une interpolation mathématique.

1.  **Recherche de l'intervalle :**
    On parcourt `layer_array` en partant de la profondeur maximale vers la surface.
    Dès que l'on trouve une couche `i` où le carbone est $\ge 0.36\%$, c'est que le point cible est compris entre la couche `i` et la couche `i+1`.

2.  **Interpolation :**
    On récupère $C_n$ (le carbone à l'index `i`) et $C_{n+1}$ (le carbone à l'index `i+1`).
    La formule exacte de CBPWin pour calculer la profondeur géométrique est :
    
    ```pseudocode
    // Paramètres géométriques de la couche
    Si i > 1:
        base_profondeur = (i * 0.05) - 0.025
        delta_p = 0.05
    Sinon (interpolation près de la surface extrême):
        base_profondeur = 0.0
        delta_p = 0.025
        
    // Interpolation linéaire
    Profondeur Efficace (mm) = base_profondeur + (delta_p * ((C_n - Carbone_Cible) / (C_n - C_{n+1})))
    ```

## 6. Résumé pour une implémentation From Scratch (React / JS)

Si vous devez reproduire l'intégralité du module de simulation et de visualisation dans une application **React** moderne, voici l'architecture recommandée :

### 1. Le Moteur de Simulation (Le "Backend" côté client)
Ne mélangez pas les calculs lourds et le rendu UI. Créez un service métier (ex: `SimulationEngine.ts`).

1. **État Initial** : Créez un `Float64Array(2001)` et remplissez-le avec le Carbone Initial (ex: `0.20`). Note : `Float64Array` est beaucoup plus performant que les tableaux JS standards pour ce genre de calculs intensifs.
2. **Constantes** : Calculez `diffusion_factor` et `out_carbon` une seule fois.
3. **Boucle de Temps** : Créez une fonction `runPhase(duration_seconds)` qui contient les deux boucles imbriquées (la boucle `while (step_time < duration)` et la boucle spatiale sur les couches).
4. **Export** : À la fin du calcul, convertissez les `100` ou `200` premières valeurs du `Float64Array` (cela suffit largement pour afficher les premiers millimètres) en un format acceptable pour les graphiques : `[{ x: 0.0, y: 1.45 }, { x: 0.05, y: 1.20 }, ...]`.

> [!TIP]
> C'est l'essence même du **Mode Manuel prédictif** que nous avons codé en Python. On impose le nombre d'itérations "boucle de temps" dans l'algorithme, et à la fin, on rend simplement ce que contient le tableau à l'interface graphique.

## 7. Visualisation Graphique en React (Le Graphique Interactif)

L'interface graphique trace ces fameuses courbes en lisant directement les données du `layer_array` généré par le moteur. Pour reproduire le comportement dynamique de l'image en **React**, voici la stratégie avec une librairie comme **Recharts** ou **Chart.js** (recommandé pour ses performances sur les nombreux points) :

### A. Le Tracé de la Courbe Principale

1. **Les Données (`data`)** :
   Le state de votre composant contiendra le tableau de points calculé par le moteur :
   ```javascript
   const [chartData, setChartData] = useState([
     { depth: 0.00, carbon: 1.45 },
     { depth: 0.05, carbon: 1.20 },
     // ...
   ]);
   ```
2. **Dessin de la Courbe** :
   Passez ce tableau à la librairie cible en spécifiant que l'axe X est `depth` et l'axe Y est `carbon`. La librairie se chargera de tracer les segments reliant vos points distants de 0.05 mm, garantissant l'aspect de courbe lisse.

### B. Le Curseur Interactif (Lecture au Survol/Clic)

Pour reproduire la bulle flottante contenant la profondeur (`0.11 mm`) et le carbone (`0.25 %`) n'importe où sur l'axe X, y compris *entre* les points d'échantillonnage de 0.05 mm, vous devez implémenter un "Custom Tooltip" performant et de l'interpolation en temps réel.

1. **Capture de l'événement de survol (Hover)** :
   Utilisez l'événement `onMouseMove` sur le SVG du graphique (ou via le `Tooltip` par défaut si la librairie l'autorise). Récupérez la position `x` de la souris convertie mathématiquement en "Profondeur" (via l'échelle scalaire utilisée par le graphique). 
   `activeDepth = convertPixelToDepth(event.clientX); // ex: 0.11`

2. **Interpolation Linéaire (La "Règle de 3" en JS)** :
   Écrivez une fonction utilitaire pour trouver la valeur Y exacte pour un X arbitraire donné, à partir de votre state `chartData` :
   
   ```javascript
   function getInterpolatedCarbon(targetDepth, data) {
      // 1. Trouver les index qui entourent notre profondeur cible
      // Si on cible 0.11, on veut l'index de 0.10 (gauche) et 0.15 (droit)
      // Comme l'espacement est toujours de 0.05, c'est très rapide :
      const indexGauche = Math.floor(targetDepth / 0.05);
      const indexDroit = indexGauche + 1;
      
      // Sécurités
      if (indexDroit >= data.length) return data[data.length - 1].carbon;
      if (indexGauche < 0) return data[0].carbon;
      
      const ptGauche = data[indexGauche];
      const ptDroit = data[indexDroit];
      
      // 2. Calcul du ratio de distance (entre 0 et 1)
      const ratio = (targetDepth - ptGauche.depth) / (ptDroit.depth - ptGauche.depth);
      
      // 3. Interpolation Linéaire sur l'axe Y
      const interpolatedCarbon = ptGauche.carbon + (ratio * (ptDroit.carbon - ptGauche.carbon));
      
      return interpolatedCarbon;
   }
   ```

3. **Le rendu UI du Tooltip** :
   Dans un composant React externe ou un overlay positionné dynamiquement (`position: absolute; left: ${mouseX}px; top: ${mouseY}px`), affichez les résultats.
   
   ```jsx
   const CustomTooltip = ({ activeDepth, chartData }) => {
       const exactCarbon = getInterpolatedCarbon(activeDepth, chartData);
       
       return (
           <div className="tooltip-bulle">
               <div>{exactCarbon.toFixed(2)} %</div>
               <div>{activeDepth.toFixed(2)} mm</div>
           </div>
       );
   };
   ```

## 8. Interactivité des Étapes (Synchronisation Liste / Graphique)

Dans l'application, lorsque vous cliquez sur une étape spécifique (par exemple "Step 2 | Diffusion") dans la liste des résultats, le graphique se met à jour pour afficher *uniquement* la courbe correspondant à la fin de cette étape précise.

Voici comment reproduire cette logique d'état et de synchronisation dans une architecture **React**.

### A. La Sauvegarde des États Intermédiaires (Sous-étapes)

Pendant que le moteur de simulation tourne, il ne prend pas juste une "photo" par grande étape globale. Il dresse un historique détaillé **sous-étape par sous-étape** (Boost d'un côté, Diffusion de l'autre).

Dans la grille de l'application, une cellule "Cémentation" et une cellule "Diffusion" sont deux entités visuelles distinctes. Cliquer sur l'une ou l'autre doit afficher l'état exact du profil à la fin de cette phase précise.

Dans votre service de simulation, construisez un objet "Historique" linéaire où *chaque* phase (Boost ou Diff) possède sa propre entrée indépendante avec une copie de son tableau de carbone (`layer_array`) à l'instant `T` :

```javascript
// Côté Moteur (SimulationEngine)
const history = [];

// ... boucle sur les étapes (steps) ...
for (let i = 0; i < recipe.length; i++) {
   // 1. PHASE DE CÉMENTATION (BOOST)
   runCarburizingPhase(recipe[i].carb_time);
   
   // On sauvegarde LA PHOTO EXACTE de la fin de cémentation
   history.push({
      stepId: `step-${i+1}-boost`, // Identifiant unique pour le composant React
      stepNumber: i + 1,
      phaseName: "Cémentation",
      duration: recipe[i].carb_time,
      surfaceCarbon: layer_array[0],
      // On clone le tableau pour figer cette courbe dans le temps
      chartData: convertArrayToChartPoints(layer_array.slice(0, 100))
   });

   // 2. PHASE DE DIFFUSION
   runDiffusionPhase(recipe[i].diff_time);
   
   // On sauvegarde LA PHOTO EXACTE de la fin de diffusion (la courbe s'est aplatie/propagée)
   history.push({
      stepId: `step-${i+1}-diff`, // Identifiant unique différent
      stepNumber: i + 1,
      phaseName: "Diffusion",
      duration: recipe[i].diff_time,
      surfaceCarbon: layer_array[0],
      // On clone à nouveau le tableau qui a évolué
      chartData: convertArrayToChartPoints(layer_array.slice(0, 100))
   });
}

return history; // Un tableau plat de [Boost1, Diff1, Boost2, Diff2...]
```

### B. Le State React : La Cellule Sélectionnée

Côté interface utilisateur (UI), votre grille (le tableau de la recette) doit rendre **chaque cellule temporelle** (la case "293s" pour le Boost, la case "137s" pour la Diff) cliquable individuellement.

L'état global (`state`) retient quelle cellule/sous-étape est sélectionnée :

```jsx
// Côté Composant React (Exemple de Grid)
import React, { useState } from 'react';
import CarbonChart from './CarbonChart';

const SimulationDashboard = ({ simulationHistory }) => {
    // Par défaut, quand rien n'est sélectionné (au chargement), 
    // on affiche le RÉSULTAT FINAL (la toute dernière étape enregistrée)
    const finalState = simulationHistory[simulationHistory.length - 1];
    const [selectedPhase, setSelectedPhase] = useState(finalState);

    return (
        <div className="dashboard-layout">
            {/* GRILLE (Tableau des recettes) */}
            <table>
              <tbody>
                {/* Rendu des lignes pour chaque Step (1, 2, 3...) */}
                <tr className="step-row">
                   <td>Step 1</td>
                   {/* Cellule Cémentation */}
                   <td 
                     onClick={() => setSelectedPhase(simulationHistory.find(h => h.stepId === 'step-1-boost'))}
                     className={selectedPhase?.stepId === 'step-1-boost' ? 'active-cell' : ''}>
                     293s (Boost)
                   </td>
                   {/* Cellule Diffusion */}
                   <td 
                     onClick={() => setSelectedPhase(simulationHistory.find(h => h.stepId === 'step-1-diff'))}
                     className={selectedPhase?.stepId === 'step-1-diff' ? 'active-cell' : ''}>
                     137s (Diff)
                   </td>
                </tr>
              </tbody>
            </table>

            {/* GRAPHIQUE (Dessine la courbe exacte de la cellule cliquée) */}
            <div className="chart-container">
                <h2>Profil à l'issue de : {selectedPhase.stepNumber} - {selectedPhase.phaseName}</h2>
                <CarbonChart data={selectedPhase.chartData} />
            </div>
        </div>
    );
};
```

### C. Le Résumé Visuel

Puisque `selectedPhase.chartData` de la cellule "Cémentation" contient une concentration de surface très élevée avec une pente raide, et que la cellule "Diffusion" possède son propre `chartData` avec une surface plus basse et une courbe plus étalée, le simple fait de changer le `state React` (`setSelectedPhase`) en cliquant d'une case à l'autre va ordonner à `CarbonChart` de redessiner instantanément sa ligne, donnant cette interactivité immédiate propre au logiciel d'origine.
Cette mécanique garantit un couplage idéal : le calcul lourd de la simulation n'est fait **qu'une seule fois**. Le basculement entre les vues n'est qu'un changement de variable au sein de l'interface graphique, offrant ce rendu temps-réel et immédiat que vous voyez sur CBPWin.
