import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../../../../../common/FileUploader/FileUploader';
import useFileSectionState from '../../../../../../../../hooks/useFileSectionState';
import { faImage } from '@fortawesome/free-solid-svg-icons';

/**
 * Section Post-traitement - Gestion des photos de post-traitement pour les essais
 * Utilise le hook unifié useFileSectionState pour une gestion correcte des uploads multiples
 */
const PostTreatmentSection = ({
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
    category: 'post_treatment',
    onError: (msg, err) => console.error(t('trials.after.postTreatment.loadError'), msg, err)
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
        category="post_treatment"
        subcategory="post_treatment"
        nodeId={trialNodeId}
        onFilesUploaded={handleFilesUploaded}
        maxFiles={50}
        acceptedFileTypes={{
          'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
        }}
        title={t('trials.after.postTreatment.import')}
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

export default PostTreatmentSection;
