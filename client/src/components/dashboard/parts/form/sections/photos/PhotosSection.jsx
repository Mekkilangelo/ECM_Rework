import React, { useState, useEffect, useRef } from 'react';
import CollapsibleSection from '../../../../../common/CollapsibleSection/CollapsibleSection';
import FileUploader from '../../../../../common/FileUploader/FileUploader';
import fileService from '../../../../../../services/fileService';
import useFileAssociation from '../../../../../../hooks/useFileAssociation';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const PhotosSection = ({
  partNodeId,
  onFileAssociationNeeded,
  viewMode = false
}) => {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [pendingFilesByView, setPendingFilesByView] = useState({}); // Nouveau : stocker les fichiers en attente par vue
  
  // Hook pour gérer l'association des fichiers
  const { createAssociationFunction, combineAssociationFunctions } = useFileAssociation();
  
  // Références pour stocker les fonctions d'upload pour chaque vue
  const uploaderRefs = useRef({});
  // Configuration des différentes vues - déplacée en dehors pour éviter les re-créations
  const views = React.useMemo(() => [
    { id: 'front', name: t('parts.photos.views.front') },
    { id: 'profile', name: t('parts.photos.views.profile') },
    { id: 'quarter', name: t('parts.photos.views.quarter') },
    { id: 'other', name: t('parts.photos.views.other') },
  ], [t]);

  // Charger les fichiers existants
  useEffect(() => {
    if (partNodeId) {
      loadExistingFiles();
    }
  }, [partNodeId]);  const loadExistingFiles = async () => {
    try {
      const response = await fileService.getNodeFiles(partNodeId, { category: 'photos' });
      
      // LOG récupération
      console.log('[PhotosSection] GET files params:', { nodeId: partNodeId, category: 'photos' });
      if (response.data?.data?.files) {
        console.log('[PhotosSection] Fichiers reçus (objets complets):', response.data.data.files);
      }

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
        // LOG mapping
        console.log(`[PhotosSection] Mapping file id=${file.id} name=${file.name} subcategory=${file.subcategory} -> clé ${subcategory}`);
      });

      setUploadedFiles(filesBySubcategory);
    } catch (error) {
      console.error(t('parts.photos.loadError'), error);
    }
  };
  const handleFilesUploaded = React.useCallback((viewId) => (files, tempId, operation = 'add', fileId = null) => {
    // LOG upload
    console.log(`[PhotosSection] handleFilesUploaded viewId=${viewId} operation=${operation} files=`, files.map(f => ({ name: f.name, subcategory: f.subcategory })));
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
    } else if (operation === 'standby') {
      // En mode standby, stocker les fichiers dans notre état local par vue
      setPendingFilesByView(prev => ({
        ...prev,
        [viewId]: files
      }));
    } else {
      // Mode normal : ajouter les fichiers uploadés
      const subcategory = files.length > 0 && files[0].subcategory ? files[0].subcategory : viewId;
      
      setUploadedFiles(prev => ({
        ...prev,
        [subcategory]: [...(prev[subcategory] || []), ...files]
      }));
    }
  }, []);
  
  // Fonction pour enregistrer les références aux fonctions d'upload pour chaque vue
  const handleUploaderReady = React.useCallback((viewId) => (uploadPendingFiles, getPendingFiles) => {
    uploaderRefs.current[viewId] = { uploadPendingFiles, getPendingFiles };
  }, []);// Exposer la fonction d'association de fichiers
  useEffect(() => {
    if (onFileAssociationNeeded && Object.keys(uploaderRefs.current).length > 0) {
      // Créer des fonctions d'association pour chaque vue
      const associationFunctions = views.map(view => {
        const uploaderRef = uploaderRefs.current[view.id];
        if (uploaderRef) {
          return createAssociationFunction(
            uploaderRef.uploadPendingFiles,
            () => pendingFilesByView[view.id] || [], // Utiliser nos fichiers stockés localement
            'photos',
            view.id
          );
        }
        return null;
      }).filter(Boolean);
      
      if (associationFunctions.length > 0) {
        // Combiner toutes les fonctions d'association
        const combinedAssociationFunction = combineAssociationFunctions(associationFunctions);
        
        // Exposer au composant parent
        onFileAssociationNeeded(combinedAssociationFunction);
      }
    }
  }, [onFileAssociationNeeded, createAssociationFunction, combineAssociationFunctions, pendingFilesByView]); // Suppression de 'views' des dépendances

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
          <div className="p-2">            <FileUploader
              category="photos"
              subcategory={view.id}
              nodeId={partNodeId}
              onFilesUploaded={handleFilesUploaded(view.id)}
              onUploaderReady={handleUploaderReady(view.id)}
              maxFiles={5}
              acceptedFileTypes={{ 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] }}
              title={t('parts.photos.upload', { view: view.name.toLowerCase() })}
              fileIcon={faImage}
              height="150px"
              width="100%"
              showPreview={true}
              existingFiles={uploadedFiles[view.id] || []}
              viewMode={viewMode}
            />
          </div>
        </CollapsibleSection>
      ))}
    </>
  );
};

export default PhotosSection;
