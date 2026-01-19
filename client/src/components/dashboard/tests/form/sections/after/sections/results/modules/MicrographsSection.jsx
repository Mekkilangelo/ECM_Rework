import React, { useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import CollapsibleSection from '../../../../../../../../common/CollapsibleSection/CollapsibleSection';
import FileUploader from '../../../../../../../../common/FileUploader/FileUploader';
import useMultiViewFileSectionState from '../../../../../../../../../hooks/useMultiViewFileSectionState';
import { faImage } from '@fortawesome/free-solid-svg-icons';

/**
 * Section Micrographs - Gestion des images de micrographies par grossissement
 * Utilise le hook unifié useMultiViewFileSectionState pour une gestion correcte des uploads multiples
 */
const MicrographsSection = ({
  trialNodeId,
  resultIndex = 0,
  sampleIndex = 0,
  onFileAssociationNeeded,
  viewMode = false
}) => {
  const { t } = useTranslation();
  
  // Configuration des vues de grossissement
  const views = useMemo(() => [
    { id: 'x50', name: t('trials.after.results.micrographs.zoomX50') },
    { id: 'x500', name: t('trials.after.results.micrographs.zoomX500') },
    { id: 'x1000', name: t('trials.after.results.micrographs.zoomX1000') },
    { id: 'other', name: t('trials.after.results.micrographs.otherZoom') },
  ], [t]);
  
  // Fonction pour construire la subcategory basée sur result, sample et viewId
  // IMPORTANT: Les fichiers en base utilisent des index base-1, pas base-0
  const buildSubcategory = useCallback((viewId) => 
    `result-${resultIndex + 1}-sample-${sampleIndex + 1}-${viewId}`, 
    [resultIndex, sampleIndex]
  );
  
  // Utilisation du hook unifié multi-vues
  const {
    uploadedFilesByView,
    createHandleFilesUploaded,
    loadExistingFiles,
    associateFiles,
    getFilesForView
  } = useMultiViewFileSectionState({
    nodeId: trialNodeId,
    category: 'micrographs',
    views,
    buildSubcategory,
    sampleNumber: sampleIndex,   // Filtrage backend par sample
    resultIndex: resultIndex,    // Filtrage backend par result
    onError: (msg, err) => console.error(t('trials.after.results.micrographs.loadError'), msg, err)
  });

  // Charger les fichiers existants
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
    <>
      {views.map((view) => {
        const filesForView = getFilesForView(view.id);
        // console.log(`[MicrographsSection] View ${view.id} pour result ${resultIndex} sample ${sampleIndex}:`, {
        //   viewId: view.id,
        //   filesCount: filesForView.length,
        //   files: filesForView
        // });

        return (
        <CollapsibleSection
          key={`${resultIndex}-${sampleIndex}-${view.id}`}
          title={view.name}
          isExpandedByDefault={false}
          sectionId={`trial-micrographs-${resultIndex}-${sampleIndex}-${view.id}`}
          rememberState={true}
          className="mb-3"
          level={2}
        >
          <div className="p-2">
            <FileUploader
              category="micrographs"
              subcategory={buildSubcategory(view.id)}
              nodeId={trialNodeId}
              onFilesUploaded={createHandleFilesUploaded(view.id)}
              maxFiles={50}
              acceptedFileTypes={{
                'application/pdf': ['.pdf'],
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'application/vnd.ms-excel': ['.xls'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'image/*': ['.png', '.jpg', '.jpeg']
              }}
              title={t('trials.after.results.micrographs.import', { name: view.name.toLowerCase() })}
              fileIcon={faImage}
              height="150px"
              width="100%"
              showPreview={true}
              existingFiles={filesForView}
              readOnly={viewMode}
              sampleNumber={sampleIndex}
              resultIndex={resultIndex}
            />
          </div>
        </CollapsibleSection>
      )})}
    </>
  );
}; 

export default MicrographsSection;
