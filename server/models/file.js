const { DataTypes } = require('sequelize');

/**
 * Modèle File - Données spécifiques aux fichiers
 * Philosophie Synergia : category/subcategory → Tables de référence
 * CHANGEMENTS:
 * - category, subcategory (VARCHAR) → FK vers ref_file_*
 * - additional_info (JSON) → Supprimé
 */
module.exports = (sequelize) => {
  const File = sequelize.define('file', {
    node_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'nodes',
        key: 'id'
      },
      comment: '🔗 RELATION FONDAMENTALE : Référence au nœud parent'
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Nom original du fichier'
    },
    file_path: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      comment: 'Chemin de stockage du fichier'
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Taille du fichier en octets'
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Type MIME du fichier'
    },
    checksum: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: 'Empreinte du fichier (checksum)'
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_file_category',
        key: 'name'
      },
      comment: 'Catégorie générale du fichier (micrographs, control-location, photos, etc.) - FK vers ref_file_category.name'
    },
    subcategory: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Sous-catégorie spécifique/dynamique (ex: result-0-sample-1, x100, etc.) - Pas de FK pour flexibilité'
    }
  }, {
    tableName: 'files',
    timestamps: false,
    hooks: {
      beforeDestroy: async (fileInstance, options) => {
        // Supprimer le fichier physique avant de supprimer l'enregistrement en base
        const fs = require('fs');
        const path = require('path');
        
        if (fileInstance.file_path && fs.existsSync(fileInstance.file_path)) {
          try {
            fs.unlinkSync(fileInstance.file_path);
            console.log(`✅ Fichier physique supprimé : ${fileInstance.file_path}`);
            
            // Supprimer aussi le dossier parent s'il est vide
            const parentDir = path.dirname(fileInstance.file_path);
            if (fs.existsSync(parentDir)) {
              const files = fs.readdirSync(parentDir);
              if (files.length === 0) {
                fs.rmdirSync(parentDir);
                console.log(`✅ Dossier vide supprimé : ${parentDir}`);
              }
            }
          } catch (error) {
            console.error(`❌ Erreur lors de la suppression du fichier physique : ${fileInstance.file_path}`, error);
            // Ne pas bloquer la suppression en base même si le fichier physique ne peut pas être supprimé
          }
        }
      },
      afterBulkDestroy: async (options) => {
        // Hook pour les suppressions en masse (DELETE WHERE...)
        // Dans ce cas, on doit récupérer les fichiers avant qu'ils ne soient supprimés
        console.log('⚠️ Suppression en masse de fichiers détectée');
      }
    },
    indexes: [
      {
        fields: ['category'],
        name: 'fk_files_category'
      },
      {
        fields: ['subcategory'],
        name: 'fk_files_subcategory'
      }
    ]
  });

  File.associate = function(models) {
    // 🔗 RELATION CRITIQUE : Chaque File DOIT appartenir à un Node
    File.belongsTo(models.node, {
      foreignKey: 'node_id',
      as: 'node',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // Relations avec les tables de référence
    File.belongsTo(models.ref_file_category, {
      foreignKey: 'category',
      targetKey: 'name',
      as: 'categoryRef',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return File;
};