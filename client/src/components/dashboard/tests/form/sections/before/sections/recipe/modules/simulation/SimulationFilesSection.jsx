import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../../../../../../../common/FileUploader/FileUploader';
import useFileSectionState from '../../../../../../../../../../hooks/useFileSectionState';
import { faFile } from '@fortawesome/free-solid-svg-icons';

/**
 * Section fichiers de simulation - documents associés à la simulation CBPWin
 * Utilise le hook unifié useFileSectionState
 */
const SimulationFilesSection = ({
  trialNodeId,
  onFileAssociationNeeded,
  viewMode = false
}) => {
  const { t } = useTranslation();

  const {
    uploadedFiles,
    handleFilesUploaded,
    loadExistingFiles,
    associateFiles,
    handleUploaderReady
  } = useFileSectionState({
    nodeId: trialNodeId,
    category: 'simulation',
    subcategory: 'simulation',
    onError: (msg, err) => console.error(t('trials.before.recipeData.simulation.files.loadError'), msg, err)
  });

  useEffect(() => {
    if (trialNodeId) {
      loadExistingFiles();
    }
  }, [trialNodeId, loadExistingFiles]);

  useEffect(() => {
    if (onFileAssociationNeeded) {
      onFileAssociationNeeded(associateFiles);
    }
  }, [onFileAssociationNeeded, associateFiles]);

  return (
    <div className="p-2">
      <FileUploader
        category="simulation"
        subcategory="simulation"
        nodeId={trialNodeId}
        onFilesUploaded={handleFilesUploaded}
        onUploaderReady={handleUploaderReady}
        maxFiles={50}
        acceptedFileTypes={{
          'application/pdf': ['.pdf'],
          'application/vnd.ms-excel': ['.xls'],
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
          'text/csv': ['.csv'],
          'text/plain': ['.txt'],
          'image/*': ['.png', '.jpg', '.jpeg']
        }}
        title={t('trials.before.recipeData.simulation.files.import')}
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

export default SimulationFilesSection;
