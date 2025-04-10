import React, { useState, useEffect, useCallback, useRef } from 'react';
import CollapsibleSection from '../../../../common/CollapsibleSection/CollapsibleSection';
import FileUploader from '../../../../common/FileUploader/FileUploader';
import fileService from '../../../../../services/fileService';
import { faImage } from '@fortawesome/free-solid-svg-icons';

const MicrographsSection = ({ 
  testNodeId, 
  resultIndex = 0,  // Ajout d'un index par défaut
  onFileAssociationNeeded, 
}) => {
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [tempIds, setTempIds] = useState({});
  
  const tempIdsRef = useRef({});
  
  useEffect(() => {
    tempIdsRef.current = tempIds;
  }, [tempIds]);

  const views = [
    { id: 'x50', name: 'Zoom x50' },
    { id: 'x500', name: 'Zoom x500' },
    { id: 'x1000', name: 'Zoom x1000' },
    { id: 'other', name: 'Autre Zoom' },
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
      console.error('Erreur lors du chargement des fichiers:', error);
    }
  };

  const handleFilesUploaded = (files, newTempId, subcategory) => {
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
      console.error('Erreur lors de l\'association des fichiers:', error);
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
              onFilesUploaded={(files, newTempId) => handleFilesUploaded(files, newTempId, view.id)}
              maxFiles={5}
              acceptedFileTypes={{
                'application/pdf': ['.pdf'],
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'application/vnd.ms-excel': ['.xls'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'image/*': ['.png', '.jpg', '.jpeg']
              }}
              title={`Importer un ${view.name.toLowerCase()}`}
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

export default MicrographsSection;