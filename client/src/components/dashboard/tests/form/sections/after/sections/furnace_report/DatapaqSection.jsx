import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../../../../../common/FileUploader/FileUploader';
import useFileSectionState from '../../../../../../../../hooks/useFileSectionState';
import { faFile } from '@fortawesome/free-solid-svg-icons';

/**
 * Section Datapaq - Gestion des fichiers Datapaq pour les essais
 * Utilise le hook unifié useFileSectionState pour une gestion correcte des uploads multiples
 */
const DatapaqSection = ({
  trialNodeId,
  onFileAssociationNeeded,
  viewMode = false
}) => {
  const { t } = useTranslation();
  
  // Utilisation du hook unifié
  const {
    uploadedFiles,
    handleFilesUploaded,
    loadExistingFiles,
    associateFiles
  } = useFileSectionState({
    nodeId: trialNodeId,
    category: 'datapaq',
    onError: (msg, err) => console.error(t('trials.after.datapaq.loadError'), msg, err)
  });

  // Charger les fichiers existants quand trialNodeId change
  useEffect(() => {
    if (trialNodeId) {
      loadExistingFiles();
    }
  }, [trialNodeId, loadExistingFiles]);

  // Exposer la fonction d'association au parent
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
        onFilesUploaded={handleFilesUploaded}
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
