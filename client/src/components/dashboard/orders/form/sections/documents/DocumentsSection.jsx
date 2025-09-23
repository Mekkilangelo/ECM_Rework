import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../../../common/FileUploader/FileUploader';
import fileService from '../../../../../../services/fileService';
import useFileAssociation from '../../../../../../hooks/useFileAssociation';
import { faFile } from '@fortawesome/free-solid-svg-icons';

const DocumentsSection = ({
  orderNodeId,
  onFileAssociationNeeded,
  viewMode = false
}) => {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [pendingFiles, setPendingFiles] = useState([]); // Nouveau : stocker les fichiers en attente
  
  // Hook pour gérer l'association des fichiers
  const { createAssociationFunction } = useFileAssociation();
  
  // Référence pour stocker les fonctions d'upload
  const uploaderRef = useRef(null);
  
  // Charger les fichiers existants
  useEffect(() => {
    if (orderNodeId) {
      loadExistingFiles();
    }
  }, [orderNodeId]);
  const loadExistingFiles = async () => {
    try {
      const response = await fileService.getNodeFiles(orderNodeId, { category: 'documents' });
      console.log('Réponse de récupération des fichiers', response.data);
      
      // Vérifier que la requête a réussi
      if (!response.data || response.data.success === false) {
        console.error(t('orders.documents.loadError'), response.data?.message);
        return;
      }
      
      // Organiser les fichiers par sous-catégorie
      const filesBySubcategory = {};
      // S'assurer que nous accédons aux fichiers au bon endroit dans la réponse
      const files = response.data.data?.files || [];
      
      files.forEach(file => {
        const subcategory = file.subcategory || 'other';
        if (!filesBySubcategory[subcategory]) {
          filesBySubcategory[subcategory] = [];
        }
        filesBySubcategory[subcategory].push(file);
      });
      
      setUploadedFiles(filesBySubcategory);
    } catch (error) {
      console.error(t('orders.documents.loadError'), error);
    }
  };
  const handleFilesUploaded = (files, tempId, operation = 'add', fileId = null) => {
    console.log("🔄 [DocumentsSection] handleFilesUploaded called:", {
      operation,
      filesCount: files.length,
      fileNames: files.map(f => f.name)
    });
    
    if (operation === 'delete') {
      // Pour une suppression, mettre à jour uniquement la sous-catégorie concernée
      setUploadedFiles(prev => {
        const updatedFiles = { ...prev };
        
        // Parcourir toutes les sous-catégories pour trouver et supprimer le fichier
        Object.keys(updatedFiles).forEach(subcategory => {
          updatedFiles[subcategory] = updatedFiles[subcategory].filter(file => file.id !== fileId);
        });
        
        return updatedFiles;
      });    } else if (operation === 'standby') {
      // En mode standby, stocker les fichiers dans notre état local
      console.log("📦 [DocumentsSection] Storing pending files:", files.map(f => f.name));
      setPendingFiles(files);
    } else {
      // Mode normal : ajouter les fichiers uploadés
      const subcategory = files.length > 0 && files[0].subcategory ? files[0].subcategory : 'all_documents';
      
      setUploadedFiles(prev => ({
        ...prev,
        [subcategory]: [...(prev[subcategory] || []), ...files]
      }));
    }
  };// Fonction pour enregistrer les références aux fonctions d'upload
  const handleUploaderReady = (uploadPendingFiles, getPendingFiles) => {
    uploaderRef.current = { uploadPendingFiles, getPendingFiles };
  };  // Exposer la fonction d'association de fichiers
  useEffect(() => {
    if (onFileAssociationNeeded && uploaderRef.current) {
      // Créer la fonction d'association qui utilise nos fichiers stockés localement
      const associationFunction = createAssociationFunction(
        uploaderRef.current.uploadPendingFiles,
        () => {
          console.log("📋 [DocumentsSection] getPendingFiles called, returning:", pendingFiles.map(f => f.name));
          return pendingFiles; // Utiliser nos fichiers stockés localement
        },
        'documents',
        'all_documents'
      );
      
      // Exposer au composant parent
      onFileAssociationNeeded(associationFunction);
    }
  }, [onFileAssociationNeeded, createAssociationFunction, pendingFiles]); // Ajouter pendingFiles comme dépendance
  
  return (
    <>
      <div className="p-2">        <FileUploader
          category="documents"
          subcategory="all_documents"
          nodeId={orderNodeId}
          onFilesUploaded={handleFilesUploaded}
          onUploaderReady={handleUploaderReady}
          maxFiles={50}
          acceptedFileTypes={{
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'image/*': ['.png', '.jpg', '.jpeg']
          }}
          title={t('orders.documents.uploadTitle')}
          fileIcon={faFile}
          height="150px"
          width="100%"
          showPreview={true}
          // Correction : afficher tous les fichiers, peu importe la sous-catégorie
          existingFiles={Object.values(uploadedFiles).flat()}
          viewMode={viewMode}
        />
      </div>
    </>
  );
};

export default DocumentsSection;
