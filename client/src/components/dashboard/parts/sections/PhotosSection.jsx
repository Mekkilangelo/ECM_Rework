import React, { useState, useEffect, useCallback, useRef } from 'react';
import CollapsibleSection from '../../../common/CollapsibleSection/CollapsibleSection';
import FileUploader from '../../../common/FileUploader/FileUploader';
import fileService from '../../../../services/fileService';
import { faImage } from '@fortawesome/free-solid-svg-icons';

const PhotosSection = ({ 
  partNodeId, 
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

  // Configuration des différentes vues
  const views = [
    { id: 'front', name: 'Vue de face' },
    { id: 'profile', name: 'Vue de profil' },
    { id: 'quarter', name: 'Vue de 3/4' },
    { id: 'other', name: 'Autre Vue' },
  ];

  // Charger les fichiers existants
  useEffect(() => {
    if (partNodeId) {
      loadExistingFiles();
    }
  }, [partNodeId]);

  const loadExistingFiles = async () => {
    try {
      const response = await fileService.getFilesByNode(partNodeId, { category: 'photos' });

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
  const associateFiles = useCallback(async (newPartNodeId) => {
    try {
      // Utilisez la référence pour obtenir les tempIds les plus récents
      const currentTempIds = tempIdsRef.current;
      
      // Parcourir tous les tempIds et les associer
      for (const [subcategory, tempId] of Object.entries(currentTempIds)) {
        await fileService.associateFiles(newPartNodeId, tempId, { 
          category: 'photos', 
          subcategory 
        });
      }
      
      // Réinitialiser les tempIds
      setTempIds({});
      
      // Recharger les fichiers pour mettre à jour l'affichage si on met à jour la pièce existante
      if (newPartNodeId === partNodeId) {
        loadExistingFiles();
      }
    } catch (error) {
      console.error('Erreur lors de l\'association des fichiers:', error);
    }
  }, [partNodeId]); // Ne dépend que de partNodeId, pas de tempIds

  // Exposer la méthode d'association via le prop onFileAssociationNeeded
  // Ne s'exécute qu'une fois lors du montage du composant ou si onFileAssociationNeeded change
  useEffect(() => {
    if (onFileAssociationNeeded) {
      onFileAssociationNeeded(associateFiles);
    }
  }, [onFileAssociationNeeded, associateFiles]);

  return (
    <>
      {views.map((view) => (
        <CollapsibleSection
          key={view.id}
          title={view.name}
          isExpandedByDefault={view.id === 'front'}
          sectionId={`part-photo-${view.id}`}
          rememberState={true}
          className="mb-3"
        >
          <div className="p-2">
            <FileUploader
              category="photos"
              subcategory={view.id}
              nodeId={partNodeId}
              onFilesUploaded={(files, newTempId) => handleFilesUploaded(files, newTempId, view.id)}
              maxFiles={5}
              acceptedFileTypes="image/*"
              title={`Importer une ${view.name.toLowerCase()}`}
              fileIcon={faImage}
              height="150px"
              width="100%"
              showPreview={true}
              existingFiles={uploadedFiles[view.id] || []}
            />
          </div>
        </CollapsibleSection>
      ))}
    </>
  );
};

export default PhotosSection;
