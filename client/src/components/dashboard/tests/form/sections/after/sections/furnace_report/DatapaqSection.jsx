import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../../../../../common/FileUploader/FileUploader';
import fileService from '../../../../../../../../services/fileService';
import { faFile } from '@fortawesome/free-solid-svg-icons';

const DatapaqSection = ({
  trialNodeId,
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
  }, [trialNodeId]);

  const loadExistingFiles = async () => {
    try {
      const response = await fileService.getNodeFiles(trialNodeId, {
        category: 'datapaq'
      });

      // Vérifier que la requête a réussi
      if (!response.data || response.data.success === false) {
        console.error(t('trials.after.datapaq.loadError'), response.data?.message);
        return;
      }

      // S'assurer que nous accédons aux fichiers au bon endroit dans la réponse
      setUploadedFiles(response.data.data?.files || []);
    } catch (error) {
      console.error(t('trials.after.datapaq.loadError'), error);
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

  const associateFiles = useCallback(async (newTrialNodeId) => {
    try {
      if (tempIdRef.current) {
        const response = await fileService.associateFiles(newTrialNodeId, tempIdRef.current, {
          category: 'datapaq'
        });

        // Vérifier que l'association a réussi
        if (!response.data || response.data.success === false) {
          console.error(t('trials.after.datapaq.associateError'), response.data?.message);
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
      console.error(t('trials.after.datapaq.associateError'), error);
      return false;
    }
  }, [trialNodeId, t]);

  useEffect(() => {
    if (onFileAssociationNeeded) {
      onFileAssociationNeeded(associateFiles);
    }
  }, [onFileAssociationNeeded, associateFiles]);

  return (
    <div className="p-2">
      <FileUploader
        category="datapaq"
        nodeId={trialNodeId}
        onFilesUploaded={(files, newTempId, operation, fileId) => handleFilesUploaded(files, newTempId, operation, fileId)}
        maxFiles={50}
        acceptedFileTypes={{
          'application/pdf': ['.pdf'],
          'application/msword': ['.doc'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          'application/vnd.ms-excel': ['.xls'],
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
          'image/*': ['.png', '.jpg', '.jpeg']
        }}
        title={t('trials.after.datapaq.import')}
        fileIcon={faFile}
        height="150px"
        width="100%"
        showPreview={true}
        existingFiles={uploadedFiles}
        readOnly={viewMode}
      />
    </div>
  );
};

export default DatapaqSection;
