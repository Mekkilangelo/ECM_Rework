import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../../../common/FileUploader/FileUploader';
import useFileSectionState from '../../../../../../hooks/useFileSectionState';
import { faFile } from '@fortawesome/free-solid-svg-icons';

/**
 * Section Documents - Gestion des documents de commandes
 * Utilise le hook unifié useFileSectionState pour une gestion correcte des uploads multiples
 */
const DocumentsSection = ({
  orderNodeId,
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
    nodeId: orderNodeId,
    category: 'documents',
    subcategory: 'all_documents',
    onError: (msg, err) => console.error(t('orders.documents.loadError'), msg, err)
  });

  // Charger les fichiers existants
  useEffect(() => {
    if (orderNodeId) {
      loadExistingFiles();
    }
  }, [orderNodeId, loadExistingFiles]);

  // Exposer la fonction d'association au parent
  useEffect(() => {
    if (onFileAssociationNeeded) {
      onFileAssociationNeeded(associateFiles);
    }
  }, [onFileAssociationNeeded, associateFiles]);
  
  return (
    <>
      <div className="p-2">
        <FileUploader
          category="documents"
          subcategory="all_documents"
          nodeId={orderNodeId}
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
          title={t('orders.documents.uploadTitle')}
          fileIcon={faFile}
          height="150px"
          width="100%"
          showPreview={true}
          existingFiles={uploadedFiles}
          viewMode={viewMode}
        />
      </div>
    </>
  );
};

export default DocumentsSection;
