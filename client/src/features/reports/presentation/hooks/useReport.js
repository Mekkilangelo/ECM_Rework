/**
 * PRESENTATION: Hook personnalisé pour la gestion des rapports
 * Encapsule toute la logique de rapport avec Clean Architecture
 */

import { useState, useCallback, useMemo } from 'react';
import { SectionFactory } from '../../domain/entities/Section';
import { ReportUseCases } from '../../application/use-cases/ReportUseCases';
import { ReportDataRepository } from '../../infrastructure/repositories/ReportDataRepository';
import { ReactPDFGenerator } from '../../infrastructure/pdf/ReactPDFGenerator';
import { ReportPDFDocument } from '../../infrastructure/pdf/ReportPDFDocument';
import { PDFGeneratorFactory } from '../../domain/services/PDFGenerator';

/**
 * Hook principal pour la gestion des rapports
 */
export const useReport = (trialId, partId) => {
  // États
  const [report, setReport] = useState(null);
  const [sections, setSections] = useState(() => 
    SectionFactory.createAllSections(true)
  );
  const [selectedPhotos, setSelectedPhotos] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  // Initialiser les use cases
  const useCases = useMemo(() => {
    const repository = new ReportDataRepository();
    
    // Enregistrer le générateur
    PDFGeneratorFactory.register('react-pdf', ReactPDFGenerator);

    return new ReportUseCases({
      reportRepository: repository,
      pdfGenerator: null, // Sera créé dynamiquement
      imageOptimizer: null // TODO: implémenter si nécessaire
    });
  }, []);

  // Créer un générateur PDF à la demande avec les photos actuelles
  const createPDFGenerator = useCallback(() => {
    
    const pdfGenerator = new ReactPDFGenerator();
    pdfGenerator.setDocumentRenderer(
      (report, options) => (
        <ReportPDFDocument 
          report={report} 
          selectedPhotos={selectedPhotos || {}}
          options={options} 
        />
      )
    );
    return pdfGenerator;
  }, [selectedPhotos]);

  /**
   * Active/Désactive une section
   */
  const toggleSection = useCallback((sectionType) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.type === sectionType ? section.toggle() : section
      )
    );
  }, []);

  /**
   * Active toutes les sections
   */
  const enableAllSections = useCallback(() => {
    setSections(prevSections =>
      prevSections.map(section =>
        !section.isEnabled ? section.toggle() : section
      )
    );
  }, []);

  /**
   * Désactive toutes les sections
   */
  const disableAllSections = useCallback(() => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.isEnabled ? section.toggle() : section
      )
    );
  }, []);

  /**
   * Définit les photos pour une section
   */
  const setSectionPhotos = useCallback((sectionType, photos) => {
    setSelectedPhotos(prev => {
      // Éviter les mises à jour inutiles si les photos n'ont pas changé
      const currentPhotos = prev[sectionType] || [];
      if (JSON.stringify(currentPhotos) === JSON.stringify(photos)) {
        return prev;
      }
      
      return {
        ...prev,
        [sectionType]: photos
      };
    });
  }, []);

  /**
   * Configure le rapport (récupère les données)
   */
  const configure = useCallback(async () => {
    if (!trialId) {
      setError('ID du trial manquant');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Construire l'objet de sections sélectionnées
      const selectedSections = sections.reduce((acc, section) => {
        acc[section.type] = section.isEnabled;
        return acc;
      }, {});

      // Appeler le use case
      const result = await useCases.configure.execute(
        trialId,
        selectedSections,
        selectedPhotos
      );

      if (result.success) {
        setReport(result.report);
        return result.report;
      } else {
        setError(result.error);
        return null;
      }

    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [trialId, sections, selectedPhotos, useCases]);

  /**
   * Génère un aperçu du PDF
   */
  const generatePreview = useCallback(async () => {
    let currentReport = report;
    
    if (!currentReport) {
      currentReport = await configure();
      if (!currentReport) return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Créer un générateur avec les photos actuelles
      const pdfGenerator = createPDFGenerator();
      
      const result = await pdfGenerator.preview(currentReport, {
        onProgress: setProgress
      });

      return {
        success: true,
        ...result
      };

    } catch (err) {
      console.error('Preview error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [report, configure, createPDFGenerator]);

  /**
   * Exporte le rapport en PDF
   */
  const exportPDF = useCallback(async (options = {}) => {
    let currentReport = report;
    
    if (!currentReport) {
      currentReport = await configure();
      if (!currentReport) return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Créer un générateur avec les photos actuelles
      const pdfGenerator = createPDFGenerator();
      
      const result = await pdfGenerator.generate(currentReport, {
        ...options,
        onProgress: setProgress
      });

      return {
        success: true,
        ...result
      };

    } catch (err) {
      console.error('Export error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [report, configure, createPDFGenerator]);

  /**
   * Estime la taille du PDF
   */
  const estimateSize = useCallback(() => {
    if (!report) return null;

    const generator = new ReactPDFGenerator();
    return generator.estimateSize(report);
  }, [report]);

  /**
   * Statistiques du rapport
   */
  const statistics = useMemo(() => {
    if (!report) return null;

    const activeSections = sections.filter(s => s.isEnabled);
    const totalPhotos = activeSections.reduce(
      (total, section) => total + section.getPhotoCount(),
      0
    );

    return {
      sectionsCount: activeSections.length,
      photosCount: totalPhotos,
      estimatedPages: report.estimatePageCount()
    };
  }, [report, sections]);

  return {
    // États
    report,
    sections,
    selectedPhotos,
    loading,
    error,
    progress,
    statistics,

    // Actions
    toggleSection,
    enableAllSections,
    disableAllSections,
    setSectionPhotos,
    configure,
    generatePreview,
    exportPDF,
    estimateSize
  };
};

export default useReport;
