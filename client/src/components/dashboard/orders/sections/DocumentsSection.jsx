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
  
  const handleFilesUploaded = (files, newTempId, subcategory) => {
    // Mettre à jour la liste des fichiers téléchargés
    setUploadedFiles(prev => ({
      ...prev,
      [subcategory]: [...(prev[subcategory] || []), ...files]
    }));
    
    // Stocker le tempId pour cette sous-catégorie
    if (newTempId) {
      setTempIds(prev => ({
        ...prev,
        [subcategory]: newTempId
      }));
    }
  };
  
  return (
    <>
      <div className="p-2">
        <FileUploader
          category="documents"
          subcategory={'all_documents'}
          nodeId={orderNodeId}
          onFilesUploaded={(files, newTempId) => handleFilesUploaded(files, newTempId, 'all_documents')}
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
