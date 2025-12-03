/**
 * Index principal du module Reports
 * Expose les composants et hooks publics
 */

// Composants de présentation
export { default as ReportConfiguration } from './presentation/components/ReportConfiguration';
export { default as ReportPreviewModal } from './presentation/components/ReportPreviewModal';

// Hooks
export { useReport } from './presentation/hooks/useReport';

// Entités du domaine (pour utilisation avancée)
export { Report } from './domain/entities/Report';
export { Section, SectionFactory } from './domain/entities/Section';
export { Photo, PhotoCollection } from './domain/entities/Photo';

// Services (pour utilisation avancée)
export { ReportBuilder } from './domain/services/ReportBuilder';
export { DataTransformer } from './domain/services/DataTransformer';
export { PDFOptions, PDFGeneratorFactory } from './domain/services/PDFGenerator';

// Use Cases (pour utilisation avancée)
export { ReportUseCases } from './application/use-cases/ReportUseCases';

// Infrastructure (pour customisation)
export { ReactPDFGenerator } from './infrastructure/pdf/ReactPDFGenerator';
export { ReportPDFDocument } from './infrastructure/pdf/ReportPDFDocument';
export { ReportDataRepository } from './infrastructure/repositories/ReportDataRepository';
