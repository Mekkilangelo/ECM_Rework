import React, { useState, useEffect, useCallback, useRef } from 'react';
import CollapsibleSection from '../../../../../common/CollapsibleSection/CollapsibleSection';
import FileUploader from '../../../../../common/FileUploader/FileUploader';
import fileService from '../../../../../../services/fileService';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const PhotosSection = ({
  partNodeId,
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
    console.log("PhotosSection tempIdsRef updated:", tempIdsRef.current);
  }, [tempIds]);

  // Configuration des différentes vues
  const views = [
    { id: 'front', name: t('parts.photos.views.front') },
    { id: 'profile', name: t('parts.photos.views.profile') },
    { id: 'quarter', name: t('parts.photos.views.quarter') },
    { id: 'other', name: t('parts.photos.views.other') },
  ];

  // Charger les fichiers existants
  useEffect(() => {
    if (partNodeId) {
      loadExistingFiles();
    }
  }, [partNodeId]);
  const loadExistingFiles = async () => {
    try {
      const response = await fileService.getNodeFiles(partNodeId, { category: 'photos' });

      console.log('Réponse de récupération des fichiers', response.data);

      // Vérifier que la requête a réussi
      if (!response.data || response.data.success === false) {
        console.error(t('parts.photos.loadError'), response.data?.message);
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
      console.error(t('parts.photos.loadError'), error);
    }
  };

  const handleFilesUploaded = (files, newTempId, operation = 'add', fileId = null) => {
    if (operation === 'delete') {
      // Pour une suppression, mettre à jour toutes les sous-catégories
      setUploadedFiles(prev => {
        const updatedFiles = { ...prev };
        
        // Parcourir toutes les sous-catégories pour trouver et supprimer le fichier
        Object.keys(updatedFiles).forEach(subcategory => {
          updatedFiles[subcategory] = updatedFiles[subcategory].filter(file => file.id !== fileId);
        });
        
        return updatedFiles;
      });
    } else {
      console.log(`Files uploaded for subcategory ${files[0]?.subcategory}:`, files);
      console.log(`Received tempId: ${newTempId}`);
      
      const subcategory = files.length > 0 && files[0].subcategory ? files[0].subcategory : 'front';
      
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
    }
  };

  // Fonction pour associer les fichiers temporaires au nouvelle pièce créée
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
            category: 'photos',
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
        
        // Vérifier que toutes les associations ont réussi
        const allSuccessful = results.every(result => result.data && result.data.success);
        
        if (!allSuccessful) {
          console.error(t('parts.photos.associateError'), results);
          return false;
        }
        
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
      console.log("Registering file association function in PhotosSection");
      onFileAssociationNeeded(associateFiles);
    }
  }, [associateFiles, onFileAssociationNeeded]);

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
          level={1}
        >
          <div className="p-2">
            <FileUploader
              category="photos"
              subcategory={view.id}
              nodeId={partNodeId}
              onFilesUploaded={(files, newTempId, operation, fileId) => handleFilesUploaded(files, newTempId, operation, fileId)}
              maxFiles={5}
              acceptedFileTypes="image/*"
              title={t('parts.photos.upload', { view: view.name.toLowerCase() })}
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
