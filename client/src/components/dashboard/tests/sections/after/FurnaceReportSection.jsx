import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import CollapsibleSection from '../../../../common/CollapsibleSection/CollapsibleSection';
import FileUploader from '../../../../common/FileUploader/FileUploader';
import fileService from '../../../../../services/fileService';
import { faFile, faImage } from '@fortawesome/free-solid-svg-icons';

const FurnaceReportSection = ({
  testNodeId,
  onFileAssociationNeeded,
}) => {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [tempIds, setTempIds] = useState({});
  // Utilisez une référence pour stocker tempIds sans déclencher de re-renders
  const tempIdsRef = useRef({});
  
  // Mettez à jour la référence quand tempIds change
  useEffect(() => {
    tempIdsRef.current = tempIds;
  }, [tempIds]);
  
  // Configuration des différentes vues
  const views = [
    { id: 'heating', name: t('tests.after.furnaceReport.heating') },
    { id: 'cooling', name: t('tests.after.furnaceReport.cooling') },
    { id: 'alarms', name: t('tests.after.furnaceReport.alarms') },
    { id: 'datapaq', name: t('tests.after.furnaceReport.datapaq') },
  ];
  
  // Charger les fichiers existants
  useEffect(() => {
    if (testNodeId) {
      loadExistingFiles();
    }
  }, [testNodeId]);
  
  const loadExistingFiles = async () => {
    try {
      const response = await fileService.getFilesByNode(testNodeId, { category: 'furnace_report' });
      console.log(t('tests.after.furnaceReport.filesResponse'), response.data);
      
      // Organiser les fichiers par sous-catégorie
      const filesBySubcategory = {};
      response.data.files.forEach(file => {
        const subcategory = file.subcategory || 'other';
        if (!filesBySubcategory[subcategory]) {
          filesBySubcategory[subcategory] = [];
        }
        filesBySubcategory[subcategory].push(file);
      });
      setUploadedFiles(filesBySubcategory);
    } catch (error) {
      console.error(t('tests.after.furnaceReport.loadError'), error);
    }
  };
  
  const handleFilesUploaded = (files, newTempId, operation = 'add', fileId = null) => {
    if (operation === 'delete') {
      // Pour une suppression, mettre à jour toutes les sous-catégories
      setUploadedFiles(prev => {
        const updatedFiles = { ...prev };
        
        // Parcourir toutes les sous-catégories pour trouver et supprimer le fichier
        Object.keys(updatedFiles).forEach(subcategory => {
          updatedFiles[subcategory] = updatedFiles[subcategory].filter(file => file.id !== fileId);
        });
        
        return updatedFiles;
      });
    } else {
      // Pour l'ajout, mettre à jour la sous-catégorie spécifique
      const subcategory = files.length > 0 && files[0].subcategory ? files[0].subcategory : 'all_documents';
      
      // Mettre à jour la liste des fichiers téléchargés
      setUploadedFiles(prev => ({
        ...prev,
        [subcategory]: [...(prev[subcategory] || []), ...files]
      }));
      
      // Stocker le tempId pour cette sous-catégorie
      if (newTempId) {
        setTempIds(prev => ({
          ...prev,
          [subcategory]: newTempId
        }));
      }
    }
  };
  
  // Méthode pour associer les fichiers lors de la soumission du formulaire
  // Utilisez useCallback pour mémoriser cette fonction
  const associateFiles = useCallback(async (newTestNodeId) => {
    try {
      // Utilisez la référence pour obtenir les tempIds les plus récents
      const currentTempIds = tempIdsRef.current;
      
      // Parcourir tous les tempIds et les associer
      for (const [subcategory, tempId] of Object.entries(currentTempIds)) {
        await fileService.associateFiles(newTestNodeId, tempId, {
          category: 'furnace_report',
          subcategory
        });
      }
      
      // Réinitialiser les tempIds
      setTempIds({});
      
      // Recharger les fichiers pour mettre à jour l'affichage si on met à jour la pièce existante
      if (newTestNodeId === testNodeId) {
        loadExistingFiles();
      }
    } catch (error) {
      console.error(t('tests.after.furnaceReport.associateError'), error);
    }
  }, [testNodeId]); // Ne dépend que de testNodeId, pas de tempIds
  
  // Exposer la méthode d'association via le prop onFileAssociationNeeded
  // Ne s'exécute qu'une fois lors du montage du composant ou si onFileAssociationNeeded change
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
          sectionId={`test-furnace-report-${view.id}`}
          rememberState={false}
          className="mb-3"
          level={1}
        >
          <div className="p-2">
            <FileUploader
              category="furnace_report"
              subcategory={view.id}
              nodeId={testNodeId}
              onFilesUploaded={(files, newTempId, operation, fileId) => handleFilesUploaded(files, newTempId, operation, fileId)}
              maxFiles={5}
              acceptedFileTypes={{
                'application/pdf': ['.pdf'],
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'application/vnd.ms-excel': ['.xls'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'image/*': ['.png', '.jpg', '.jpeg']
              }}
              title={t('tests.after.furnaceReport.import', { name: view.name.toLowerCase() })}
              fileIcon={faFile}
              height="150px"
              width="100%"
              showPreview={true}
              existingFiles={uploadedFiles[view.id] || []}
            />
          </div>
        </CollapsibleSection>
      ))}
    </>
  );
};

export default FurnaceReportSection;
