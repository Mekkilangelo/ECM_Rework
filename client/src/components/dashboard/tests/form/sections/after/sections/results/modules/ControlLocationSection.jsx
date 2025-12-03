import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../../../../../../common/FileUploader/FileUploader';
import fileService from '../../../../../../../../../services/fileService';
import { faImage } from '@fortawesome/free-solid-svg-icons';

const ControlLocationSection = ({
  trialNodeId,
  resultIndex = 0,
  sampleIndex = 0,  // Ajout du sampleIndex
  onFileAssociationNeeded,
  viewMode = false
}) => {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [tempId, setTempId] = useState(null);
  const tempIdRef = useRef(null);
  
  useEffect(() => {
    tempIdRef.current = tempId;
  }, [tempId]);
    useEffect(() => {
    if (trialNodeId) {
      loadExistingFiles();
    }
  }, [trialNodeId, resultIndex, sampleIndex]);
    const loadExistingFiles = async () => {
    try {
      const response = await fileService.getNodeFiles(trialNodeId, {
        category: 'control-location',
        subcategory: `result-${resultIndex}-sample-${sampleIndex}`,
      });
      
      // Vérifier que la requête a réussi
      if (!response.data || response.data.success === false) {
        console.error(t('trials.after.results.controlLocation.loadError'), response.data?.message);
        return;
      }
      
      // S'assurer que nous accédons aux fichiers au bon endroit dans la réponse
      setUploadedFiles(response.data.data?.files || []);
    } catch (error) {
      console.error(t('trials.after.results.controlLocation.loadError'), error);
    }
  };
  
  const handleFilesUploaded = (files, newTempId, operation = 'add', fileId = null) => {
    if (operation === 'delete') {
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    } else {
      setUploadedFiles(prev => [...prev, ...files]);
      
      if (newTempId) {
        setTempId(newTempId);
      }
    }
  };  const associateFiles = useCallback(async (newTrialNodeId) => {
    try {
      if (tempIdRef.current) {
        const response = await fileService.associateFiles(newTrialNodeId, tempIdRef.current, {
          category: 'control-location',
          subcategory: `result-${resultIndex}-sample-${sampleIndex}`,
        });
        
        // Vérifier que l'association a réussi
        if (!response.data || response.data.success === false) {
          console.error(t('trials.after.results.controlLocation.associateError'), response.data?.message);
          return false;
        }
        
        setTempId(null);
        
        if (newTrialNodeId === trialNodeId) {
          loadExistingFiles();
        }
        
        return true;
      }
      return true; // Aucun fichier à associer
    } catch (error) {
      console.error(t('trials.after.results.controlLocation.associateError'), error);
      return false;
    }
  }, [trialNodeId, resultIndex, sampleIndex]);
  
  useEffect(() => {
    if (onFileAssociationNeeded) {
      onFileAssociationNeeded(associateFiles);
    }
  }, [onFileAssociationNeeded, associateFiles]);
    return (
    <div className="p-2">
      <FileUploader
        category="control-location"
        subcategory={`result-${resultIndex}-sample-${sampleIndex}`}
        nodeId={trialNodeId}
        onFilesUploaded={(files, newTempId, operation, fileId) => handleFilesUploaded(files, newTempId, operation, fileId)}
        maxFiles={50}
        acceptedFileTypes={{
          'image/*': ['.png', '.jpg', '.jpeg']
        }}
        title={t('trials.after.results.controlLocation.import')}
        fileIcon={faImage}
        height="150px"
        width="100%"
        showPreview={true}
        existingFiles={uploadedFiles}
        readOnly={viewMode}
      />
    </div>
  );
};

export default ControlLocationSection;