# 📖 Guide d'Utilisation - Nouveau Système de Fichiers

## 🎯 Pour les Développeurs

### Import des services

```javascript
// Ancien système (toujours fonctionnel)
const fileService = require('./services/fileService');

// Nouveau système (recommandé)
const fileServiceV2 = require('./services/fileServiceV2');
const fileStorageService = require('./services/storage/FileStorageService');
const fileMetadataService = require('./services/storage/FileMetadataService');
```

### Upload de fichiers

```javascript
// Nouveau système
const uploadResult = await fileServiceV2.uploadFiles(
  req.files, // Fichiers multer
  {
    nodeId: 123,           // ID du nœud parent (obligatoire)
    category: 'micrograph', // Type de fichier
    subcategory: 'x50',     // Sous-type
    sampleNumber: 1,        // Optionnel : numéro d'échantillon
    resultIndex: 0,         // Optionnel : index de résultat
    userId: req.user.id     // Optionnel : ID utilisateur
  }
);

// Résultat
console.log(uploadResult);
// {
//   success: true,
//   files: [
//     {
//       id: 456,
//       name: 'sample-1-x50.jpg',
//       storageKey: 'trial/123/micrograph/a3f5c9d1-sample-1-x50.jpg',
//       size: 1234567,
//       mimeType: 'image/jpeg',
//       context: { ... },
//       checksum: '...'
//     }
//   ]
// }
```

### Récupération de fichiers par contexte

```javascript
// Par type d'entité et type de fichier
const result = await fileServiceV2.getFilesByContext({
  entityType: 'trial',
  entityId: 123,
  fileType: 'micrograph',
  fileSubtype: 'x50'
});

// Par échantillon et résultat
const result = await fileServiceV2.getFilesByContext({
  entityType: 'trial',
  entityId: 123,
  fileType: 'micrograph',
  sampleNumber: 1,
  resultIndex: 0,
  includeMetadata: true  // Inclure les métadonnées additionnelles
});

// Compatibilité avec ancien système
const result = await fileServiceV2.getAllFilesByNode({
  nodeId: 123,
  category: 'micrographs-result-0',  // Sera normalisé automatiquement
  subcategory: 'x50'
});

console.log(result);
// {
//   files: [
//     {
//       id: 456,
//       name: 'sample-1-x50.jpg',
//       storageKey: 'trial/123/micrograph/...',
//       viewPath: '/api/files/456',
//       downloadPath: '/api/files/download/456',
//       context: { ... },
//       metadata: { ... }  // Si includeMetadata = true
//     }
//   ],
//   total: 1
// }
```

### Téléchargement de fichier

```javascript
const fileData = await fileServiceV2.downloadFile(456);

res.download(fileData.path, fileData.originalName, {
  headers: {
    'Content-Type': fileData.mimeType
  }
});
```

### Suppression de fichier

```javascript
const deleted = await fileServiceV2.deleteFile(456);
// Supprime automatiquement:
// - Le fichier physique
// - L'enregistrement BDD
// - Les relations closure
// - Les métadonnées
// - Nettoie les dossiers vides
```

### Ajout de métadonnées personnalisées

```javascript
// Ajouter une métadonnée
await fileMetadataService.addMetadata(
  456,              // fileNodeId
  'review_status',  // key
  'approved',       // value
  'string'          // type: string, number, boolean, json
);

// Récupérer toutes les métadonnées
const metadata = await fileMetadataService.getMetadata(456);
// { review_status: 'approved', ... }

// Récupérer une métadonnée spécifique
const status = await fileMetadataService.getMetadataValue(456, 'review_status');
// 'approved'

// Rechercher des fichiers par métadonnée
const fileIds = await fileMetadataService.findFilesByMetadata('review_status', 'approved');
// [456, 789, ...]
```

---

## 🔧 Pour les Administrateurs Système

### Surveillance de l'espace disque

```javascript
// Calculer l'espace utilisé par une entité
const sizeBytes = await fileStorageService.getEntityStorageSize('trial', 123);
const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
console.log(`Trial 123 uses ${sizeMB} MB`);

// Lister tous les fichiers d'une entité
const storageKeys = await fileStorageService.listEntityFiles('trial', 123);
console.log(`Trial 123 has ${storageKeys.length} files`);

// Lister par type
const micrographs = await fileStorageService.listEntityFiles('trial', 123, 'micrograph');
```

### Nettoyage des dossiers vides

```javascript
// Automatique lors de la suppression
await fileStorageService.deleteFile(storageKey);
// Les dossiers vides sont supprimés automatiquement

// Manuel
await fileStorageService.cleanupEmptyDirectories('/path/to/check');
```

### Vérification d'intégrité

```javascript
// Vérifier qu'un fichier existe physiquement
const exists = await fileStorageService.fileExists(storageKey);

if (!exists) {
  console.error('File missing!', storageKey);
}

// Générer checksum
const checksum = await fileStorageService.generateChecksum(storageKey);

// Comparer avec BDD
const fileRecord = await file.findOne({ where: { storage_key: storageKey } });
if (fileRecord.checksum !== checksum) {
  console.error('Checksum mismatch!', storageKey);
}
```

---

## 📊 Requêtes SQL Utiles

### Statistiques par type de fichier

```sql
SELECT 
  context->>'$.file_type' as file_type,
  COUNT(*) as count,
  ROUND(SUM(size) / 1024 / 1024, 2) as total_mb
FROM files
WHERE storage_key IS NOT NULL
GROUP BY file_type
ORDER BY count DESC;
```

### Fichiers uploadés aujourd'hui

```sql
SELECT 
  node_id,
  original_name,
  storage_key,
  context->>'$.entity_type' as entity_type,
  context->>'$.file_type' as file_type,
  size,
  uploaded_at
FROM files
WHERE DATE(uploaded_at) = CURDATE()
ORDER BY uploaded_at DESC;
```

### Top 10 utilisateurs uploadant le plus

```sql
SELECT 
  u.username,
  COUNT(f.node_id) as file_count,
  ROUND(SUM(f.size) / 1024 / 1024, 2) as total_mb
FROM files f
JOIN users u ON f.uploaded_by = u.id
WHERE f.uploaded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.username
ORDER BY file_count DESC
LIMIT 10;
```

### Fichiers sans contexte (à migrer)

```sql
SELECT 
  node_id,
  original_name,
  category,
  subcategory,
  file_path
FROM files
WHERE storage_key IS NULL
LIMIT 20;
```

### Vérifier les contexts JSON invalides

```sql
SELECT 
  node_id,
  original_name,
  context
FROM files
WHERE storage_key IS NOT NULL
  AND JSON_VALID(context) = 0;
```

---

## 🎨 Exemples d'utilisation par cas d'usage

### Cas 1 : Upload de micrographies avec échantillons

```javascript
// Upload de photos d'échantillon 1, résultat 0, zoom x50
await fileServiceV2.uploadFiles(req.files, {
  nodeId: trialId,
  category: 'micrograph',
  subcategory: 'x50',
  sampleNumber: 1,
  resultIndex: 0,
  userId: req.user.id
});

// Récupération pour le rapport
const files = await fileServiceV2.getFilesByContext({
  entityType: 'trial',
  entityId: trialId,
  fileType: 'micrograph',
  fileSubtype: 'x50',
  sampleNumber: 1,
  resultIndex: 0
});
```

### Cas 2 : Upload de photos de pièce

```javascript
// Upload de photo de face
await fileServiceV2.uploadFiles(req.files, {
  nodeId: partId,
  category: 'part_photo',
  subcategory: 'front',
  userId: req.user.id
});

// Récupération
const photos = await fileServiceV2.getFilesByContext({
  entityType: 'part',
  entityId: partId,
  fileType: 'part_photo'
});
```

### Cas 3 : Upload de documents généraux

```javascript
// Upload de documents de commande
await fileServiceV2.uploadFiles(req.files, {
  nodeId: trialRequestId,
  category: 'document',
  subcategory: 'all_documents',
  userId: req.user.id
});
```

### Cas 4 : Récupération pour génération de rapport PDF

```javascript
// Dans reportService.js
const micrographs = await fileServiceV2.getFilesByContext({
  entityType: 'trial',
  entityId: testId,
  fileType: 'micrograph'
});

// Grouper par zoom
const byZoom = micrographs.files.reduce((acc, file) => {
  const zoom = file.context.file_subtype || 'other';
  if (!acc[zoom]) acc[zoom] = [];
  acc[zoom].push({
    ...file,
    viewPath: `http://localhost:5001${file.viewPath}`
  });
  return acc;
}, {});

// Utiliser dans le template PDF
const reportData = {
  micrographs_x50: byZoom.x50 || [],
  micrographs_x500: byZoom.x500 || [],
  micrographs_x1000: byZoom.x1000 || [],
  // ...
};
```

---

## ⚡ Bonnes Pratiques

### 1. Toujours utiliser storage_key

```javascript
// ❌ Mauvais
const filePath = fileRecord.file_path;

// ✅ Bon
const storageKey = fileRecord.storage_key;
const filePath = fileStorageService.getPhysicalPath(storageKey);
```

### 2. Utiliser le contexte pour les requêtes

```javascript
// ❌ Mauvais (catégories hard-codées)
const files = await file.findAll({
  where: { category: 'micrographs-result-0' }
});

// ✅ Bon (contexte flexible)
const files = await fileServiceV2.getFilesByContext({
  entityType: 'trial',
  entityId: 123,
  fileType: 'micrograph',
  resultIndex: 0
});
```

### 3. Ajouter des métadonnées pour info additionnelle

```javascript
// Marquer un fichier comme important
await fileMetadataService.addMetadata(fileId, 'important', true, 'boolean');

// Ajouter un commentaire
await fileMetadataService.addMetadata(fileId, 'comment', 'Vérifier qualité', 'string');

// Ajouter des données complexes
await fileMetadataService.addMetadata(
  fileId, 
  'analysis_results', 
  { grain_size: 25.5, hardness: 450 },
  'json'
);
```

### 4. Gérer les erreurs proprement

```javascript
try {
  const result = await fileServiceV2.uploadFiles(files, params);
} catch (error) {
  if (error instanceof NotFoundError) {
    // Nœud parent introuvable
    return res.status(404).json({ error: error.message });
  } else if (error instanceof ValidationError) {
    // Paramètres invalides
    return res.status(400).json({ error: error.message });
  } else {
    // Erreur serveur
    logger.error('Upload failed', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
```

---

## 🔮 Migration Future vers Cloud Storage

Le système est conçu pour faciliter la migration vers S3/Azure Blob :

```javascript
// Créer un nouveau service qui étend FileStorageService
class S3FileStorageService extends FileStorageService {
  async saveFile(uploadedFile, storageKey) {
    // Upload vers S3
    const s3Params = {
      Bucket: process.env.S3_BUCKET,
      Key: storageKey,
      Body: fs.createReadStream(uploadedFile.path)
    };
    
    await s3.upload(s3Params).promise();
    
    // Retourner l'URL S3
    return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${storageKey}`;
  }
  
  async deleteFile(storageKey) {
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET,
      Key: storageKey
    }).promise();
  }
  
  getPhysicalPath(storageKey) {
    return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${storageKey}`;
  }
}

// Remplacer dans le code
const fileStorageService = new S3FileStorageService();
```

**Aucune autre modification nécessaire !** 🎉
