import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../../common/FileUploader/FileUploader';
import fileService from '../../../../../services/fileService';
import { faFile } from '@fortawesome/free-solid-svg-icons';

const LoadDesignSection = ({
  testNodeId,
  onFileAssociationNeeded,
}) => {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [tempIds, setTempIds] = useState({});
  
  // Utilisez une référence pour stocker tempIds sans déclencher de re-renders
  const tempIdsRef = useRef({});
  
  // Mettez à jour la référence quand tempIds change
  useEffect(() => {
    tempIdsRef.current = tempIds;
    console.log("LoadDesignSection tempIdsRef updated:", tempIdsRef.current);
  }, [tempIds]);
  
  // Charger les fichiers existants
  useEffect(() => {
    if (testNodeId) {
      loadExistingFiles();
    }
  }, [testNodeId]);
  
  const loadExistingFiles = async () => {
    try {
      const response = await fileService.getFilesByNode(testNodeId, { category: 'load_design' });
      console.log(t('tests.before.loadDesign.responseFilesMessage'), response.data);
      
      // Organiser les fichiers par sous-catégorie
      const filesBySubcategory = {};
      response.data.files.forEach(file => {
        const subcategory = file.subcategory || 'load_design';
        if (!filesBySubcategory[subcategory]) {
          filesBySubcategory[subcategory] = [];
        }
        filesBySubcategory[subcategory].push(file);
      });
      setUploadedFiles(filesBySubcategory);
    } catch (error) {
      console.error(t('tests.before.loadDesign.loadFilesError'), error);
    }
  };
  
  const handleFilesUploaded = (files, newTempId, subcategory) => {
    console.log(`Files uploaded for subcategory ${subcategory}:`, files);
    console.log(`Received tempId: ${newTempId}`);
    
    // Mettre à jour la liste des fichiers téléchargés
    setUploadedFiles(prev => ({
      ...prev,
      [subcategory]: [...(prev[subcategory] || []), ...files]
    }));
    
    // Stocker le tempId pour cette sous-catégorie
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
  
  // Méthode pour associer les fichiers lors de la soumission du formulaire
  // Utilisez useCallback pour mémoriser cette fonction
  const associateFiles = useCallback(async (newTestNodeId) => {
    console.log("associateFiles called with nodeId:", newTestNodeId);
    console.log("Current tempIds in ref:", tempIdsRef.current);
    
    try {
      const promises = [];
      
      // Parcourir tous les tempIds et les associer
      Object.entries(tempIdsRef.current).forEach(([subcategory, tempId]) => {
        if (tempId) {
          console.log(`Associating files for subcategory ${subcategory} with tempId ${tempId}`);
          const promise = fileService.associateFiles(newTestNodeId, tempId, {
            category: 'load_design',
            subcategory
          });
          promises.push(promise);
        }
      });
      
      // Attendre que toutes les requêtes soient terminées
      if (promises.length > 0) {
        console.log(`Starting ${promises.length} file association requests`);
        const results = await Promise.all(promises);
        console.log("File association results:", results);
        
        // Réinitialiser les tempIds
        setTempIds({});
      } else {
        console.log("No files to associate");
      }
      
      // Recharger les fichiers pour mettre à jour l'affichage si on met à jour le test existant
      if (newTestNodeId === testNodeId) {
        loadExistingFiles();
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'association des fichiers:', error);
      return false;
    }
  }, [testNodeId, t]);
  
  // Exposer la méthode d'association via le prop onFileAssociationNeeded
  // Ne s'exécute qu'une fois lors du montage du composant ou si onFileAssociationNeeded change
  useEffect(() => {
    if (onFileAssociationNeeded) {
      console.log("Registering file association function in LoadDesignSection");
      onFileAssociationNeeded(associateFiles);
    }
  }, [onFileAssociationNeeded, associateFiles]);
  
  return (
    <>
      <div className="p-2">
        <FileUploader
          category="load_design"
          subcategory={'load_design'}
          nodeId={testNodeId}
          onFilesUploaded={(files, newTempId) => handleFilesUploaded(files, newTempId, 'load_design')}
          maxFiles={5}
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
          existingFiles={uploadedFiles['load_design'] || []}
        />
      </div>
    </>
  );
};

export default LoadDesignSection;
