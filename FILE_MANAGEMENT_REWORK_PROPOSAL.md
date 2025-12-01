# 📁 Proposition de Refactorisation du Système de Gestion de Fichiers

## 🎯 Objectifs
- ✅ Système robuste, prévisible et maintenable
- ✅ Indépendance entre paths physiques et logiques
- ✅ Support de métadonnées riches et extensibles
- ✅ Gestion cohérente des fichiers (création/modification/suppression)
- ✅ Migration progressive sans rupture

---

## 📊 NOUVEAU SCHÉMA DE BASE DE DONNÉES

### **1. Table `files` - Refactorisée**

```sql
CREATE TABLE files (
    -- Identifiant unique
    node_id INT PRIMARY KEY,
    
    -- Informations de base
    original_name VARCHAR(255) NOT NULL,
    storage_key VARCHAR(500) NOT NULL UNIQUE,  -- ⭐ NOUVEAU : Clé de stockage immuable
    size BIGINT,
    mime_type VARCHAR(100),
    checksum VARCHAR(64),
    
    -- Métadonnées de contexte (JSON flexible)
    context JSON,  -- ⭐ NOUVEAU : Contexte du fichier
    /*
    Exemple de context JSON:
    {
        "entity_type": "trial",       // Type d'entité parente
        "entity_id": 123,              // ID de l'entité parente
        "file_type": "micrograph",     // Type de fichier métier
        "file_subtype": "x50",         // Sous-type
        "sample_number": 1,            // Informations contextuelles
        "result_index": 0,
        "custom_tags": ["important", "review"]
    }
    */
    
    -- Versioning (pour future évolution)
    version INT DEFAULT 1,
    is_latest BOOLEAN DEFAULT TRUE,
    previous_version_id INT,
    
    -- Timestamps
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    uploaded_by INT,
    
    -- Contraintes
    FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_storage_key (storage_key),
    INDEX idx_entity_context (context->'$.entity_type', context->'$.entity_id'),
    INDEX idx_file_type (context->'$.file_type')
);
```

### **2. Table `file_metadata` - Métadonnées extensibles**

```sql
CREATE TABLE file_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_node_id INT NOT NULL,
    meta_key VARCHAR(100) NOT NULL,
    meta_value TEXT,
    meta_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (file_node_id) REFERENCES files(node_id) ON DELETE CASCADE,
    UNIQUE KEY unique_file_meta (file_node_id, meta_key),
    INDEX idx_meta_key (meta_key)
);
```

### **3. Simplification des tables de référence**

```sql
-- Remplacer ref_file_category et ref_file_subcategory par un système unifié
CREATE TABLE ref_file_types (
    code VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    parent_type VARCHAR(50),  -- Pour hiérarchie (ex: micrograph > x50)
    entity_type VARCHAR(50),  -- Type d'entité associée (trial, part, etc.)
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (parent_type) REFERENCES ref_file_types(code)
);

-- Données de référence
INSERT INTO ref_file_types (code, label, entity_type, parent_type) VALUES
-- Catégories principales
('micrograph', 'Micrographie', 'trial', NULL),
('furnace_report', 'Rapport de four', 'trial', NULL),
('load_design', 'Plan de charge', 'trial', NULL),
('part_photo', 'Photo de pièce', 'part', NULL),
('document', 'Document', 'trial_request', NULL),

-- Sous-types de micrographie
('micrograph_x50', 'Micrographie x50', 'trial', 'micrograph'),
('micrograph_x500', 'Micrographie x500', 'trial', 'micrograph'),
('micrograph_x1000', 'Micrographie x1000', 'trial', 'micrograph'),
('micrograph_other', 'Autre micrographie', 'trial', 'micrograph'),

-- Sous-types de photos de pièce
('part_photo_front', 'Photo de face', 'part', 'part_photo'),
('part_photo_profile', 'Photo de profil', 'part', 'part_photo'),
('part_photo_quarter', 'Photo de quart', 'part', 'part_photo'),

-- Sous-types de rapport de four
('furnace_heating', 'Courbe de chauffage', 'trial', 'furnace_report'),
('furnace_cooling', 'Courbe de refroidissement', 'trial', 'furnace_report'),
('furnace_alarms', 'Alarmes', 'trial', 'furnace_report'),
('furnace_datapaq', 'Datapaq', 'trial', 'furnace_report');
```

---

## 🔧 NOUVEAU SYSTÈME DE STOCKAGE

### **Architecture de stockage basée sur `storage_key`**

#### **Format du `storage_key`**
```
{entity_type}/{entity_id}/{file_type}/{uuid}.{extension}

Exemples:
- trial/456/micrograph/a3f5c9d1-x50-sample-1.jpg
- part/789/photo/b2e8f4a6-front.png
- client/123/logo/c7d9e2b3.png
```

#### **Structure physique des dossiers**

```
uploads/
├── trial/
│   └── 456/
│       ├── micrograph/
│       │   ├── a3f5c9d1-x50-sample-1.jpg
│       │   └── b4e6f8d2-x500-sample-1.jpg
│       ├── furnace_report/
│       │   └── c5e7f9d3-heating.pdf
│       └── load_design/
│           └── d6e8f0d4-plan.pdf
├── part/
│   └── 789/
│       └── photo/
│           ├── e7e9f1d5-front.jpg
│           └── f8e0f2d6-profile.jpg
└── client/
    └── 123/
        └── logo/
            └── g9e1f3d7.png
```

### **Avantages de cette approche**

1. ✅ **Immuabilité** : Le `storage_key` ne change jamais
2. ✅ **Indépendance** : Renommer un client n'affecte pas les fichiers
3. ✅ **Prédictibilité** : Path reconstruit dynamiquement depuis `storage_key`
4. ✅ **Scalabilité** : Facile à migrer vers cloud storage (S3, Azure Blob)
5. ✅ **Sécurité** : UUID dans le nom évite les collisions

---

## 💻 NOUVELLE COUCHE DE SERVICE

### **FileStorageService - Gestion du stockage physique**

```javascript
// server/services/storage/FileStorageService.js

class FileStorageService {
    constructor(baseDir = './uploads') {
        this.baseDir = baseDir;
    }

    /**
     * Génère une clé de stockage unique
     * @param {string} entityType - Type d'entité (trial, part, client)
     * @param {number} entityId - ID de l'entité
     * @param {string} fileType - Type de fichier (micrograph, photo, etc.)
     * @param {string} originalFilename - Nom du fichier original
     * @returns {string} Storage key
     */
    generateStorageKey(entityType, entityId, fileType, originalFilename) {
        const uuid = uuidv4();
        const ext = path.extname(originalFilename);
        const safeName = path.basename(originalFilename, ext)
            .replace(/[^a-zA-Z0-9-_]/g, '_')
            .substring(0, 50);
        
        return `${entityType}/${entityId}/${fileType}/${uuid}-${safeName}${ext}`;
    }

    /**
     * Construit le chemin physique complet depuis une storage_key
     * @param {string} storageKey - Clé de stockage
     * @returns {string} Chemin physique absolu
     */
    getPhysicalPath(storageKey) {
        return path.join(this.baseDir, storageKey);
    }

    /**
     * Sauvegarde un fichier uploadé
     * @param {Object} uploadedFile - Fichier multer
     * @param {string} storageKey - Clé de stockage
     * @returns {Promise<string>} Chemin physique final
     */
    async saveFile(uploadedFile, storageKey) {
        const physicalPath = this.getPhysicalPath(storageKey);
        const dir = path.dirname(physicalPath);
        
        // Créer les dossiers si nécessaire
        await fs.promises.mkdir(dir, { recursive: true });
        
        // Déplacer le fichier depuis temp vers destination finale
        await fs.promises.rename(uploadedFile.path, physicalPath);
        
        return physicalPath;
    }

    /**
     * Supprime un fichier physique
     * @param {string} storageKey - Clé de stockage
     * @returns {Promise<boolean>}
     */
    async deleteFile(storageKey) {
        const physicalPath = this.getPhysicalPath(storageKey);
        
        try {
            if (await this.fileExists(storageKey)) {
                await fs.promises.unlink(physicalPath);
                
                // Nettoyer les dossiers vides
                await this.cleanupEmptyDirectories(path.dirname(physicalPath));
                
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Erreur suppression fichier', { storageKey, error });
            throw error;
        }
    }

    /**
     * Vérifie l'existence d'un fichier
     * @param {string} storageKey - Clé de stockage
     * @returns {Promise<boolean>}
     */
    async fileExists(storageKey) {
        const physicalPath = this.getPhysicalPath(storageKey);
        try {
            await fs.promises.access(physicalPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Nettoie les dossiers vides de manière récursive
     * @param {string} dirPath - Chemin du dossier
     */
    async cleanupEmptyDirectories(dirPath) {
        // Ne pas supprimer le dossier de base
        if (dirPath === this.baseDir) return;
        
        try {
            const files = await fs.promises.readdir(dirPath);
            
            if (files.length === 0) {
                await fs.promises.rmdir(dirPath);
                
                // Récursion pour le parent
                await this.cleanupEmptyDirectories(path.dirname(dirPath));
            }
        } catch (error) {
            // Ignorer les erreurs de nettoyage
        }
    }

    /**
     * Déplace un fichier vers un nouveau storage_key
     * @param {string} oldStorageKey - Ancienne clé
     * @param {string} newStorageKey - Nouvelle clé
     * @returns {Promise<void>}
     */
    async moveFile(oldStorageKey, newStorageKey) {
        const oldPath = this.getPhysicalPath(oldStorageKey);
        const newPath = this.getPhysicalPath(newStorageKey);
        const newDir = path.dirname(newPath);
        
        await fs.promises.mkdir(newDir, { recursive: true });
        await fs.promises.rename(oldPath, newPath);
        await this.cleanupEmptyDirectories(path.dirname(oldPath));
    }
}

module.exports = new FileStorageService();
```

### **FileMetadataService - Gestion des métadonnées**

```javascript
// server/services/storage/FileMetadataService.js

class FileMetadataService {
    /**
     * Extrait le contexte depuis les paramètres d'upload
     * @param {Object} params - Paramètres (nodeId, category, subcategory, etc.)
     * @param {Object} parentNode - Nœud parent
     * @returns {Object} Contexte JSON
     */
    buildFileContext(params, parentNode) {
        const { category, subcategory, sampleNumber, resultIndex } = params;
        
        // Déterminer le type d'entité depuis le parent
        const entityType = this.getEntityType(parentNode);
        
        return {
            entity_type: entityType,
            entity_id: this.getEntityId(parentNode, entityType),
            file_type: this.normalizeFileType(category),
            file_subtype: subcategory || null,
            sample_number: sampleNumber || null,
            result_index: resultIndex || null,
            parent_node_id: parentNode.id,
            parent_node_type: parentNode.type,
            upload_source: 'web_ui',
            custom_tags: []
        };
    }

    /**
     * Détermine le type d'entité depuis le nœud parent
     */
    getEntityType(node) {
        // Remonter l'arborescence pour trouver l'entité racine
        if (node.type === 'trial') return 'trial';
        if (node.type === 'part') return 'part';
        if (node.type === 'client') return 'client';
        if (node.type === 'trial_request') return 'trial_request';
        
        // Pour les sous-nœuds, il faudrait remonter la hiérarchie
        return 'unknown';
    }

    /**
     * Récupère l'ID de l'entité racine
     */
    getEntityId(node, entityType) {
        // Si le nœud est directement l'entité, retourner son ID
        if (node.type === entityType) return node.id;
        
        // Sinon, il faudrait chercher dans la closure table
        // Pour simplifier, utiliser le parent_id pour l'instant
        return node.id;
    }

    /**
     * Normalise le type de fichier (ancien système → nouveau)
     */
    normalizeFileType(category) {
        // Mapper les anciennes catégories vers les nouvelles
        const mapping = {
            'micrographs-result-0': 'micrograph',
            'micrographs-result-1': 'micrograph',
            'photos_identification': 'part_photo',
            'photos_recette': 'recipe_photo',
            'load_design': 'load_design',
            'furnace_report': 'furnace_report'
        };
        
        return mapping[category] || category;
    }

    /**
     * Ajoute une métadonnée à un fichier
     */
    async addMetadata(fileNodeId, key, value, type = 'string') {
        return await fileMetadata.create({
            file_node_id: fileNodeId,
            meta_key: key,
            meta_value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            meta_type: type
        });
    }

    /**
     * Récupère toutes les métadonnées d'un fichier
     */
    async getMetadata(fileNodeId) {
        const metadata = await fileMetadata.findAll({
            where: { file_node_id: fileNodeId }
        });
        
        return metadata.reduce((acc, meta) => {
            let value = meta.meta_value;
            
            // Parser selon le type
            if (meta.meta_type === 'json') value = JSON.parse(value);
            else if (meta.meta_type === 'number') value = parseFloat(value);
            else if (meta.meta_type === 'boolean') value = value === 'true';
            
            acc[meta.meta_key] = value;
            return acc;
        }, {});
    }
}

module.exports = new FileMetadataService();
```

### **FileService - Service principal refactorisé**

```javascript
// server/services/fileService.js - VERSION REFACTORISÉE

const fileStorageService = require('./storage/FileStorageService');
const fileMetadataService = require('./storage/FileMetadataService');

class FileService {
    /**
     * Upload de fichiers - Nouvelle version
     * @param {Array} uploadedFiles - Fichiers multer
     * @param {Object} params - Paramètres (nodeId, category, subcategory, etc.)
     * @returns {Promise<Object>}
     */
    async uploadFiles(uploadedFiles, params) {
        const { nodeId, category, subcategory, sampleNumber, resultIndex } = params;
        
        if (!nodeId) {
            throw new ValidationError('nodeId est requis pour l\'upload');
        }
        
        const transaction = await sequelize.transaction();
        
        try {
            // Récupérer le nœud parent
            const parentNode = await node.findByPk(nodeId, { transaction });
            if (!parentNode) {
                throw new NotFoundError('Nœud parent non trouvé');
            }
            
            const uploadedFileRecords = [];
            
            for (const uploadedFile of uploadedFiles) {
                // 1. Construire le contexte du fichier
                const context = fileMetadataService.buildFileContext({
                    category,
                    subcategory,
                    sampleNumber,
                    resultIndex
                }, parentNode);
                
                // 2. Générer la clé de stockage
                const storageKey = fileStorageService.generateStorageKey(
                    context.entity_type,
                    context.entity_id,
                    context.file_type,
                    uploadedFile.originalname
                );
                
                // 3. Sauvegarder le fichier physique
                const physicalPath = await fileStorageService.saveFile(
                    uploadedFile,
                    storageKey
                );
                
                // 4. Créer le nœud du fichier
                const fileNode = await node.create({
                    name: uploadedFile.originalname,
                    path: `${parentNode.path}/${uploadedFile.originalname}`,
                    type: 'file',
                    parent_id: nodeId,
                    data_status: 'new'
                }, { transaction });
                
                // 5. Créer les relations de closure
                await this.createClosureRelations(fileNode.id, nodeId, transaction);
                
                // 6. Créer l'enregistrement du fichier
                const fileRecord = await file.create({
                    node_id: fileNode.id,
                    original_name: uploadedFile.originalname,
                    storage_key: storageKey,  // ⭐ NOUVEAU
                    size: uploadedFile.size,
                    mime_type: uploadedFile.mimetype,
                    checksum: await this.generateChecksum(physicalPath),
                    context: context,  // ⭐ NOUVEAU
                    uploaded_by: params.userId || null
                }, { transaction });
                
                uploadedFileRecords.push({
                    id: fileNode.id,
                    name: uploadedFile.originalname,
                    storageKey,
                    size: uploadedFile.size,
                    mimeType: uploadedFile.mimetype,
                    context
                });
            }
            
            await transaction.commit();
            
            // Mettre à jour les timestamps des ancêtres
            await updateAncestorsModifiedAt(nodeId);
            
            return {
                success: true,
                files: uploadedFileRecords
            };
            
        } catch (error) {
            await transaction.rollback();
            
            // Nettoyer les fichiers physiques en cas d'erreur
            for (const uploadedFile of uploadedFiles) {
                try {
                    await fs.promises.unlink(uploadedFile.path);
                } catch {}
            }
            
            throw error;
        }
    }

    /**
     * Récupère les fichiers par contexte (remplace getAllFilesByNode)
     * @param {Object} filter - Filtre de recherche
     * @returns {Promise<Array>}
     */
    async getFilesByContext(filter) {
        const { 
            entityType, 
            entityId, 
            fileType, 
            fileSubtype, 
            nodeId 
        } = filter;
        
        const whereClause = {};
        
        // Construire les conditions JSON
        if (entityType) {
            whereClause['context.entity_type'] = entityType;
        }
        if (entityId) {
            whereClause['context.entity_id'] = entityId;
        }
        if (fileType) {
            whereClause['context.file_type'] = fileType;
        }
        if (fileSubtype) {
            whereClause['context.file_subtype'] = fileSubtype;
        }
        
        // Ou recherche par nœud
        if (nodeId) {
            whereClause['context.parent_node_id'] = nodeId;
        }
        
        const files = await file.findAll({
            where: sequelize.where(
                sequelize.literal('JSON_EXTRACT(context, ?)'),
                Object.entries(whereClause).map(([key, value]) => 
                    `$.${key} = "${value}"`
                ).join(' AND ')
            ),
            include: [{
                model: node,
                as: 'node'
            }]
        });
        
        return files.map(f => ({
            id: f.node_id,
            name: f.original_name,
            storageKey: f.storage_key,
            size: f.size,
            mimeType: f.mime_type,
            context: f.context,
            viewPath: `/api/files/${f.node_id}`,
            downloadPath: `/api/files/download/${f.node_id}`
        }));
    }

    /**
     * Télécharge un fichier par son ID
     */
    async downloadFile(fileId) {
        const fileRecord = await file.findOne({
            where: { node_id: fileId }
        });
        
        if (!fileRecord) {
            throw new NotFoundError('Fichier non trouvé');
        }
        
        const physicalPath = fileStorageService.getPhysicalPath(
            fileRecord.storage_key
        );
        
        if (!await fileStorageService.fileExists(fileRecord.storage_key)) {
            throw new NotFoundError('Fichier physique introuvable');
        }
        
        return {
            path: physicalPath,
            originalName: fileRecord.original_name,
            mimeType: fileRecord.mime_type
        };
    }

    /**
     * Supprime un fichier
     */
    async deleteFile(fileId) {
        const transaction = await sequelize.transaction();
        
        try {
            const fileRecord = await file.findOne({
                where: { node_id: fileId },
                transaction
            });
            
            if (!fileRecord) {
                throw new NotFoundError('Fichier non trouvé');
            }
            
            // 1. Supprimer le fichier physique
            await fileStorageService.deleteFile(fileRecord.storage_key);
            
            // 2. Supprimer les métadonnées
            await fileMetadata.destroy({
                where: { file_node_id: fileId },
                transaction
            });
            
            // 3. Supprimer les closures
            await closure.destroy({
                where: {
                    [Op.or]: [
                        { ancestor_id: fileId },
                        { descendant_id: fileId }
                    ]
                },
                transaction
            });
            
            // 4. Supprimer l'enregistrement du fichier
            await file.destroy({
                where: { node_id: fileId },
                transaction
            });
            
            // 5. Supprimer le nœud
            await node.destroy({
                where: { id: fileId },
                transaction
            });
            
            await transaction.commit();
            
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new FileService();
```

---

## 🔄 PLAN DE MIGRATION

### **Phase 1 : Préparation (Semaine 1)**

1. ✅ Créer les nouvelles tables (`file_metadata`, `ref_file_types`)
2. ✅ Ajouter colonnes `storage_key` et `context` à table `files`
3. ✅ Garder anciennes colonnes `category`/`subcategory` pour compatibilité

```sql
-- Migration 1: Ajouter nouvelles colonnes
ALTER TABLE files 
ADD COLUMN storage_key VARCHAR(500) AFTER file_path,
ADD COLUMN context JSON AFTER subcategory,
ADD COLUMN version INT DEFAULT 1 AFTER context,
ADD COLUMN is_latest BOOLEAN DEFAULT TRUE AFTER version,
ADD COLUMN uploaded_by INT AFTER is_latest;

-- Index
CREATE UNIQUE INDEX idx_storage_key ON files(storage_key);
CREATE INDEX idx_context_entity ON files((CAST(context->>'$.entity_type' AS CHAR)), (CAST(context->>'$.entity_id' AS UNSIGNED)));
```

### **Phase 2 : Migration des données (Semaine 1-2)**

```javascript
// Script de migration : migrate-files-to-storage-key.js

async function migrateExistingFiles() {
    const allFiles = await file.findAll({
        include: [{ model: node, as: 'node' }]
    });
    
    for (const fileRecord of allFiles) {
        try {
            // 1. Générer storage_key depuis l'ancien file_path
            const storageKey = generateStorageKeyFromPath(fileRecord.file_path);
            
            // 2. Construire le contexte depuis category/subcategory
            const context = {
                entity_type: inferEntityType(fileRecord),
                entity_id: inferEntityId(fileRecord),
                file_type: fileRecord.category || 'unknown',
                file_subtype: fileRecord.subcategory || null,
                migrated_from_legacy: true
            };
            
            // 3. Calculer le nouveau chemin physique
            const newPhysicalPath = fileStorageService.getPhysicalPath(storageKey);
            
            // 4. Déplacer le fichier physique
            if (fs.existsSync(fileRecord.file_path)) {
                const dir = path.dirname(newPhysicalPath);
                fs.mkdirSync(dir, { recursive: true });
                fs.renameSync(fileRecord.file_path, newPhysicalPath);
            }
            
            // 5. Mettre à jour l'enregistrement
            await fileRecord.update({
                storage_key: storageKey,
                context: context
            });
            
            console.log(`✅ Migré : ${fileRecord.original_name}`);
        } catch (error) {
            console.error(`❌ Erreur migration fichier ${fileRecord.id}:`, error);
        }
    }
}
```

### **Phase 3 : Refactorisation progressive (Semaine 2-3)**

1. Déployer nouveaux services (`FileStorageService`, `FileMetadataService`)
2. Créer endpoints API v2 (`/api/v2/files/*`)
3. Tester en parallèle avec ancien système
4. Migrer frontend progressivement

### **Phase 4 : Nettoyage (Semaine 4)**

1. Rediriger anciens endpoints vers nouveaux
2. Supprimer code legacy
3. Supprimer colonnes `category`, `subcategory`, `file_path` (après backup)
4. Documentation et formation

---

## 📈 AVANTAGES DE LA NOUVELLE ARCHITECTURE

### **Robustesse**
- ✅ **Immuabilité des paths** : Renommage de client n'affecte plus les fichiers
- ✅ **Récupération automatique** : Path reconstruit dynamiquement
- ✅ **Cohérence garantie** : Single source of truth (storage_key)

### **Flexibilité**
- ✅ **Métadonnées illimitées** : JSON context + table file_metadata
- ✅ **Extensibilité** : Ajout de nouveaux types sans migration
- ✅ **Recherche puissante** : Requêtes JSON sur contexte

### **Maintenabilité**
- ✅ **Clean Architecture** : Séparation storage/métadonnées/logique
- ✅ **Testable** : Services indépendants mockables
- ✅ **Évolutivité** : Support versioning, cloud storage futur

### **Performance**
- ✅ **Index optimisés** : JSON path indexes
- ✅ **Moins de joins** : Contexte dénormalisé
- ✅ **Cache-friendly** : Storage key immuable

---

## 🎨 EXEMPLE D'UTILISATION

### **Upload de fichiers**

```javascript
// Ancien système (problématique)
await fileService.uploadFiles(files, {
    nodeId: 123,
    category: 'micrographs-result-0',  // ❌ Catégorie dynamique
    subcategory: 'x50'
});

// Nouveau système (robuste)
await fileService.uploadFiles(files, {
    nodeId: 123,
    category: 'micrograph',  // ✅ Type fixe
    subcategory: 'x50',
    sampleNumber: 1,
    resultIndex: 0
});
```

### **Récupération pour rapport**

```javascript
// Ancien système (hard-coded)
const files = await fileService.getAllFilesByNode({
    nodeId: testId,
    category: 'micrographs-result-0',
    subcategory: 'x50'
});

// Nouveau système (flexible)
const files = await fileService.getFilesByContext({
    entityType: 'trial',
    entityId: testId,
    fileType: 'micrograph',
    fileSubtype: 'x50',
    // Ou combinaisons plus complexes :
    filter: {
        'context.sample_number': 1,
        'context.result_index': 0
    }
});
```

### **Migration vers cloud storage (futur)**

```javascript
// Juste changer FileStorageService pour S3Service
class S3FileStorageService extends FileStorageService {
    getPhysicalPath(storageKey) {
        return `https://s3.amazonaws.com/bucket/${storageKey}`;
    }
    
    async saveFile(uploadedFile, storageKey) {
        return await s3.upload({
            Key: storageKey,
            Body: fs.createReadStream(uploadedFile.path)
        }).promise();
    }
}
```

---

## ✅ CHECKLIST DE DÉPLOIEMENT

### Avant migration
- [ ] Backup complet de la base de données
- [ ] Backup physique de tous les fichiers
- [ ] Tests sur environnement de développement
- [ ] Documentation utilisateur mise à jour

### Migration
- [ ] Exécuter les migrations SQL
- [ ] Lancer le script de migration des fichiers
- [ ] Vérifier l'intégrité des fichiers (checksum)
- [ ] Tests fonctionnels complets

### Après migration
- [ ] Monitoring des erreurs 404 sur fichiers
- [ ] Nettoyage des anciens fichiers temporaires
- [ ] Suppression progressive du code legacy
- [ ] Formation des développeurs

---

## 📞 SUPPORT ET QUESTIONS

Cette proposition est **backward compatible** et permet une **migration progressive** sans tout casser. Le nouveau système peut coexister avec l'ancien pendant la transition.

**Points à discuter :**
1. Calendrier de migration (4 semaines proposées)
2. Tests de charge sur nouveau système
3. Formation équipe développement
4. Stratégie de rollback si problème

**Prêt à commencer l'implémentation ?** 🚀
