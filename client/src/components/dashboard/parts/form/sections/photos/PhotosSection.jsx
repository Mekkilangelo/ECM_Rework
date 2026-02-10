import React, { useEffect, useMemo, useCallback } from 'react';
import CollapsibleSection from '../../../../../common/CollapsibleSection/CollapsibleSection';
import FileUploader from '../../../../../common/FileUploader/FileUploader';
import useMultiViewFileSectionState from '../../../../../../hooks/useMultiViewFileSectionState';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

/**
 * Section Photos - Gestion des photos de pièces par vue
 * Utilise le hook unifié useMultiViewFileSectionState pour une gestion correcte des uploads multiples
 */
const PhotosSection = ({
  partNodeId,
  onFileAssociationNeeded,
  viewMode = false
}) => {
  const { t } = useTranslation();
  
  // Configuration des différentes vues
  const views = useMemo(() => [
    { id: 'quarter', name: t('parts.photos.views.quarter') },
    { id: 'profile', name: t('parts.photos.views.profile') },
    { id: 'front', name: t('parts.photos.views.front') },
    { id: 'other', name: t('parts.photos.views.other') },
  ], [t]);

  // Pour Photos, la subcategory est simplement le viewId
  const buildSubcategory = useCallback((viewId) => viewId, []);
  
  // Utilisation du hook unifié multi-vues
  const {
    createHandleFilesUploaded,
    createHandleUploaderReady,
    loadExistingFiles,
    associateFiles,
    getFilesForView
  } = useMultiViewFileSectionState({
    nodeId: partNodeId,
    category: 'photos',
    views,
    buildSubcategory,
    onError: (msg, err) => console.error(t('parts.photos.loadError'), msg, err)
  });

  // Charger les fichiers existants
  useEffect(() => {
    if (partNodeId) {
      loadExistingFiles();
    }
  }, [partNodeId, loadExistingFiles]);

  // Exposer la fonction d'association au parent
  useEffect(() => {
    if (onFileAssociationNeeded) {
      onFileAssociationNeeded(associateFiles);
    }
  }, [onFileAssociationNeeded, associateFiles]);

  return (
    <>
      {views.map((view) => (
        <CollapsibleSection
          key={view.id}
          title={view.name}
          isExpandedByDefault={false}
          sectionId={`part-photo-${view.id}`}
          rememberState={true}
          className="mb-3"
          level={1}
        >
          <div className="p-2">
            <FileUploader
              category="photos"
              subcategory={view.id}
              nodeId={partNodeId}
              onFilesUploaded={createHandleFilesUploaded(view.id)}
              onUploaderReady={createHandleUploaderReady(view.id)}
              maxFiles={50}
              acceptedFileTypes={{ 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] }}
              title={t('parts.photos.upload', { view: view.name.toLowerCase() })}
              fileIcon={faImage}
              height="150px"
              width="100%"
              showPreview={true}
              existingFiles={getFilesForView(view.id)}
              viewMode={viewMode}
            />
          </div>
        </CollapsibleSection>
      ))}
    </>
  );
};

export default PhotosSection;
