/**
 * APPLICATION LAYER: Use Cases
 * Orchestration de la logique métier
 */

import { ReportBuilder } from '../../domain/services/ReportBuilder';
import { DataTransformer } from '../../domain/services/DataTransformer';
import { PDFGeneratorFactory, PDFOptions } from '../../domain/services/PDFGenerator';

/**
 * UC1: Configurer un rapport
 */
export class ConfigureReportUseCase {
  constructor(reportRepository) {
    this.reportRepository = reportRepository;
  }

  async execute(trialId, selectedSections = {}, selectedPhotos = {}) {
    try {
      // 1. Récupérer les données du trial
      const rawData = await this.reportRepository.getTrialReportData(
        trialId,
        selectedSections
      );

      // DEBUG: Log des données brutes de l'API
      console.log('🔍 [ConfigureReportUseCase] rawData.partData from API:', {
        hasPartData: !!rawData.partData,
        dim_weight_unit: rawData.partData?.dim_weight_unit,
        dim_rect_unit: rawData.partData?.dim_rect_unit,
        dim_circ_unit: rawData.partData?.dim_circ_unit,
        dim_weight_value: rawData.partData?.dim_weight_value,
        weightUnit: rawData.partData?.weightUnit,
        rectUnit: rawData.partData?.rectUnit
      });

      // 2. Transformer les données
      const sanitized = DataTransformer.sanitizeReportData(rawData);

      // 3. Construire le rapport avec le Builder
      const builder = ReportBuilder.fromApiData(rawData, selectedSections, selectedPhotos);
      const report = builder.build();

      // 4. Valider
      if (!report.isValid()) {
        throw new Error('Le rapport n\'est pas valide');
      }

      return {
        success: true,
        report,
        metadata: {
          estimatedPages: report.estimatePageCount(),
          estimatedSize: null // sera calculé par le générateur
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }
}

/**
 * UC2: Générer un aperçu du rapport
 */
export class GeneratePreviewUseCase {
  constructor(pdfGenerator) {
    this.pdfGenerator = pdfGenerator;
  }

  async execute(report, options = {}) {
    try {
      const pdfOptions = new PDFOptions({
        ...options,
        quality: 'medium', // Aperçu en qualité réduite
        compression: true
      });

      const result = await this.pdfGenerator.preview(report, pdfOptions);

      return {
        success: true,
        ...result
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }
}

/**
 * UC3: Exporter le rapport en PDF
 */
export class ExportPDFUseCase {
  constructor(pdfGenerator) {
    this.pdfGenerator = pdfGenerator;
  }

  async execute(report, options = {}) {
    try {
      const pdfOptions = new PDFOptions({
        ...options,
        quality: options.quality || 'high',
        compression: options.compression !== false
      });

      // Estimer la taille avant génération
      const sizeEstimate = this.pdfGenerator.estimateSize(report);

      const result = await this.pdfGenerator.generate(report, pdfOptions);

      return {
        success: true,
        ...result,
        estimate: sizeEstimate
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }
}

/**
 * UC4: Optimiser les photos pour le rapport
 */
export class OptimizePhotosUseCase {
  constructor(imageOptimizer) {
    this.imageOptimizer = imageOptimizer;
  }

  async execute(photos, options = {}) {
    try {
      const maxSize = options.maxSize || 1920;
      const quality = options.quality || 0.85;

      const optimizedPhotos = await Promise.all(
        photos.map(photo => 
          this.imageOptimizer.optimize(photo, { maxSize, quality })
        )
      );

      const totalOriginalSize = photos.reduce((sum, p) => sum + (p.size || 0), 0);
      const totalOptimizedSize = optimizedPhotos.reduce((sum, p) => sum + (p.size || 0), 0);
      const compressionRatio = totalOriginalSize > 0 
        ? (1 - totalOptimizedSize / totalOriginalSize) * 100 
        : 0;

      return {
        success: true,
        photos: optimizedPhotos,
        statistics: {
          count: photos.length,
          originalSize: totalOriginalSize,
          optimizedSize: totalOptimizedSize,
          compressionRatio: compressionRatio.toFixed(2) + '%'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }
}

/**
 * Facade pour tous les use cases du module Report
 */
export class ReportUseCases {
  constructor(dependencies) {
    const {
      reportRepository,
      pdfGenerator,
      imageOptimizer
    } = dependencies;

    this.configure = new ConfigureReportUseCase(reportRepository);
    this.generatePreview = new GeneratePreviewUseCase(pdfGenerator);
    this.exportPDF = new ExportPDFUseCase(pdfGenerator);
    this.optimizePhotos = new OptimizePhotosUseCase(imageOptimizer);
  }
}
