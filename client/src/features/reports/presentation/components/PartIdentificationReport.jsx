/**
 * PRESENTATION: PartIdentificationReport
 * Composant simplifié pour générer un PDF d'identification de pièce
 * Réutilise les composants existants du module reports (SectionPhotoManager)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileDownload,
  faEye,
  faImage,
  faFilePdf
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import { Report } from '../../domain/entities/Report';
import { SectionFactory } from '../../domain/entities/Section';
import { ReactPDFGenerator } from '../../infrastructure/pdf/ReactPDFGenerator';
import { ReportPDFDocument } from '../../infrastructure/pdf/ReportPDFDocument';
import SectionPhotoManager from './SectionPhotoManager';
import { useEnrichedPhotosForPDF } from '../hooks/useEnrichedPhotosForPDF';

import './PartIdentificationReport.css';

/**
 * Composant principal
 */
const PartIdentificationReport = ({ partNodeId, partData, clientData }) => {
  const { t } = useTranslation();

  // États
  const [selectedPhotos, setSelectedPhotos] = useState({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // IMPORTANT: Mémoriser les options pour éviter une boucle infinie de reconversion
  const conversionOptions = useMemo(() => ({
    scale: 1.5,  // Réduit de 2 à 1.5 pour économiser mémoire (encore bonne qualité)
    maxWidth: 1000  // Réduit de 1200 à 1000px
  }), []);

  // Enrichir les photos en convertissant les PDFs en images
  const { enrichedPhotos, isConverting, conversionError } = useEnrichedPhotosForPDF(selectedPhotos, conversionOptions);

  // Callback pour recevoir les photos sélectionnées du SectionPhotoManager
  const handlePhotosChange = useCallback((sectionType, photos) => {
    setSelectedPhotos(photos);
  }, []);

  // Nombre total de photos sélectionnées
  const totalSelected = useMemo(() => 
    Object.values(selectedPhotos).reduce((sum, photos) => sum + (photos?.length || 0), 0),
    [selectedPhotos]
  );

  // Construire le rapport pour le PDF avec les photos enrichies
  const buildReport = useCallback(() => {
    // Utiliser enrichedPhotos au lieu de selectedPhotos
    const photosArray = Object.entries(enrichedPhotos).flatMap(([subcategory, photos]) =>
      (photos || []).map(photo => ({
        ...photo,
        subcategory: photo.subcategory || subcategory,
        // Utiliser l'URL déjà fournie (ou la version convertie du PDF)
        url: photo.url || photo.viewPath
      }))
    );

    // Créer une section identification uniquement avec les photos
    const identificationSection = SectionFactory.createSection('identification', {
      isEnabled: true
    }).withPhotos(photosArray);

    // Désactiver toutes les autres sections
    const allSections = SectionFactory.createAllSections(false);
    const sectionsWithIdentification = allSections.map(section => 
      section.type === 'identification' ? identificationSection : section
    );

    const report = new Report({
      id: `part-${partNodeId}`,
      trialId: null,
      trialData: {
        trial_code: partData?.designation || partData?.part_number || 'ID',
        trial_date: new Date().toISOString()
      },
      partData: {
        ...partData,
        designation: partData?.designation,
        part_number: partData?.partNumber || partData?.part_number,
        drawing_number: partData?.drawingNumber || partData?.drawing_number,
        steel: partData?.steel,
        steelGrade: typeof partData?.steel === 'object' ? partData?.steel?.grade : partData?.steel,
        hardnessSpecs: partData?.hardnessSpecs || [],
        ecdSpecs: partData?.ecdSpecs || [],
        dim_rect_length: partData?.dimRectLength || partData?.dim_rect_length,
        dim_rect_width: partData?.dimRectWidth || partData?.dim_rect_width,
        dim_rect_height: partData?.dimRectHeight || partData?.dim_rect_height,
        dim_rect_unit: partData?.dimRectUnit || partData?.dim_rect_unit,
        dim_circ_diameterOut: partData?.dimCircDiameterOut || partData?.dim_circ_diameterOut,
        dim_circ_diameterIn: partData?.dimCircDiameterIn || partData?.dim_circ_diameterIn,
        dim_circ_unit: partData?.dimCircUnit || partData?.dim_circ_unit,
        dim_weight_value: partData?.dimWeightValue || partData?.dim_weight_value,
        dim_weight_unit: partData?.dimWeightUnit || partData?.dim_weight_unit
      },
      clientData: clientData,
      sections: sectionsWithIdentification,
      metadata: {
        type: 'part-identification',
        generatedAt: new Date()
      }
    });

    return report;
  }, [partNodeId, partData, clientData, enrichedPhotos]);

  // Créer le générateur PDF avec les photos enrichies
  const createPDFGenerator = useCallback(() => {
    const generator = new ReactPDFGenerator();

    // IMPORTANT: SectionPhotoManager retourne { photos: [photo1, photo2, photo3] }
    // mais ReportPDFDocument attend { identification: { subcategory: [photos] } }
    //
    // Pour l'identification sheet, on veut TOUTES les photos dans une seule liste
    // donc on aplatit toutes les subcategories en un seul tableau

    // Aplatir toutes les photos des différentes subcategories
    // enrichedPhotos peut être soit un objet { category: [photos] } soit directement un tableau
    let allPhotos = [];

    if (Array.isArray(enrichedPhotos)) {
      // Si c'est déjà un tableau, l'utiliser directement
      allPhotos = enrichedPhotos;
    } else if (typeof enrichedPhotos === 'object' && enrichedPhotos !== null) {
      // Si c'est un objet, aplatir toutes les valeurs
      allPhotos = Object.values(enrichedPhotos).flat();
    }

    // Organiser dans la structure attendue par ReportPDFDocument
    // On met toutes les photos sous la clé 'all' pour la section identification
    const photosForPDF = {
      identification: {
        all: allPhotos  // Toutes les photos dans une seule liste
      }
    };

    generator.setDocumentRenderer((report, options) => (
      <ReportPDFDocument
        report={report}
        selectedPhotos={photosForPDF}
        options={options}
      />
    ));
    return generator;
  }, [enrichedPhotos]);

  // Générer et télécharger le PDF
  const handleExport = useCallback(async () => {
    setGenerating(true);
    setError(null);
    
    try {
      const report = buildReport();
      const generator = createPDFGenerator();
      
      await generator.generate(report, {
        quality: 'high',
        includeCoverPage: false  // Désactiver la CoverPage pour l'identification de pièce
      });
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(t('report.partIdentification.generateError'));
    } finally {
      setGenerating(false);
    }
  }, [buildReport, createPDFGenerator, t]);

  // Prévisualisation (ouvre dans un nouvel onglet)
  const handlePreview = useCallback(async () => {
    setGenerating(true);
    setError(null);
    
    try {
      const report = buildReport();
      const generator = createPDFGenerator();
      
      const result = await generator.preview(report, {
        includeCoverPage: false  // Désactiver la CoverPage pour l'identification de pièce
      });
      
      if (result?.url) {
        window.open(result.url, '_blank');
      }
      
    } catch (err) {
      console.error('Error generating preview:', err);
      setError(t('report.partIdentification.generateError'));
    } finally {
      setGenerating(false);
    }
  }, [buildReport, createPDFGenerator, t]);

  if (!partNodeId) {
    return (
      <Alert variant="info">
        {t('report.partIdentification.saveFirst')}
      </Alert>
    );
  }

  return (
    <Card className="part-identification-report">
      <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <FontAwesomeIcon icon={faFilePdf} />
          <span className="fw-bold">{t('report.partIdentification.title')}</span>
        </div>
        <Badge bg="light" text="dark">
          <FontAwesomeIcon icon={faImage} className="me-1" />
          {totalSelected} {t('report.partIdentification.selected', 'sélectionné(s)')}
        </Badge>
      </Card.Header>
      
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {conversionError && (
          <Alert variant="warning">
            <FontAwesomeIcon icon={faFilePdf} className="me-2" />
            {t('report.partIdentification.pdfConversionWarning', 'Attention: Certains PDFs n\'ont pas pu être convertis')}
          </Alert>
        )}
        
        {isConverting && (
          <Alert variant="info">
            <Spinner animation="border" size="sm" className="me-2" />
            {t('report.partIdentification.convertingPDFs', 'Conversion des PDFs en images...')}
          </Alert>
        )}
        
        <p className="text-muted small mb-3">
          {t('report.partIdentification.selectPhotos')}
        </p>
        
        {/* Utiliser le SectionPhotoManager existant pour la section identification */}
        <SectionPhotoManager
          trialNodeId={null}
          partNodeId={partNodeId}
          sectionType="identification"
          onChange={handlePhotosChange}
          initialSelectedPhotos={{}}
          show={true}
        />
      </Card.Body>
      
      <Card.Footer className="d-flex justify-content-end gap-2">
        <Button
          variant="outline-secondary"
          onClick={handlePreview}
          disabled={generating || isConverting}
        >
          <FontAwesomeIcon icon={faEye} className="me-2" />
          {t('report.actions.preview')}
        </Button>
        <Button
          variant="danger"
          onClick={handleExport}
          disabled={generating || isConverting}
        >
          {generating ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {t('report.actions.generating')}
            </>
          ) : isConverting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {t('report.partIdentification.converting', 'Conversion...')}
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faFileDownload} className="me-2" />
              {t('report.actions.exportPDF')}
            </>
          )}
        </Button>
      </Card.Footer>
    </Card>
  );
};

export default PartIdentificationReport;
