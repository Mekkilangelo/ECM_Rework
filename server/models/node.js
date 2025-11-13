const { DataTypes } = require('sequelize');

/**
 * Modèle Node - Cœur du système hiérarchique (Closure Table Pattern)
 * Nouvelle philosophie Synergia : Base de données intelligente, code simple
 */
module.exports = (sequelize) => {
  const Node = sequelize.define('node', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Nom du nœud'
    },
    path: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      comment: 'Chemin complet dans la hiérarchie'
    },
    type: {
      type: DataTypes.ENUM('client', 'trial_request', 'trial', 'file', 'part', 'furnace', 'steel'),
      allowNull: false,
      comment: 'Type de nœud (détermine la table de données associée)'
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'nodes',
        key: 'id'
      },
      comment: 'Référence au nœud parent (relation directe)'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date de création du nœud'
    },
    modified_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date de dernière modification'
    },
    data_status: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'old',
      references: {
        model: 'ref_node_data_status',
        key: 'name'
      },
      comment: 'Statut des données (NEW, OLD, OPENED) - FK vers ref_node_data_status.name'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description optionnelle du nœud'
    }
  }, {
    tableName: 'nodes',
    // ⚠️ MySQL : Le schema = la base de données elle-même (synergia)
    // Ne pas spécifier de schema séparé
    timestamps: false,
    hooks: {
      beforeDestroy: async (nodeInstance, options) => {
        // Récupérer tous les fichiers descendants via la closure table
        const { closure, file } = sequelize.models;
        
        try {
          // Trouver tous les descendants de type 'file'
          const descendantFiles = await closure.findAll({
            where: {
              ancestor_id: nodeInstance.id
            },
            include: [{
              model: sequelize.models.node,
              as: 'descendant',
              where: { type: 'file' },
              include: [{
                model: file,
                as: 'file',
                required: false
              }]
            }],
            transaction: options.transaction
          });
          
          // Supprimer les fichiers physiques
          const fs = require('fs');
          const path = require('path');
          const deletedFiles = [];
          
          for (const descendant of descendantFiles) {
            const fileData = descendant.descendant?.file;
            if (fileData && fileData.file_path && fs.existsSync(fileData.file_path)) {
              try {
                fs.unlinkSync(fileData.file_path);
                deletedFiles.push(fileData.file_path);
                console.log(`✅ Fichier physique supprimé (cascade) : ${fileData.file_path}`);
              } catch (error) {
                console.error(`❌ Erreur suppression fichier : ${fileData.file_path}`, error);
              }
            }
          }
          
          // Nettoyer les dossiers vides
          if (deletedFiles.length > 0) {
            const uniqueDirs = [...new Set(deletedFiles.map(f => path.dirname(f)))];
            for (const dir of uniqueDirs) {
              try {
                if (fs.existsSync(dir)) {
                  const files = fs.readdirSync(dir);
                  if (files.length === 0) {
                    fs.rmdirSync(dir);
                    console.log(`✅ Dossier vide supprimé : ${dir}`);
                  }
                }
              } catch (error) {
                // Ignorer les erreurs de suppression de dossier
              }
            }
          }
          
          console.log(`🗑️ Suppression du nœud ${nodeInstance.id} (${nodeInstance.type}) - ${deletedFiles.length} fichier(s) physique(s) supprimé(s)`);
        } catch (error) {
          console.error(`❌ Erreur lors du hook beforeDestroy du nœud ${nodeInstance.id}:`, error);
          // Ne pas bloquer la suppression même en cas d'erreur
        }
      }
    },
    indexes: [
      {
        fields: ['parent_id'],
        name: 'idx_parent_id'
      },
      {
        fields: ['data_status'],
        name: 'idx_data_status'
      },
      {
        fields: ['type'],
        name: 'idx_type'
      }
    ]
  });
  
  Node.associate = function(models) {
    // Auto-relation parent-enfant (relation directe)
    Node.hasMany(models.node, { 
      as: 'children', 
      foreignKey: 'parent_id' 
    });
    
    Node.belongsTo(models.node, { 
      as: 'parent', 
      foreignKey: 'parent_id',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE' 
    });
    
    // 🔗 RELATION CRITIQUE : Statut de données (normalisé)
    // Philosophie Synergia : La DB gère l'intégrité, pas le code
    // FK pointe vers ref_node_data_status.name (VARCHAR), pas vers un id
    Node.belongsTo(models.ref_node_data_status, {
      foreignKey: 'data_status',
      targetKey: 'name',
      as: 'dataStatus',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    // Relations 1:1 avec les tables spécifiques (polymorphisme via type)
    // Chaque nœud peut avoir UNE entité de données selon son type
    Node.hasOne(models.client, { 
      foreignKey: 'node_id',
      as: 'client',
      onDelete: 'CASCADE'
    });
    
    Node.hasOne(models.trial_request, { 
      foreignKey: 'node_id',
      as: 'trialRequest',
      onDelete: 'CASCADE'
    });
    
    Node.hasOne(models.part, { 
      foreignKey: 'node_id',
      as: 'part',
      onDelete: 'CASCADE'
    });
    
    Node.hasOne(models.trial, { 
      foreignKey: 'node_id',
      as: 'trial',
      onDelete: 'CASCADE'
    });
    
    Node.hasOne(models.file, { 
      foreignKey: 'node_id',
      as: 'file',
      onDelete: 'CASCADE'
    });
    
    Node.hasOne(models.steel, { 
      foreignKey: 'node_id',
      as: 'steel',
      onDelete: 'CASCADE'
    });
    
    // ⚠️ SUPPRIMÉ : Furnace n'est PLUS lié aux nodes dans la nouvelle architecture!
    // Furnace est maintenant une table indépendante avec furnace_id auto-increment
    
    // Relations avec Closure Table (hiérarchie complète - toutes les relations ancêtre/descendant)
    Node.hasMany(models.closure, { 
      as: 'AncestorClosures', 
      foreignKey: 'ancestor_id' 
    });
    
    Node.hasMany(models.closure, { 
      as: 'DescendantClosures', 
      foreignKey: 'descendant_id' 
    });
  };

  return Node;
};