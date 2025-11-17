/**
 * INFRASTRUCTURE: ReactPDFGenerator
 * Implémentation concrète utilisant @react-pdf/renderer
 * Remplace html2canvas + jsPDF (qualité supérieure, taille réduite)
 */

import { pdf } from '@react-pdf/renderer';
import { IPDFGenerator, PDFGenerationError, PDFOptions } from '../../domain/services/PDFGenerator';

export class ReactPDFGenerator extends IPDFGenerator {
  constructor() {
    super();
    this.documentRenderer = null;
  }

  /**
   * Définit le composant de rendu du document
   */
  setDocumentRenderer(renderer) {
    this.documentRenderer = renderer;
    return this;
  }

  /**
   * Génère le PDF et le télécharge
   */
  async generate(report, options = new PDFOptions()) {
    try {
      if (!this.documentRenderer) {
        throw new PDFGenerationError('Document renderer not set');
      }

      // Notifier le début
      this._notifyProgress(options, 'Initialisation', 0);

      // Créer le document React-PDF
      const pdfDocument = this.documentRenderer(report, options);

      this._notifyProgress(options, 'Génération du PDF', 30);

      // Générer le blob
      const blob = await pdf(pdfDocument).toBlob();

      this._notifyProgress(options, 'Finalisation', 90);

      // Télécharger
      this._downloadBlob(blob, report.getFileName());

      this._notifyProgress(options, 'Terminé', 100);

      return {
        success: true,
        blob,
        size: blob.size,
        filename: report.getFileName()
      };

    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw new PDFGenerationError(
        `Failed to generate PDF: ${error.message}`,
        error
      );
    }
  }

  /**
   * Génère un aperçu du PDF (blob URL)
   */
  async preview(report, options = new PDFOptions()) {
    try {
      if (!this.documentRenderer) {
        throw new PDFGenerationError('Document renderer not set');
      }

      if (!report) {
        throw new PDFGenerationError('Report object is required');
      }

      this._notifyProgress(options, 'Création de l\'aperçu', 0);

      const pdfDocument = this.documentRenderer(report, options);
      
      if (!pdfDocument) {
        throw new PDFGenerationError('Document renderer returned null or undefined');
      }

      this._notifyProgress(options, 'Génération', 50);

      const blob = await pdf(pdfDocument).toBlob();

      this._notifyProgress(options, 'Terminé', 100);

      // Créer une URL pour l'aperçu
      const url = URL.createObjectURL(blob);

      return {
        success: true,
        url,
        blob,
        size: blob.size
      };

    } catch (error) {
      console.error('PDF Preview Error:', error);
      throw new PDFGenerationError(
        `Failed to generate preview: ${error.message}`,
        error
      );
    }
  }

  /**
   * Estime la taille du PDF en Ko
   */
  estimateSize(report) {
    // Estimation basée sur le nombre de pages et de photos
    const baseSizePerPage = 50; // Ko
    const photoSize = 200; // Ko par photo (compressée)

    const pageCount = report.estimatePageCount();
    const photoCount = report.getActiveSections().reduce(
      (total, section) => total + section.getPhotoCount(),
      0
    );

    const estimatedSize = (pageCount * baseSizePerPage) + (photoCount * photoSize);

    return {
      sizeKb: Math.round(estimatedSize),
      sizeMb: Math.round((estimatedSize / 1024) * 10) / 10,
      pageCount,
      photoCount
    };
  }

  /**
   * Télécharge un blob
   */
  _downloadBlob(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Nettoyer l'URL après un délai
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  }

  /**
   * Notifie la progression
   */
  _notifyProgress(options, message, progress) {
    if (options.onProgress && typeof options.onProgress === 'function') {
      options.onProgress({
        message,
        progress,
        timestamp: new Date()
      });
    }
  }
}
