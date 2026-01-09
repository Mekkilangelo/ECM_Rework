import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../../../../../common/FileUploader/FileUploader';
import useFileSectionState from '../../../../../../../../hooks/useFileSectionState';
import { faFile } from '@fortawesome/free-solid-svg-icons';

/**
 * Section Load Design - Gestion des fichiers de conception de charge
 * Utilise le hook unifié useFileSectionState pour une gestion correcte des uploads multiples
 */
const LoadDesignSection = ({
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
    associateFiles,
    handleUploaderReady
  } = useFileSectionState({
    nodeId: trialNodeId,
    category: 'load_design',
    subcategory: 'load_design',
    onError: (msg, err) => console.error(t('trials.before.loadDesign.loadFilesError'), msg, err)
  });

  // Charger les fichiers existants
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
        category="load_design"
        subcategory="load_design"
        nodeId={trialNodeId}
        onFilesUploaded={handleFilesUploaded}
        onUploaderReady={handleUploaderReady}
        maxFiles={50}
        acceptedFileTypes={{
          'application/pdf': ['.pdf'],
          'application/msword': ['.doc'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          'application/vnd.ms-excel': ['.xls'],
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
          'image/*': ['.png', '.jpg', '.jpeg']
        }}
        title={t('trials.before.loadDesign.importLoadDesign')}
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

export default LoadDesignSection;
