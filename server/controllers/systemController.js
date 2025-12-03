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

module.exports = {
  getSystemSettings,
  updateReadOnlyMode,
  getSecurityInfo,
  cleanupTempFiles,
  getTempFileStats
};
