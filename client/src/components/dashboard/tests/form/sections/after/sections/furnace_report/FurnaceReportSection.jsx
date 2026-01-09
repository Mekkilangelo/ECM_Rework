import React, { useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import CollapsibleSection from '../../../../../../../common/CollapsibleSection/CollapsibleSection';
import FileUploader from '../../../../../../../common/FileUploader/FileUploader';
import useMultiViewFileSectionState from '../../../../../../../../hooks/useMultiViewFileSectionState';
import { faFile } from '@fortawesome/free-solid-svg-icons';

/**
 * Section Furnace Report - Gestion des rapports de four par type
 * Utilise le hook unifié useMultiViewFileSectionState pour une gestion correcte des uploads multiples
 */
const FurnaceReportSection = ({
  trialNodeId,
  onFileAssociationNeeded,
  viewMode = false
}) => {
  const { t } = useTranslation();
  
  // Configuration des différentes vues (Datapaq déplacé en section à part entière)
  const views = useMemo(() => [
    { id: 'heating', name: t('trials.after.furnaceReport.heating') },
    { id: 'cooling', name: t('trials.after.furnaceReport.cooling') },
    { id: 'tempering', name: t('trials.after.furnaceReport.tempering') },
    { id: 'alarms', name: t('trials.after.furnaceReport.alarms') }
  ], [t]);
  
  // Pour FurnaceReport, la subcategory est simplement le viewId
  const buildSubcategory = useCallback((viewId) => viewId, []);
  
  // Utilisation du hook unifié multi-vues
  const {
    createHandleFilesUploaded,
    loadExistingFiles,
    associateFiles,
    getFilesForView
  } = useMultiViewFileSectionState({
    nodeId: trialNodeId,
    category: 'furnace_report',
    views,
    buildSubcategory,
    onError: (msg, err) => console.error(t('trials.after.furnaceReport.loadError'), msg, err)
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
    <>
      {views.map((view) => (
        <CollapsibleSection
          key={view.id}
          title={view.name}
          isExpandedByDefault={false}
          sectionId={`trial-furnace-report-${view.id}`}
          rememberState={false}
          className="mb-3"
          level={1}
        >
          <div className="p-2">
            <FileUploader
              category="furnace_report"
              subcategory={view.id}
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
              title={t('trials.after.furnaceReport.import', { name: view.name.toLowerCase() })}
              fileIcon={faFile}
              height="150px"
              width="100%"
              showPreview={true}
              existingFiles={getFilesForView(view.id)}
              readOnly={viewMode}
            />
          </div>
        </CollapsibleSection>
      ))}
    </>
  );
};

export default FurnaceReportSection;
