import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import CollapsibleSection from '../../../../../../../../common/CollapsibleSection/CollapsibleSection';
import FileUploader from '../../../../../../../../common/FileUploader/FileUploader';
import fileService from '../../../../../../../../../services/fileService';
import { faImage } from '@fortawesome/free-solid-svg-icons';

const MicrographsSection = ({
  trialNodeId,
  resultIndex = 0,
  sampleIndex = 0,  // Ajout du sampleIndex
  onFileAssociationNeeded,
  viewMode = false
}) => {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [tempIds, setTempIds] = useState({});
  const tempIdsRef = useRef({});
  
  useEffect(() => {
    tempIdsRef.current = tempIds;
  }, [tempIds]);
  
  const views = [
    { id: 'x50', name: t('trials.after.results.micrographs.zoomX50') },
    { id: 'x500', name: t('trials.after.results.micrographs.zoomX500') },
    { id: 'x1000', name: t('trials.after.results.micrographs.zoomX1000') },
    { id: 'other', name: t('trials.after.results.micrographs.otherZoom') },
  ];
    useEffect(() => {
    if (trialNodeId) {
      loadExistingFiles();
    }
  }, [trialNodeId, resultIndex, sampleIndex]);
    const loadExistingFiles = async () => {
    try {
      // Charger tous les fichiers micrographs pour ce nœud
      const response = await fileService.getNodeFiles(trialNodeId, {
        category: 'micrographs',
      });
      
      // Vérifier que la requête a réussi
      if (!response.data || response.data.success === false) {
        console.error(t('trials.after.results.micrographs.loadError'), response.data?.message);
        return;
      }
      
      const filesBySubcategory = {};
      const files = response.data.data?.files || [];
      
      // Filtrer et grouper les fichiers pour ce résultat et échantillon spécifique
      const pattern = `result-${resultIndex}-sample-${sampleIndex}-`;
      files.forEach(file => {
        if (file.subcategory && file.subcategory.startsWith(pattern)) {
          // Extraire le grossissement (ex: "result-0-sample-0-x100" -> "x100")
          const magnification = file.subcategory.substring(pattern.length);
          if (!filesBySubcategory[magnification]) {
            filesBySubcategory[magnification] = [];
          }
          filesBySubcategory[magnification].push(file);
        }
      });
      
      setUploadedFiles(filesBySubcategory);
    } catch (error) {
      console.error(t('trials.after.results.micrographs.loadError'), error);
    }
  };
  
  const handleFilesUploaded = useCallback((viewId) => (files, newTempId, operation = 'add', fileId = null) => {
    if (operation === 'delete') {
      // Pour une suppression, mettre à jour la sous-catégorie spécifique
      setUploadedFiles(prev => ({
        ...prev,
        [viewId]: (prev[viewId] || []).filter(file => file.id !== fileId)
      }));
    } else if (operation === 'update') {
      // Pour une mise à jour (description), mettre à jour les fichiers existants
      setUploadedFiles(prev => ({
        ...prev,
        [viewId]: files
      }));
    } else {
      // Pour l'ajout, mettre à jour la sous-catégorie spécifique (viewId)
      setUploadedFiles(prev => ({
        ...prev,
        [viewId]: [...(prev[viewId] || []), ...files]
      }));
      
      if (newTempId) {
        setTempIds(prev => ({
          ...prev,
          [viewId]: newTempId
        }));
      }
    }
  }, []);  const associateFiles = useCallback(async (newTrialNodeId) => {
    try {
      const currentTempIds = tempIdsRef.current;
      let allSuccessful = true;
      
      for (const [magnification, tempId] of Object.entries(currentTempIds)) {
        const response = await fileService.associateFiles(newTrialNodeId, tempId, {
          category: 'micrographs',
          subcategory: `result-${resultIndex}-sample-${sampleIndex}-${magnification}`
        });
        
        // Vérifier que l'association a réussi
        if (!response.data || response.data.success === false) {
          console.error(t('trials.after.results.micrographs.associateError'), response.data?.message);
          allSuccessful = false;
        }
      }
      
      if (allSuccessful) {
        setTempIds({});
        
        if (newTrialNodeId === trialNodeId) {
          loadExistingFiles();
        }
      }
    } catch (error) {
      console.error(t('trials.after.results.micrographs.associateError'), error);
    }
  }, [trialNodeId, resultIndex, sampleIndex]);
  
  useEffect(() => {
    if (onFileAssociationNeeded) {
      onFileAssociationNeeded(associateFiles);
    }
  }, [onFileAssociationNeeded, associateFiles]);
    return (
    <>
      {views.map((view) => (
        <CollapsibleSection
          key={`${resultIndex}-${sampleIndex}-${view.id}`}  // Mise à jour de la clé
          title={view.name}
          isExpandedByDefault={view.id === 'x50'}
          sectionId={`trial-micrographs-${resultIndex}-${sampleIndex}-${view.id}`}  // Mise à jour de l'ID
          rememberState={true}
          className="mb-3"
          level={2}
        >
          <div className="p-2">
            <FileUploader
              category="micrographs"
              subcategory={`result-${resultIndex}-sample-${sampleIndex}-${view.id}`}
              nodeId={trialNodeId}
              onFilesUploaded={handleFilesUploaded(view.id)}
              maxFiles={50}
              acceptedFileTypes={{
                'application/pdf': ['.pdf'],
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'application/vnd.ms-excel': ['.xls'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'image/*': ['.png', '.jpg', '.jpeg']
              }}
              title={t('trials.after.results.micrographs.import', { name: view.name.toLowerCase() })}
              fileIcon={faImage}
              height="150px"
              width="100%"
              showPreview={true}
              existingFiles={uploadedFiles[view.id] || []}
              readOnly={viewMode}
            />
          </div>
        </CollapsibleSection>
      ))}
    </>
  );
}; 

export default MicrographsSection;
