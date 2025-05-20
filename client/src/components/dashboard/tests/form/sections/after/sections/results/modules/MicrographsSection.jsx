import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import CollapsibleSection from '../../../../../../../../common/CollapsibleSection/CollapsibleSection';
import FileUploader from '../../../../../../../../common/FileUploader/FileUploader';
import fileService from '../../../../../../../../../services/fileService';
import { faImage } from '@fortawesome/free-solid-svg-icons';

const MicrographsSection = ({
  testNodeId,
  resultIndex = 0,  // Ajout d'un index par défaut
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
    { id: 'x50', name: t('tests.after.results.micrographs.zoomX50') },
    { id: 'x500', name: t('tests.after.results.micrographs.zoomX500') },
    { id: 'x1000', name: t('tests.after.results.micrographs.zoomX1000') },
    { id: 'other', name: t('tests.after.results.micrographs.otherZoom') },
  ];
  
  useEffect(() => {
    if (testNodeId) {
      loadExistingFiles();
    }
  }, [testNodeId, resultIndex]);
  
  const loadExistingFiles = async () => {
    try {
      const response = await fileService.getFilesByNode(testNodeId, {
        category: `micrographs-result-${resultIndex}`,  // Modification ici
      });
      
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
      console.error(t('tests.after.results.micrographs.loadError'), error);
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
      // Pour l'ajout, mettre à jour la sous-catégorie spécifique
      const subcategory = files.length > 0 && files[0].subcategory ? files[0].subcategory : 'x50';
      
      setUploadedFiles(prev => ({
        ...prev,
        [subcategory]: [...(prev[subcategory] || []), ...files]
      }));
      
      if (newTempId) {
        setTempIds(prev => ({
          ...prev,
          [subcategory]: newTempId
        }));
      }
    }
  };
  
  const associateFiles = useCallback(async (newTestNodeId) => {
    try {
      const currentTempIds = tempIdsRef.current;
      
      for (const [subcategory, tempId] of Object.entries(currentTempIds)) {
        await fileService.associateFiles(newTestNodeId, tempId, {
          category: `micrographs-result-${resultIndex}`,  // Modification ici
          subcategory
        });
      }
      
      setTempIds({});
      
      if (newTestNodeId === testNodeId) {
        loadExistingFiles();
      }
    } catch (error) {
      console.error(t('tests.after.results.micrographs.associateError'), error);
    }
  }, [testNodeId, resultIndex]);
  
  useEffect(() => {
    if (onFileAssociationNeeded) {
      onFileAssociationNeeded(associateFiles);
    }
  }, [onFileAssociationNeeded, associateFiles]);
  
  return (
    <>
      {views.map((view) => (
        <CollapsibleSection
          key={`${resultIndex}-${view.id}`}
          title={view.name}
          isExpandedByDefault={view.id === 'x50'}
          sectionId={`test-micrographs-${resultIndex}-${view.id}`}
          rememberState={true}
          className="mb-3"
          level={2}
        >
          <div className="p-2">
            <FileUploader
              category={`micrographs-result-${resultIndex}`}  // Modification ici
              subcategory={view.id}
              nodeId={testNodeId}
              onFilesUploaded={(files, newTempId, operation, fileId) => handleFilesUploaded(files, newTempId, operation, fileId)}
              maxFiles={5}
              acceptedFileTypes={{
                'application/pdf': ['.pdf'],
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'application/vnd.ms-excel': ['.xls'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'image/*': ['.png', '.jpg', '.jpeg']
              }}
              title={t('tests.after.results.micrographs.import', { name: view.name.toLowerCase() })}
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
