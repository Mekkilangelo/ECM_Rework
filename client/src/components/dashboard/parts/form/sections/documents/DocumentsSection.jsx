import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../../../common/FileUploader/FileUploader';
import fileService from '../../../../../../services/fileService';
import useFileAssociation from '../../../../../../hooks/useFileAssociation';
import { faFile } from '@fortawesome/free-solid-svg-icons';

const DocumentsSection = ({
  partNodeId,
  onFileAssociationNeeded,
  viewMode = false
}) => {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [pendingFiles, setPendingFiles] = useState([]);
  
  // Hook pour gérer l'association des fichiers
  const { createAssociationFunction } = useFileAssociation();
  
  // Référence pour stocker les fonctions d'upload
  const uploaderRef = useRef(null);
  
  // Charger les fichiers existants
  useEffect(() => {
    if (partNodeId) {
      loadExistingFiles();
    }
  }, [partNodeId]);

  const loadExistingFiles = async () => {
    try {
      const response = await fileService.getNodeFiles(partNodeId, { category: 'documents' });
      
      // Vérifier que la requête a réussi
      if (!response.data || response.data.success === false) {
        console.error(t('parts.documents.loadError'), response.data?.message);
        return;
      }
      
      // Organiser les fichiers par sous-catégorie
      const filesBySubcategory = {};
      const files = response.data.data?.files || [];
      
      files.forEach(file => {
        const subcategory = file.subcategory || 'part_documents';
        if (!filesBySubcategory[subcategory]) {
          filesBySubcategory[subcategory] = [];
        }
        filesBySubcategory[subcategory].push(file);
      });
      
      setUploadedFiles(filesBySubcategory);
    } catch (error) {
      console.error(t('parts.documents.loadError'), error);
    }
  };

  const handleFilesUploaded = (files, tempId, operation = 'add', fileId = null) => {
    if (operation === 'delete') {
      // Pour une suppression, mettre à jour toutes les sous-catégories
      setUploadedFiles(prev => {
        const updatedFiles = { ...prev };
        
        Object.keys(updatedFiles).forEach(subcategory => {
          updatedFiles[subcategory] = updatedFiles[subcategory].filter(file => file.id !== fileId);
        });
        
        return updatedFiles;
      });
    } else if (operation === 'standby') {
      // En mode standby, stocker les fichiers dans notre état local
      setPendingFiles(files);
    } else {
      // Mode normal : ajouter les fichiers uploadés
      const subcategory = files.length > 0 && files[0].subcategory ? files[0].subcategory : 'part_documents';
      
      setUploadedFiles(prev => ({
        ...prev,
        [subcategory]: [...(prev[subcategory] || []), ...files]
      }));
    }
  };

  // Fonction pour enregistrer les références aux fonctions d'upload
  const handleUploaderReady = (uploadPendingFiles, getPendingFiles) => {
    uploaderRef.current = { uploadPendingFiles, getPendingFiles };
  };

  // Exposer la fonction d'association de fichiers
  useEffect(() => {
    if (onFileAssociationNeeded && uploaderRef.current) {
      // Créer la fonction d'association qui utilise nos fichiers stockés localement
      const associationFunction = createAssociationFunction(
        uploaderRef.current.uploadPendingFiles,
        () => pendingFiles,
        'documents',
        'part_documents'
      );
      
      // Exposer au composant parent
      onFileAssociationNeeded(associationFunction);
    }
  }, [onFileAssociationNeeded, createAssociationFunction, pendingFiles]);
  
  return (
    <>
      <div className="p-2">
        <FileUploader
          category="documents"
          subcategory="part_documents"
          nodeId={partNodeId}
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
          title={t('parts.documents.uploadTitle')}
          fileIcon={faFile}
          height="150px"
          width="100%"
          showPreview={true}
          existingFiles={Object.values(uploadedFiles).flat()}
          viewMode={viewMode}
        />
      </div>
    </>
  );
};

export default DocumentsSection;
