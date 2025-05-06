import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../../common/FileUploader/FileUploader';
import fileService from '../../../../../services/fileService';
import { faImage } from '@fortawesome/free-solid-svg-icons';

const ControlLocationSection = ({
  testNodeId,
  resultIndex = 0,
  onFileAssociationNeeded,
}) => {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [tempId, setTempId] = useState(null);
  const tempIdRef = useRef(null);
  
  useEffect(() => {
    tempIdRef.current = tempId;
  }, [tempId]);
  
  useEffect(() => {
    if (testNodeId) {
      loadExistingFiles();
    }
  }, [testNodeId, resultIndex]);
  
  const loadExistingFiles = async () => {
    try {
      const response = await fileService.getFilesByNode(testNodeId, {
        category: `control-location-result-${resultIndex}`,
      });
      
      setUploadedFiles(response.data.files || []);
    } catch (error) {
      console.error(t('tests.after.results.controlLocation.loadError'), error);
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
  };
  
  const associateFiles = useCallback(async (newTestNodeId) => {
    try {
      if (tempIdRef.current) {
        await fileService.associateFiles(newTestNodeId, tempIdRef.current, {
          category: `control-location-result-${resultIndex}`,
        });
        
        setTempId(null);
        
        if (newTestNodeId === testNodeId) {
          loadExistingFiles();
        }
      }
    } catch (error) {
      console.error(t('tests.after.results.controlLocation.associateError'), error);
    }
  }, [testNodeId, resultIndex]);
  
  useEffect(() => {
    if (onFileAssociationNeeded) {
      onFileAssociationNeeded(associateFiles);
    }
  }, [onFileAssociationNeeded, associateFiles]);
  
  return (
    <div className="p-2">
      <FileUploader
        category={`control-location-result-${resultIndex}`}
        subcategory="control-location"
        nodeId={testNodeId}
        onFilesUploaded={(files, newTempId, operation, fileId) => handleFilesUploaded(files, newTempId, operation, fileId)}
        maxFiles={5}
        acceptedFileTypes={{
          'image/*': ['.png', '.jpg', '.jpeg']
        }}
        title={t('tests.after.results.controlLocation.import')}
        fileIcon={faImage}
        height="150px"
        width="100%"
        showPreview={true}
        existingFiles={uploadedFiles}
      />
    </div>
  );
};

export default ControlLocationSection;