import React, { useState, useEffect, useCallback, useRef } from 'react';
import FileUploader from '../../../../../common/FileUploader/FileUploader';
import fileService from '../../../../../../services/fileService';
import { faFile, faImage } from '@fortawesome/free-solid-svg-icons';

const RecipeGraphSection = ({ 
  testNodeId, 
  onFileAssociationNeeded, 
}) => {
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
    if (testNodeId) {
      loadExistingFiles();
    }
  }, [testNodeId]);

  const loadExistingFiles = async () => {
    try {
      const response = await fileService.getFilesByNode(testNodeId, { category: 'recipe_graph' });

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
      console.error('Erreur lors du chargement des fichiers:', error);
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

  // Méthode pour associer les fichiers lors de la soumission du formulaire
  // Utilisez useCallback pour mémoriser cette fonction
  const associateFiles = useCallback(async (newTestNodeId) => {
    try {
      // Utilisez la référence pour obtenir les tempIds les plus récents
      const currentTempIds = tempIdsRef.current;
      
      // Parcourir tous les tempIds et les associer
      for (const [subcategory, tempId] of Object.entries(currentTempIds)) {
        await fileService.associateFiles(newTestNodeId, tempId, { 
          category: 'recipe_graph', 
          subcategory 
        });
      }
      
      // Réinitialiser les tempIds
      setTempIds({});
      
      // Recharger les fichiers pour mettre à jour l'affichage si on met à jour la pièce existante
      if (newTestNodeId === testNodeId) {
        loadExistingFiles();
      }
    } catch (error) {
      console.error('Erreur lors de l\'association des fichiers:', error);
    }
  }, [testNodeId]); // Ne dépend que de testNodeId, pas de tempIds

  // Exposer la méthode d'association via le prop onFileAssociationNeeded
  // Ne s'exécute qu'une fois lors du montage du composant ou si onFileAssociationNeeded change
  useEffect(() => {
    if (onFileAssociationNeeded) {
      onFileAssociationNeeded(associateFiles);
    }
  }, [onFileAssociationNeeded, associateFiles]);

  return (
    <>
      <div className="p-2">
        <FileUploader
          category="recipe_graph"
          subcategory={'recipe_graph'}
          nodeId={testNodeId}
          onFilesUploaded={(files, newTempId) => handleFilesUploaded(files, newTempId, 'recipe_graph')}
          maxFiles={5}
          acceptedFileTypes="*"
          title={`Importer un graphique`}
          fileIcon={faFile}
          height="150px"
          width="100%"
          showPreview={true}
          existingFiles={uploadedFiles['recipe_graph'] || []}
        />
      </div>
    </>
  );
};

export default RecipeGraphSection;
