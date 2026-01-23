/**
 * DOMAIN SERVICE: PDFGenerator
 * Service abstrait pour la génération de PDF
 * Implémente le pattern Strategy pour supporter différents moteurs
 */

export class PDFGenerationError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'PDFGenerationError';
    this.cause = cause;
  }
}

/**
 * Interface abstraite pour la génération de PDF
 */
export class IPDFGenerator {
  async generate(report, options = {}) {
    throw new Error('Method generate() must be implemented');
  }

  async preview(report, options = {}) {
    throw new Error('Method preview() must be implemented');
  }

  estimateSize(report) {
    throw new Error('Method estimateSize() must be implemented');
  }
}

/**
 * Options de génération de PDF
 */
export class PDFOptions {
  constructor({
    quality = 'high',
    compression = true,
    watermark = null,
    metadata = {},
    orientation = 'portrait',
    format = 'A4',
    margins = { top: 20, right: 20, bottom: 20, left: 20 },
    includePageNumbers = true,
    includeHeader = true,
    includeFooter = true,
    includeCoverPage = true,
    maxImageSize = 1920, // px
    imageQuality = 0.85,
    onProgress = null
  } = {}) {
    this.quality = quality;
    this.compression = compression;
    this.watermark = watermark;
    this.metadata = metadata;
    this.orientation = orientation;
    this.format = format;
    this.margins = margins;
    this.includePageNumbers = includePageNumbers;
    this.includeHeader = includeHeader;
    this.includeFooter = includeFooter;
    this.includeCoverPage = includeCoverPage;
    this.maxImageSize = maxImageSize;
    this.imageQuality = imageQuality;
    this.onProgress = onProgress;
  }

  static createDefault() {
    return new PDFOptions();
  }

  static createHighQuality() {
    return new PDFOptions({
      quality: 'high',
      compression: false,
      imageQuality: 0.95,
      maxImageSize: 2560
    });
  }

  static createCompressed() {
    return new PDFOptions({
      quality: 'medium',
      compression: true,
      imageQuality: 0.75,
      maxImageSize: 1280
    });
  }
}

/**
 * Factory pour créer le générateur PDF approprié
 */
export class PDFGeneratorFactory {
  static _generators = new Map();

  static register(name, generator) {
    this._generators.set(name, generator);
  }

  static create(type = 'react-pdf') {
    const Generator = this._generators.get(type);
    if (!Generator) {
      throw new Error(`PDF Generator "${type}" not found. Available: ${Array.from(this._generators.keys()).join(', ')}`);
    }
    return new Generator();
  }

  static isAvailable(type) {
    return this._generators.has(type);
  }
}
