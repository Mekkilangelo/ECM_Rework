const { DataTypes } = require('sequelize');

/**
 * Modèle File - Données spécifiques aux fichiers
 * Correspond à la table 'files' mise à jour (ma20251201.sql)
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
      comment: 'Chemin de stockage du fichier (Legacy / Cache)'
    },
    storage_key: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Clé de stockage immuable (Nouveau système)'
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
      comment: 'Empreinte du fichier (SHA-256)'
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_file_category',
        key: 'name'
      },
      comment: 'Catégorie générale du fichier'
    },
    subcategory: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Sous-catégorie spécifique'
    },
    context: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Métadonnées contextuelles structurées (JSON)'
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Numéro de version du fichier'
    },
    is_latest: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Indique si c\'est la dernière version'
    },
    previous_version_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID de la version précédente'
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Utilisateur ayant uploadé le fichier'
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Date d\'upload'
    },
    modified_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Date de dernière modification'
    }
  }, {
    tableName: 'files',
    timestamps: false, // Géré manuellement ou par la DB
    hooks: {
      beforeDestroy: async (fileInstance, options) => {
        // Supprimer le fichier physique avant de supprimer l'enregistrement en base
        const fs = require('fs');
        const path = require('path');
        
        // Essayer de supprimer via le chemin physique s'il existe
        if (fileInstance.file_path && fs.existsSync(fileInstance.file_path)) {
          try {
            fs.unlinkSync(fileInstance.file_path);
            console.log(`✅ Fichier physique supprimé : ${fileInstance.file_path}`);
            
            // Supprimer aussi le dossier parent s'il est vide (nettoyage basique)
            const parentDir = path.dirname(fileInstance.file_path);
            if (fs.existsSync(parentDir)) {
              const files = fs.readdirSync(parentDir);
              if (files.length === 0) {
                fs.rmdirSync(parentDir);
              }
            }
          } catch (error) {
            console.error(`❌ Erreur lors de la suppression du fichier physique : ${fileInstance.file_path}`, error);
          }
        }
      }
    },
    indexes: [
      { fields: ['category'] },
      { fields: ['subcategory'] },
      { fields: ['storage_key'] },
      { fields: ['uploaded_by'] }
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
      as: 'categoryRef'
    });

    // ⚠️ PAS de relation belongsTo vers ref_file_subcategory
    // Les subcategories sont dynamiques (ex: result-0-sample-0-x1000)
    // et ne doivent PAS avoir de contrainte FK

    // Relation avec l'utilisateur
    File.belongsTo(models.user, {
      foreignKey: 'uploaded_by',
      as: 'uploader'
    });
  };

  return File;
};