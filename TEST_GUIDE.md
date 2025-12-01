# 🧪 Guide de Test - Nouveau Système de Fichiers

## 🔄 REDÉMARRER LE SERVEUR

**IMPORTANT** : Le serveur doit être redémarré pour que les modifications prennent effet !

```bash
# Arrêter le serveur (Ctrl+C dans le terminal serveur)
# Puis redémarrer :
cd server
npm start
# ou
node server.js
```

---

## ✅ Test 1 : Upload Simple avec Description

### Via Postman / API

```http
POST http://localhost:5001/api/files/upload
Content-Type: multipart/form-data

nodeId: 3300 (ID de la pièce ou trial)
category: photos
subcategory: front
description: Photo de face - pièce après traitement thermique
files: [votre fichier]
```

### Résultat attendu dans la BDD

```sql
SELECT 
    f.node_id,
    f.original_name,
    f.storage_key,          -- ✅ Doit être rempli
    f.checksum,             -- ✅ Doit être rempli
    f.context,              -- ✅ Doit être un JSON
    f.uploaded_by,          -- Peut être NULL si pas authentifié
    n.description           -- ✅ Doit contenir votre description personnalisée
FROM files f
JOIN nodes n ON f.node_id = n.id
WHERE f.node_id = (SELECT MAX(node_id) FROM files);
```

**Exemple de résultat attendu :**

```
storage_key: part/3300/part_photo/a3f5c9d1-unnamed.jpg
checksum: 956a65ee4a20c39552b0b1421ec9c0182883f45d74480ae06f64838e63518538
context: {
  "entity_type": "part",
  "entity_id": 3300,
  "file_type": "part_photo",
  "file_subtype": "front",
  "parent_node_id": 3300,
  "upload_source": "web_ui"
}
description: "Photo de face - pièce après traitement thermique"
```

---

## ✅ Test 2 : Upload Frontend

### Modifications Frontend (optionnel pour l'instant)

Si vous utilisez le composant `FileUploader`, vous pouvez ajouter un champ description :

```jsx
// Dans votre formulaire d'upload
<Form.Group>
  <Form.Label>Description (optionnelle)</Form.Label>
  <Form.Control
    type="text"
    placeholder="Ex: Photo de face après traitement"
    value={fileDescription}
    onChange={(e) => setFileDescription(e.target.value)}
  />
</Form.Group>

<FileUploader
  category="photos"
  subcategory="front"
  nodeId={partId}
  // Passer la description via onFilesUploaded
  onFilesUploaded={(files) => {
    // Le backend accepte maintenant 'description' dans FormData
  }}
/>
```

### Modification du service d'upload frontend

```javascript
// Dans client/src/services/fileService.js (ou là où vous faites l'upload)

uploadFiles: async (formData, onUploadProgress) => {
  // Le formData peut maintenant contenir :
  // - files
  // - nodeId
  // - category
  // - subcategory
  // - description  ← NOUVEAU
  
  const response = await api.post(`/files/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress
  });
  
  return response;
}
```

---

## ✅ Test 3 : Vérifier la Structure Physique

```bash
# Les fichiers doivent maintenant être organisés par type d'entité
ls -R server/uploads/

# Structure attendue :
# uploads/
# ├── part/
# │   └── 3300/
# │       └── part_photo/
# │           └── a3f5c9d1-unnamed.jpg
# └── trial/
#     └── 456/
#         ├── micrograph/
#         └── furnace_report/
```

---

## ✅ Test 4 : Récupération des Fichiers avec Description

### API Endpoint (inchangé)

```http
GET http://localhost:5001/api/files/node/3300
```

### Résultat attendu (avec description)

```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": 3335,
        "name": "unnamed.jpg",
        "size": 862274,
        "mimeType": "image/jpeg",
        "viewPath": "/api/files/3335",
        "downloadPath": "/api/files/download/3335",
        "description": "Photo de face - pièce après traitement thermique",  ← NOUVEAU
        "storageKey": "part/3300/part_photo/a3f5c9d1-unnamed.jpg",
        "context": { ... }
      }
    ]
  }
}
```

---

## ✅ Test 5 : Upload Multiple avec Descriptions Différentes

**Note** : Pour des descriptions différentes par fichier, il faudra uploader les fichiers un par un.

```javascript
// Upload fichier 1
const formData1 = new FormData();
formData1.append('files', file1);
formData1.append('nodeId', partId);
formData1.append('category', 'photos');
formData1.append('subcategory', 'front');
formData1.append('description', 'Vue de face - avant traitement');
await fileService.uploadFiles(formData1);

// Upload fichier 2
const formData2 = new FormData();
formData2.append('files', file2);
formData2.append('nodeId', partId);
formData2.append('category', 'photos');
formData2.append('subcategory', 'profile');
formData2.append('description', 'Vue de profil - après traitement');
await fileService.uploadFiles(formData2);
```

**Alternative** : Upload batch avec description commune

```javascript
const formData = new FormData();
files.forEach(file => formData.append('files', file));
formData.append('nodeId', partId);
formData.append('category', 'photos');
formData.append('subcategory', 'front');
formData.append('description', 'Photos série A - échantillon #1');
await fileService.uploadFiles(formData);
```

---

## 🔍 Requêtes SQL Utiles

### Voir tous les fichiers avec leur description

```sql
SELECT 
    n.id,
    n.name as filename,
    n.description,
    f.storage_key,
    f.context->>'$.file_type' as type,
    f.context->>'$.entity_type' as entity,
    f.uploaded_at
FROM nodes n
JOIN files f ON n.id = f.node_id
WHERE n.type = 'file'
ORDER BY f.uploaded_at DESC
LIMIT 20;
```

### Chercher des fichiers par description

```sql
SELECT 
    n.id,
    n.name,
    n.description,
    f.storage_key
FROM nodes n
JOIN files f ON n.id = f.node_id
WHERE n.description LIKE '%traitement thermique%'
  AND n.type = 'file';
```

### Fichiers sans description personnalisée

```sql
SELECT 
    n.id,
    n.name,
    n.description
FROM nodes n
JOIN files f ON n.id = f.node_id
WHERE n.type = 'file'
  AND (n.description LIKE 'File uploaded%' OR n.description LIKE 'Fichier %')
ORDER BY f.uploaded_at DESC;
```

---

## 🐛 Debug

### Si storage_key est toujours NULL

```bash
# 1. Vérifier que le serveur a bien redémarré
ps aux | grep node

# 2. Vérifier les logs du serveur
tail -f server/logs/application.log

# 3. Vérifier que les services sont bien importés
grep -n "fileStorageService" server/services/fileService.js
grep -n "fileMetadataService" server/services/fileService.js
```

### Si description n'apparaît pas

```sql
-- Vérifier la colonne description dans nodes
SELECT n.description 
FROM nodes n 
WHERE n.id = 3335;

-- Vérifier que le JOIN fonctionne
SELECT n.*, f.* 
FROM nodes n 
JOIN files f ON n.id = f.node_id 
WHERE f.node_id = 3335;
```

---

## 📊 Tableau de Comparaison

| Champ | Avant | Après | Notes |
|-------|-------|-------|-------|
| `file_path` | `uploads/test/...` | `uploads/part/3300/...` | Structure organisée |
| `storage_key` | NULL | `part/3300/part_photo/...` | ✅ Immuable |
| `checksum` | NULL | SHA-256 hash | ✅ Intégrité |
| `context` | NULL | JSON avec métadonnées | ✅ Flexible |
| `nodes.description` | "File uploaded as..." | Description personnalisée | ✅ Utile |
| `uploaded_by` | NULL | User ID | ✅ Traçabilité |

---

## ✅ Checklist de Validation

- [ ] Serveur redémarré
- [ ] Upload d'un fichier réussi
- [ ] `storage_key` rempli
- [ ] `checksum` rempli  
- [ ] `context` est un JSON valide
- [ ] Description personnalisée enregistrée dans `nodes.description`
- [ ] Fichier physique dans la nouvelle structure (`uploads/part/3300/...`)
- [ ] Téléchargement du fichier fonctionne
- [ ] Images s'affichent dans les rapports PDF

---

**Prêt à tester ! 🚀**

Redémarrez le serveur et uploadez un nouveau fichier avec une description personnalisée.
