import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../../../../../common/FileUploader/FileUploader';
import fileService from '../../../../../../../../services/fileService';
import useFileAssociation from '../../../../../../../../hooks/useFileAssociation';
import { faFile } from '@fortawesome/free-solid-svg-icons';

const LoadDesignSection = ({
  testNodeId,
  onFileAssociationNeeded,
  viewMode = false
}) => {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]); // Nouveau : stocker les fichiers en attente
  
  // Hook pour gérer l'association des fichiers
  const { createAssociationFunction } = useFileAssociation();
  
  // Référence pour stocker les fonctions d'upload
  const uploaderRef = useRef(null);

  // Charger les fichiers existants
  useEffect(() => {
    if (testNodeId) {
      loadExistingFiles();
    }
  }, [testNodeId]);

  const loadExistingFiles = async () => {
    try {
      const response = await fileService.getNodeFiles(testNodeId, { category: 'load_design' });
      
      if (!response.data || response.data.success === false) {
        console.error(t('tests.before.loadDesign.loadFilesError'), response.data?.message);
        return;
      }
      
      const files = response.data.data?.files || [];
      setUploadedFiles(files);
    } catch (error) {
      console.error(t('tests.before.loadDesign.loadFilesError'), error);
    }
  };
  const handleFilesUploaded = (files, newTempId, operation = 'add', fileId = null) => {
    if (operation === 'delete') {
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    } else if (operation === 'standby') {
      // En mode standby, stocker les fichiers dans notre état local
      console.log("📦 [LoadDesignSection] Storing pending files:", files.map(f => f.name));
      setPendingFiles(files);
    } else {
      // Mode normal : ajouter les fichiers uploadés
      setUploadedFiles(prev => [...prev, ...files]);
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
        () => {
          console.log("📋 [LoadDesignSection] getPendingFiles called, returning:", pendingFiles.map(f => f.name));
          return pendingFiles; // Utiliser nos fichiers stockés localement
        },
        'load_design',
        'load_design'
      );
      
      // Exposer au composant parent
      onFileAssociationNeeded(associationFunction);
    }
  }, [onFileAssociationNeeded, createAssociationFunction, pendingFiles]); // Ajouter pendingFiles comme dépendance
  return (
    <div className="p-2">
      <FileUploader
        category="load_design"
        subcategory="load_design"
        nodeId={testNodeId}
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
        title={t('tests.before.loadDesign.importLoadDesign')}
        fileIcon={faFile}
        height="150px"
        width="100%"
        showPreview={true}
        existingFiles={uploadedFiles}
        readOnly={viewMode}
      />
    </div>
  );
};

export default LoadDesignSection;
