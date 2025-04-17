import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../common/FileUploader/FileUploader';
import fileService from '../../../../services/fileService';
import { faFile } from '@fortawesome/free-solid-svg-icons';

const DocumentsSection = ({
  orderNodeId,
  onFileAssociationNeeded
}) => {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [tempIds, setTempIds] = useState({});
  
  // Utilisez une référence pour stocker tempIds sans déclencher de re-renders
  const tempIdsRef = useRef({});
  
  // Mettez à jour la référence quand tempIds change
  useEffect(() => {
    tempIdsRef.current = tempIds;
    console.log("tempIdsRef updated:", tempIdsRef.current);
  }, [tempIds]);
  
  // Charger les fichiers existants pour le mode édition
  useEffect(() => {
    if (orderNodeId) {
      loadExistingFiles();
    }
  }, [orderNodeId]);
  
  const loadExistingFiles = async () => {
    try {
      const response = await fileService.getFilesByNode(orderNodeId, { category: 'documents' });
      
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
  
  // Fonction pour associer les fichiers temporaires au nouvel ordre créé
  const associateFiles = useCallback(async (newNodeId) => {
    console.log("associateFiles called with nodeId:", newNodeId);
    console.log("Current tempIds in ref:", tempIdsRef.current);
    
    try {
      const promises = [];
      
      // Parcourir tous les tempIds enregistrés et lancer les requêtes d'association
      Object.entries(tempIdsRef.current).forEach(([subcategory, tempId]) => {
        if (tempId) {
          console.log(`Associating files for subcategory ${subcategory} with tempId ${tempId}`);
          // Créer une promesse pour chaque tempId
          const promise = fileService.associateFiles(newNodeId, tempId, {
            category: 'documents',
            subcategory: subcategory
          });
          promises.push(promise);
        }
      });
      
      // Attendre que toutes les requêtes soient terminées
      if (promises.length > 0) {
        console.log(`Starting ${promises.length} file association requests`);
        const results = await Promise.all(promises);
        console.log("File association results:", results);
        console.log(`${promises.length} groupes de fichiers associés au nœud ${newNodeId}`);
        
        // Réinitialiser les tempIds après association réussie
        setTempIds({});
      } else {
        console.log("No files to associate");
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'association des fichiers:', error);
      return false;
    }
  }, []);
  
  // Expose la méthode d'association au composant parent
  useEffect(() => {
    if (onFileAssociationNeeded) {
      console.log("Registering file association function");
      onFileAssociationNeeded(associateFiles);
    }
  }, [associateFiles, onFileAssociationNeeded]);
  
  const handleFilesUploaded = (files, newTempId, subcategory) => {
    console.log(`Files uploaded for subcategory ${subcategory}:`, files);
    console.log(`Received tempId: ${newTempId}`);
    
    // Mettre à jour la liste des fichiers téléchargés
    setUploadedFiles(prev => ({
      ...prev,
      [subcategory]: [...(prev[subcategory] || []), ...files]
    }));
    
    // Stocker le tempId pour cette sous-catégorie UNIQUEMENT s'il est défini
    if (newTempId) {
      console.log(`Storing tempId ${newTempId} for subcategory ${subcategory}`);
      setTempIds(prev => ({
        ...prev,
        [subcategory]: newTempId
      }));
      
      // Mettre à jour directement la référence aussi pour plus de sécurité
      tempIdsRef.current = {
        ...tempIdsRef.current,
        [subcategory]: newTempId
      };
      console.log("Updated tempIdsRef directly:", tempIdsRef.current);
    }
  };
  
  return (
    <>
      <div className="p-2">
        <FileUploader
          category="documents"
          subcategory="all_documents"
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
