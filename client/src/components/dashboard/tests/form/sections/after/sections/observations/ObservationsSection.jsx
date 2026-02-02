import React, { useEffect } from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../../../../../../common/FileUploader/FileUploader';
import useFileSectionState from '../../../../../../../../hooks/useFileSectionState';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import CollapsibleSection from '../../../../../../../common/CollapsibleSection/CollapsibleSection';

/**
 * Section Observations - Champ texte observation et photos d'observations pour les essais
 * Utilise le hook unifié useFileSectionState pour une gestion correcte des uploads multiples
 */
const ObservationsSection = ({
  formData,
  handleChange,
  trialNodeId,
  onFileAssociationNeeded,
  viewMode = false,
  readOnlyFieldStyle = {}
}) => {
  const { t } = useTranslation();

  // Utilisation du hook unifié pour les fichiers
  const {
    uploadedFiles,
    handleFilesUploaded,
    loadExistingFiles,
    associateFiles
  } = useFileSectionState({
    nodeId: trialNodeId,
    category: 'observations',
    onError: (msg, err) => console.error(t('trials.after.observations.loadError'), msg, err)
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
      {/* Champ texte observation */}
      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.after.observations.observationText')}</Form.Label>
            <Form.Control
              as="textarea"
              name="observation"
              value={formData.observation || ''}
              onChange={handleChange}
              rows={4}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
              placeholder={t('trials.after.observations.observationPlaceholder')}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Sous-section fichiers observations */}
      <CollapsibleSection
        title={t('trials.after.observations.files.title')}
        isExpandedByDefault={true}
        sectionId="observations-files"
        rememberState={false}
        level={1}
      >
        <FileUploader
          category="observations"
          subcategory="observations"
          nodeId={trialNodeId}
          onFilesUploaded={handleFilesUploaded}
          maxFiles={50}
          acceptedFileTypes={{
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
          }}
          title={t('trials.after.observations.import')}
          fileIcon={faImage}
          height="150px"
          width="100%"
          showPreview={true}
          existingFiles={uploadedFiles}
          readOnly={viewMode}
        />
      </CollapsibleSection>
    </div>
  );
};

export default ObservationsSection;
