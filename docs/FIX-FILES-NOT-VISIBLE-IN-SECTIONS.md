# Fix: Fichiers non visibles dans les sections après upload

## Problème

Les fichiers uploadés dans les sections **Micrography** et **Control Location** du formulaire Trial apparaissaient bien dans le **Photo Manager** (utilisé pour générer les rapports) mais n'étaient plus visibles dans leurs sections de fichiers respectives.

### Exemple
- Upload de fichiers pour 7 résultats avec 3 échantillons chacun
- Les fichiers apparaissent dans le Photo Manager
- Les fichiers n'apparaissent pas dans les sections Micrography et Control Location

## Cause racine

Le problème venait d'un décalage entre:

1. **L'upload des fichiers**: Le composant `FileUploader` n'envoyait PAS les métadonnées `sampleNumber` et `resultIndex` au backend
2. **Le chargement des fichiers**: Les hooks `useMultiViewFileSectionState` et `useFileSectionState` demandaient au backend de filtrer par `sampleNumber` et `resultIndex`

### Flux détaillé

#### Upload (AVANT le fix)
```
FileUploader (client)
  ↓ Envoie uniquement: nodeId, category, subcategory
Backend (FileMetadataService)
  ↓ Essaie d'extraire sampleNumber et resultIndex depuis subcategory
  ↓ Stocke dans file.context JSON: { sample_number: X, result_index: Y }
```

#### Chargement (AVANT le fix)
```
useMultiViewFileSectionState (client)
  ↓ Demande: nodeId, category, sampleNumber=0, resultIndex=0
Backend (getAllFilesByNode)
  ↓ Filtre WHERE context.sample_number = 0 AND context.result_index = 0
  ↓ Retourne: AUCUN fichier (car context contient des valeurs différentes)
```

### Extraction depuis subcategory

Le backend tentait d'extraire les métadonnées depuis la subcategory avec ce pattern:
```javascript
// Exemple de subcategory: "result-0-sample-1-x500"
const match = subcategory.match(/result-(\d+)-sample-(\d+)/);
// Extrait: resultIndex=0, sampleNumber=1
```

Mais cette extraction était:
- Fragile (dépendante du format exact de la string)
- Inconsistante (pouvait échouer si le format changeait)
- Tardive (appliquée seulement lors de l'association, pas lors de l'upload)

## Solution

### Modifications apportées

#### 1. FileUploader.jsx
**Ajout de nouvelles props:**
```jsx
const FileUploader = ({
  // ... props existantes
  sampleNumber, // NOUVEAU
  resultIndex   // NOUVEAU
}) => {
```

**Transmission au hook:**
```jsx
const fileUploader = useFileUploader({
  // ... autres options
  sampleNumber,
  resultIndex
});
```

**Transmission lors de l'upload:**
```jsx
onClick={() => handleUpload(nodeId, category, subcategory, fileDescriptions, sampleNumber, resultIndex)}
```

#### 2. useFileUploader.js
**Ajout aux paramètres:**
```javascript
const useFileUploader = ({
  // ... paramètres existants
  sampleNumber,
  resultIndex
}) => {
```

**Transmission au hook d'upload:**
```javascript
const fileUpload = useFileUpload(
  files, 
  setFiles, 
  setInternalUploadedFiles, 
  onFilesUploaded, 
  standbyMode,
  sampleNumber,  // NOUVEAU
  resultIndex    // NOUVEAU
);
```

#### 3. useFileUpload.js
**Ajout aux paramètres:**
```javascript
const useFileUpload = (
  files, 
  setFiles, 
  setInternalUploadedFiles, 
  onFilesUploaded, 
  standbyMode,
  sampleNumber,  // NOUVEAU
  resultIndex    // NOUVEAU
) => {
```

**Ajout au FormData:**
```javascript
const handleUpload = async (nodeId, category, subcategory, fileDescriptions, uploadSampleNumber, uploadResultIndex) => {
  // ... code existant
  
  // NOUVEAU: Ajouter les métadonnées de contexte
  const finalSampleNumber = uploadSampleNumber !== undefined ? uploadSampleNumber : sampleNumber;
  const finalResultIndex = uploadResultIndex !== undefined ? uploadResultIndex : resultIndex;
  
  if (finalSampleNumber !== undefined && finalSampleNumber !== null) {
    formData.append('sampleNumber', finalSampleNumber);
  }
  if (finalResultIndex !== undefined && finalResultIndex !== null) {
    formData.append('resultIndex', finalResultIndex);
  }
};
```

**Même chose pour uploadPendingFiles:**
```javascript
const uploadPendingFiles = async (nodeId, category, subcategory, pendingFiles) => {
  // ... code existant
  
  if (sampleNumber !== undefined && sampleNumber !== null) {
    formData.append('sampleNumber', sampleNumber);
  }
  if (resultIndex !== undefined && resultIndex !== null) {
    formData.append('resultIndex', resultIndex);
  }
};
```

#### 4. MicrographsSection.jsx
**Transmission au FileUploader:**
```jsx
<FileUploader
  category="micrographs"
  subcategory={buildSubcategory(view.id)}
  nodeId={trialNodeId}
  // ... autres props
  sampleNumber={sampleIndex}  // NOUVEAU
  resultIndex={resultIndex}   // NOUVEAU
/>
```

#### 5. ControlLocationSection.jsx
**Transmission au FileUploader:**
```jsx
<FileUploader
  category="control-location"
  subcategory={subcategory}
  nodeId={trialNodeId}
  // ... autres props
  sampleNumber={sampleIndex}  // NOUVEAU
  resultIndex={resultIndex}   // NOUVEAU
/>
```

## Backend (déjà correct)

Le backend gérait déjà correctement ces métadonnées:

### fileController.js
```javascript
const uploadFiles = async (req, res) => {
  const { nodeId, category, subcategory, sampleNumber, resultIndex } = req.body;
  // Déjà prêt à recevoir ces paramètres ✓
};
```

### fileService.js
```javascript
const saveUploadedFiles = async (files, data, req) => {
  const { nodeId, category, subcategory, sampleNumber, resultIndex } = data;
  
  // Stockage dans le contexte JSON
  context = await fileMetadataService.buildFileContext({
    category,
    subcategory,
    sampleNumber,  // ✓
    resultIndex    // ✓
  }, parentNode);
};
```

### FileMetadataService.js
```javascript
async buildFileContext(params, parentNode) {
  const { category, subcategory, sampleNumber, resultIndex } = params;
  
  // Priorité aux valeurs explicites, sinon extraction depuis subcategory
  let finalSampleNumber = sampleNumber;
  let finalResultIndex = resultIndex;
  
  if (!finalSampleNumber && subcategory) {
    const match = subcategory.match(/result-(\d+)-sample-(\d+)/);
    if (match) {
      finalResultIndex = finalResultIndex || parseInt(match[1]);
      finalSampleNumber = finalSampleNumber || parseInt(match[2]);
    }
  }
  
  return {
    // ...
    sample_number: finalSampleNumber,
    result_index: finalResultIndex,
    // ...
  };
}
```

### getAllFilesByNode (filtrage)
```javascript
const getAllFilesByNode = async (options) => {
  const { nodeId, category, subcategory, sampleNumber, resultIndex } = options;
  
  // Filtrage par métadonnées JSON
  if (sampleNumber !== undefined || resultIndex !== undefined) {
    const contextConditions = [];
    
    if (sampleNumber !== undefined) {
      contextConditions.push(
        sequelize.where(
          sequelize.json('context.sample_number'),
          parseInt(sampleNumber)
        )
      );
    }
    
    if (resultIndex !== undefined) {
      contextConditions.push(
        sequelize.where(
          sequelize.json('context.result_index'),
          parseInt(resultIndex)
        )
      );
    }
    
    fileConditions[Op.and] = contextConditions;
  }
};
```

## Résultat

### Avant le fix
```
Upload → Backend extrait sampleNumber/resultIndex depuis subcategory (fragile)
       ↓
Stockage dans DB: context.sample_number = X, context.result_index = Y
       ↓
Chargement → Backend filtre par sampleNumber/resultIndex fournis par client
       ↓
AUCUN fichier retourné (pas de correspondance exacte)
```

### Après le fix
```
Upload → Client envoie explicitement sampleNumber=0, resultIndex=0
       ↓
Stockage dans DB: context.sample_number = 0, context.result_index = 0
       ↓
Chargement → Backend filtre par sampleNumber=0, resultIndex=0
       ↓
Fichiers retournés correctement ✓
```

## Test de régression

Pour tester que le fix fonctionne:

1. Créer ou ouvrir un trial avec plusieurs résultats
2. Dans chaque résultat, ajouter plusieurs échantillons
3. Uploader des fichiers dans les sections Micrography et Control Location
4. Sauvegarder le trial
5. Rouvrir le trial
6. Vérifier que les fichiers apparaissent bien dans:
   - ✓ Les sections de fichiers (Micrography, Control Location)
   - ✓ Le Photo Manager

## Notes importantes

### Compatibilité ascendante

Le code reste compatible avec les fichiers déjà uploadés grâce à:

1. **Extraction de secours** dans FileMetadataService:
   ```javascript
   if (!finalSampleNumber && subcategory) {
     const match = subcategory.match(/result-(\d+)-sample-(\d+)/);
     // ...
   }
   ```

2. **Filtrage optionnel** dans getAllFilesByNode:
   ```javascript
   if (sampleNumber !== undefined || resultIndex !== undefined) {
     // Applique le filtre uniquement si fourni
   }
   ```

### Sections non affectées

Les autres sections utilisant FileUploader ne sont PAS affectées car elles ne nécessitent pas de métadonnées structurées:
- FurnaceReportSection
- DatapaqSection
- LoadDesignSection
- PhotosSection (parts)
- DocumentsSection (orders, parts)

Ces sections peuvent continuer à fonctionner sans passer `sampleNumber` et `resultIndex`.

## Date
16 janvier 2026
