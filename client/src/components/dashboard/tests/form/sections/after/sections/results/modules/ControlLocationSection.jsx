import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../../../../../../common/FileUploader/FileUploader';
import useFileSectionState from '../../../../../../../../../hooks/useFileSectionState';
import { faImage } from '@fortawesome/free-solid-svg-icons';

/**
 * Section Control Location - Gestion des images de localisation de contrôle
 * Utilise le hook unifié useFileSectionState pour une gestion correcte des uploads multiples
 */
const ControlLocationSection = ({
  trialNodeId,
  resultIndex = 0,
  sampleIndex = 0,
  onFileAssociationNeeded,
  viewMode = false
}) => {
  const { t } = useTranslation();
  
  // Subcategory dynamique basée sur result et sample
  // IMPORTANT: Les fichiers en base utilisent des index base-1, pas base-0
  const subcategory = useMemo(() => 
    `result-${resultIndex + 1}-sample-${sampleIndex + 1}`, 
    [resultIndex, sampleIndex]
  );
  
  // Utilisation du hook unifié
  const {
    uploadedFiles,
    handleFilesUploaded,
    loadExistingFiles,
    associateFiles
  } = useFileSectionState({
    nodeId: trialNodeId,
    category: 'control-location',
    subcategory,
    sampleNumber: sampleIndex,   // Passer pour association backend
    resultIndex: resultIndex,    // Passer pour association backend
    onError: (msg, err) => console.error(t('trials.after.results.controlLocation.loadError'), msg, err)
  });

  // Charger les fichiers existants quand trialNodeId, resultIndex ou sampleIndex changent
  useEffect(() => {
    if (trialNodeId) {
      loadExistingFiles();
    }
  }, [trialNodeId, resultIndex, sampleIndex, loadExistingFiles]);

  // Exposer la fonction d'association au parent
  useEffect(() => {
    if (onFileAssociationNeeded) {
      onFileAssociationNeeded(associateFiles);
    }
  }, [onFileAssociationNeeded, associateFiles]);
  return (
    <div className="p-2">
      <FileUploader
        category="control-location"
        subcategory={subcategory}
        nodeId={trialNodeId}
        onFilesUploaded={handleFilesUploaded}
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
        sampleNumber={sampleIndex}
        resultIndex={resultIndex}
      />
    </div>
  );
};

export default ControlLocationSection;