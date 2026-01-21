/**
 * DOMAIN SERVICE: ReportBuilder
 * Construction progressive d'un rapport avec le pattern Builder
 */

import { Report } from '../entities/Report';
import { SectionFactory } from '../entities/Section';

export class ReportBuilder {
  constructor() {
    this.reset();
  }

  reset() {
    this._id = null;
    this._trialId = null;
    this._trialData = null;
    this._partData = null;
    this._clientData = null;
    this._sections = SectionFactory.createAllSections(true);
    this._metadata = {};
    return this;
  }

  setId(id) {
    this._id = id;
    return this;
  }

  setTrialId(trialId) {
    this._trialId = trialId;
    return this;
  }

  setTrialData(data) {
    this._trialData = data;
    return this;
  }

  setPartData(data) {
    this._partData = data;
    return this;
  }

  setClientData(data) {
    this._clientData = data;
    return this;
  }

  setSections(sections) {
    this._sections = sections;
    return this;
  }

  enableSection(sectionType) {
    this._sections = this._sections.map(section =>
      section.type === sectionType ? section.toggle() : section
    );
    return this;
  }

  disableSection(sectionType) {
    this._sections = this._sections.map(section =>
      section.type === sectionType && section.isEnabled ? section.toggle() : section
    );
    return this;
  }

  toggleSection(sectionType) {
    this._sections = this._sections.map(section =>
      section.type === sectionType ? section.toggle() : section
    );
    return this;
  }

  setSectionPhotos(sectionType, photos) {
    this._sections = this._sections.map(section =>
      section.type === sectionType ? section.withPhotos(photos) : section
    );
    return this;
  }

  setSectionData(sectionType, data) {
    this._sections = this._sections.map(section =>
      section.type === sectionType ? section.withData(data) : section
    );
    return this;
  }

  setMetadata(metadata) {
    this._metadata = { ...this._metadata, ...metadata };
    return this;
  }

  /**
   * Construit le rapport final
   */
  build() {
    return new Report({
      id: this._id,
      trialId: this._trialId,
      trialData: this._trialData,
      partData: this._partData,
      clientData: this._clientData,
      sections: this._sections,
      metadata: this._metadata
    });
  }

  /**
   * Construit à partir d'un rapport existant
   */
  static fromReport(report) {
    const builder = new ReportBuilder();
    builder._id = report.id;
    builder._trialId = report.trialId;
    builder._trialData = report.trialData;
    builder._partData = report.partData;
    builder._clientData = report.clientData;
    builder._sections = report.sections;
    builder._metadata = report.metadata;
    return builder;
  }

  /**
   * Construit à partir de données brutes de l'API
   */
  static fromApiData(apiData, selectedSections = {}, selectedPhotos = {}) {
    const builder = new ReportBuilder();

    console.log('🔍 [ReportBuilder] fromApiData - apiData.partData reçu:', {
      hasPartData: !!apiData.partData,
      dim_rect_unit: apiData.partData?.dim_rect_unit,
      dim_circ_unit: apiData.partData?.dim_circ_unit,
      dim_weight_unit: apiData.partData?.dim_weight_unit,
      allKeys: apiData.partData ? Object.keys(apiData.partData) : []
    });

    builder
      .setTrialId(apiData.trialId || apiData.testId)
      .setTrialData({
        trial_code: apiData.testCode || apiData.trialCode,
        trial_date: apiData.testDate || apiData.trialDate,
        load_number: apiData.loadNumber,
        status: apiData.status,
        location: apiData.location,
        process_type: apiData.trialData?.process_type,
        processTypeRef: apiData.trialData?.processTypeRef,
        recipe_data: apiData.recipeData,
        quench_data: apiData.quenchData,
        furnace_data: apiData.furnaceData,
        results_data: apiData.resultsData,
        load_data: apiData.loadData
      })
      .setPartData({
        ...(apiData.partData || {}),
        node_id: apiData.partId,
        name: apiData.partName,
        id: apiData.partId
      })
      .setClientData({
        ...(apiData.clientData || {}),
        node_id: apiData.clientId,
        name: apiData.clientName,
        id: apiData.clientId
      });

    // Configurer les sections
    Object.entries(selectedSections).forEach(([sectionType, isEnabled]) => {
      if (!isEnabled) {
        builder.disableSection(sectionType);
      }

      // Ajouter les photos si disponibles
      if (selectedPhotos[sectionType]) {
        builder.setSectionPhotos(sectionType, selectedPhotos[sectionType]);
      } else if (apiData.sectionFiles && apiData.sectionFiles[sectionType]) {
        // Fallback aux fichiers retournés par l'API si aucune sélection manuelle
        builder.setSectionPhotos(sectionType, apiData.sectionFiles[sectionType]);
      }

      // Ajouter les données spécifiques à la section
      const sectionData = builder._getSectionDataFromApi(sectionType, apiData);
      if (sectionData) {
        builder.setSectionData(sectionType, sectionData);
      }
    });

    return builder;
  }

  /**
   * Extrait les données spécifiques à une section depuis les données API
   */
  _getSectionDataFromApi(sectionType, apiData) {
    const dataMap = {
      recipe: apiData.recipeData || apiData.recipe_data,
      quench: apiData.quenchData || apiData.quench_data,
      curves: {
        recipe: apiData.recipeData,
        quench: apiData.quenchData
      },
      control: apiData.resultsData || apiData.results_data,
      load: apiData.loadData || apiData.load_data
    };

    return dataMap[sectionType];
  }
}
