import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../common/FileUploader/FileUploader';
import fileService from '../../../../services/fileService';
import { faFile } from '@fortawesome/free-solid-svg-icons';

const DocumentsSection = ({
  orderNodeId
}) => {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [tempIds, setTempIds] = useState({});
  
  // Utilisez une référence pour stocker tempIds sans déclencher de re-renders
  const tempIdsRef = useRef({});
  
  // Mettez à jour la référence quand tempIds change
  useEffect(() => {
    tempIdsRef.current = tempIds;
  }, [tempIds]);
  
  // Charger les fichiers existants
  useEffect(() => {
    if (orderNodeId) {
      loadExistingFiles();
    }
  }, [orderNodeId]);
  
  const loadExistingFiles = async () => {
    try {
      const response = await fileService.getFilesByNode(orderNodeId, { category: 'documents' });
      console.log('Réponse de récupération des fichiers', response.data);
      
      // Organiser les fichiers par sous-catégorie
      const filesBySubcategory = {};
      response.data.files.forEach(file => {
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
  
  const handleFilesUploaded = (files, newTempId, operation = 'add', fileId = null) => {
    if (operation === 'delete') {
      // Pour une suppression, mettre à jour uniquement la sous-catégorie concernée
      setUploadedFiles(prev => {
        // Trouver la sous-catégorie qui contient ce fichier
        const updatedFiles = { ...prev };
        
        // Parcourir toutes les sous-catégories pour trouver et supprimer le fichier
        Object.keys(updatedFiles).forEach(subcategory => {
          updatedFiles[subcategory] = updatedFiles[subcategory].filter(file => file.id !== fileId);
        });
        
        return updatedFiles;
      });
    } else {
      // Pour l'ajout, mettre à jour la sous-catégorie spécifique
      const subcategory = files.length > 0 && files[0].subcategory ? files[0].subcategory : 'all_documents';
      
      setUploadedFiles(prev => {
        const updatedFiles = { ...prev };
        // Garantir que la sous-catégorie existe
        if (!updatedFiles[subcategory]) {
          updatedFiles[subcategory] = [];
        }
        // Ajouter les nouveaux fichiers
        updatedFiles[subcategory] = [...updatedFiles[subcategory], ...files];
        return updatedFiles;
      });
      
      // Stocker le tempId pour cette sous-catégorie si fourni
      if (newTempId) {
        setTempIds(prev => ({
          ...prev,
          [subcategory]: newTempId
        }));
      }
    }
  };
  
  return (
    <>
      <div className="p-2">
        <FileUploader
          category="documents"
          subcategory={'all_documents'}
          nodeId={orderNodeId}
          onFilesUploaded={handleFilesUploaded}
          maxFiles={5}
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
          existingFiles={uploadedFiles['all_documents'] || []}
        />
      </div>
    </>
  );
};

export default DocumentsSection;
