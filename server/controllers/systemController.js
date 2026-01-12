/**
 * Contrôleur pour gérer les paramètres système
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/config');

/**
 * Obtenir les paramètres actuels du système
 * @route GET /api/system/settings
 */
const getSystemSettings = (req, res) => {
  try {
    const settings = {
      globalReadOnly: config.ACCESS.GLOBAL_READ_ONLY || false
    };
    
    return res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres système:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres système'
    });
  }
};

/**
 * Obtenir les informations de sécurité et d'accès
 * @route GET /api/system/security
 */
const getSecurityInfo = (req, res) => {
  try {
    // Informations sur l'utilisateur actuel
    const userInfo = req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    } : null;
    
    // Droits d'édition basés sur le rôle
    const hasEditRights = req.user && 
      (req.user.role === 'admin' || req.user.role === 'superuser');
    
    // État du mode lecture seule global
    const globalReadOnly = config.ACCESS.GLOBAL_READ_ONLY || false;
    
    // Informations combinées
    const securityInfo = {
      user: userInfo,
      access: {
        hasEditRights,
        globalReadOnly,
        effectiveReadOnly: globalReadOnly || !hasEditRights
      }
    };
    
    return res.status(200).json({
      success: true,
      security: securityInfo
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de sécurité:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations de sécurité'
    });
  }
};

/**
 * Mettre à jour le paramètre de lecture seule global
 * @route PUT /api/system/settings/readonly
 */
const updateReadOnlyMode = async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Le paramètre "enabled" doit être un booléen'
      });
    }
    
    // Seuls les superutilisateurs peuvent modifier ce paramètre
    if (req.user.role !== 'superuser') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les superutilisateurs peuvent modifier ce paramètre'
      });
    }
    
    // Mettre à jour le paramètre en mémoire
    config.ACCESS.GLOBAL_READ_ONLY = enabled;
    
    // Mettre à jour le fichier .env si présent
    try {
      const envPaths = [
        path.join(__dirname, '..', '.env'),
        path.join(process.cwd(), '.env')
      ];
      
      let envFound = false;
      
      for (const envPath of envPaths) {
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          
          // Vérifier si la variable existe déjà
          if (envContent.includes('GLOBAL_READ_ONLY=')) {
            // Remplacer la valeur existante
            envContent = envContent.replace(
              /GLOBAL_READ_ONLY=(true|false)/,
              `GLOBAL_READ_ONLY=${enabled}`
            );
          } else {
            // Ajouter la variable à la fin du fichier
            envContent += `\nGLOBAL_READ_ONLY=${enabled}`;
          }
          
          // Écrire les modifications
          fs.writeFileSync(envPath, envContent);
          envFound = true;
          break;
        }
      }
      
      if (!envFound) {
        // Créer un nouveau fichier .env s'il n'existe pas
        fs.writeFileSync(
          path.join(__dirname, '..', '.env'),
          `GLOBAL_READ_ONLY=${enabled}`
        );
      }
    } catch (fileError) {
      console.warn('Avertissement: Impossible de mettre à jour le fichier .env', fileError);
      // Continuer, puisque nous avons déjà mis à jour le paramètre en mémoire
    }
    
    return res.status(200).json({
      success: true,
      message: `Mode lecture seule ${enabled ? 'activé' : 'désactivé'} avec succès`,
      settings: {
        globalReadOnly: enabled
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mode lecture seule:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du mode lecture seule'
    });
  }
};

/**
 * Nettoyer les fichiers temporaires orphelins
 * @route POST /api/system/cleanup/temp-files
 */
const cleanupTempFiles = async (req, res) => {
  try {
    const { cleanupOrphanedTempFiles, showTempFileStats } = require('../scripts/cleanup-temp-files');
    
    // Récupérer les stats avant nettoyage
    const statsBefore = {};
    
    
    
    // Effectuer le nettoyage
    await cleanupOrphanedTempFiles();
    
    
    
    return res.status(200).json({
      success: true,
      message: 'Nettoyage des fichiers temporaires effectué avec succès',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors du nettoyage des fichiers temporaires:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage des fichiers temporaires',
      error: error.message
    });
  }
};

/**
 * Obtenir les statistiques des fichiers temporaires
 * @route GET /api/system/stats/temp-files
 */
const getTempFileStats = async (req, res) => {
  try {
    const { file: File, sequelize } = require('../models');
    const fs = require('fs');
    const { TEMP_DIR } = require('../utils/fileStorage');
    
    // Compter les fichiers temporaires en DB
    const tempFilesCount = await File.count({
      where: sequelize.where(
        sequelize.fn('JSON_UNQUOTE', sequelize.fn('JSON_EXTRACT', sequelize.col('additional_info'), '$.temp_id')),
        { [sequelize.Op.ne]: null }
      )
    });
    
    // Compter les dossiers temporaires physiques
    let tempDirsCount = 0;
    let tempFilesPhysicalCount = 0;
    
    if (fs.existsSync(TEMP_DIR)) {
      const entries = fs.readdirSync(TEMP_DIR, { withFileTypes: true });
      tempDirsCount = entries.filter(entry => entry.isDirectory()).length;
      
      // Compter les fichiers dans chaque dossier temporaire
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = path.join(TEMP_DIR, entry.name);
          try {
            const files = fs.readdirSync(dirPath);
            tempFilesPhysicalCount += files.length;
          } catch (error) {
            console.warn(`Erreur lors de l'accès au dossier ${dirPath}:`, error.message);
          }
        }
      }
    }
    
    const stats = {
      database: {
        tempFilesCount
      },
      filesystem: {
        tempDirsCount,
        tempFilesPhysicalCount
      },
      paths: {
        tempDir: TEMP_DIR
      },
      timestamp: new Date().toISOString()
    };
    
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques des fichiers temporaires',
      error: error.message
    });
  }
};

/**
 * Diagnostic des fichiers - pour debug des problèmes d'upload
 * @route GET /api/system/diagnose-files
 */
const diagnoseFiles = async (req, res) => {
  try {
    const { file: fileModel, sequelize } = require('../models');
    const { UPLOAD_BASE_DIR, TEMP_DIR } = require('../utils/fileStorage');
    const fileStorageService = require('../services/storage/FileStorageService');
    
    // Limiter à 20 fichiers récents
    const limit = parseInt(req.query.limit) || 20;
    const userId = req.query.userId; // Filtre optionnel par utilisateur
    
    const whereClause = userId ? { uploaded_by: userId } : {};
    
    const recentFiles = await fileModel.findAll({
      where: whereClause,
      order: [['uploaded_at', 'DESC']],
      limit
    });
    
    const diagnosticResults = [];
    
    for (const f of recentFiles) {
      const result = {
        node_id: f.node_id,
        original_name: f.original_name,
        storage_key: f.storage_key,
        file_path: f.file_path,
        uploaded_by: f.uploaded_by,
        uploaded_at: f.uploaded_at,
        size: f.size,
        category: f.category,
        subcategory: f.subcategory,
        checks: {}
      };
      
      // Vérifier via storage_key
      if (f.storage_key) {
        const storageKeyPath = fileStorageService.getPhysicalPath(f.storage_key);
        result.checks.storage_key_path = storageKeyPath;
        result.checks.storage_key_exists = fs.existsSync(storageKeyPath);
        
        // Si le fichier n'existe pas via storage_key, chercher dans temp_uploads
        if (!result.checks.storage_key_exists) {
          // Vérifier si un fichier similaire existe dans temp_uploads
          const tempUploadsDir = path.join(UPLOAD_BASE_DIR, 'temp_uploads');
          if (fs.existsSync(tempUploadsDir)) {
            const searchInDir = (dir, filename) => {
              try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                  const fullPath = path.join(dir, entry.name);
                  if (entry.isDirectory()) {
                    const found = searchInDir(fullPath, filename);
                    if (found) return found;
                  } else if (entry.name.includes(f.original_name.replace(/[^a-zA-Z0-9.-]/g, '_'))) {
                    return fullPath;
                  }
                }
              } catch (e) { /* ignore */ }
              return null;
            };
            result.checks.found_in_temp = searchInDir(tempUploadsDir, f.original_name);
          }
        }
      }
      
      // Vérifier via file_path
      if (f.file_path) {
        result.checks.file_path_exists = fs.existsSync(f.file_path);
      }
      
      // Statut global
      result.status = (result.checks.storage_key_exists || result.checks.file_path_exists) 
        ? 'OK' 
        : result.checks.found_in_temp 
          ? 'FOUND_IN_TEMP' 
          : 'MISSING';
      
      diagnosticResults.push(result);
    }
    
    const summary = {
      total: diagnosticResults.length,
      ok: diagnosticResults.filter(r => r.status === 'OK').length,
      found_in_temp: diagnosticResults.filter(r => r.status === 'FOUND_IN_TEMP').length,
      missing: diagnosticResults.filter(r => r.status === 'MISSING').length
    };
    
    // Lister les répertoires temp_uploads pour diagnostic
    const tempUploadsDir = path.join(UPLOAD_BASE_DIR, 'temp_uploads');
    let tempUploadsDirs = [];
    if (fs.existsSync(tempUploadsDir)) {
      tempUploadsDirs = fs.readdirSync(tempUploadsDir);
    }
    
    return res.status(200).json({
      success: true,
      environment: {
        UPLOAD_BASE_DIR,
        TEMP_DIR,
        serviceBaseDir: fileStorageService.baseDir,
        NODE_ENV: process.env.NODE_ENV,
        UPLOAD_PATH_ENV: process.env.UPLOAD_PATH || '(not set)',
        cwd: process.cwd(),
        tempUploadsDirCount: tempUploadsDirs.length
      },
      summary,
      files: diagnosticResults
    });
  } catch (error) {
    console.error('Erreur diagnostic fichiers:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur diagnostic fichiers',
      error: error.message
    });
  }
};

module.exports = {
  getSystemSettings,
  updateReadOnlyMode,
  getSecurityInfo,
  cleanupTempFiles,
  getTempFileStats,
  diagnoseFiles
};
