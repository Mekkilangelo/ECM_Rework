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

    const partData = apiData.partData || {};

    // Normaliser partData pour s'assurer que les unités sont dans le bon format
    // Même logique que PartIdentificationReport pour cohérence
    const normalizedPartData = {
      ...partData,
      node_id: apiData.partId,
      name: apiData.partName,
      id: apiData.partId,
      // Normaliser les dimensions (camelCase et snake_case)
      dim_rect_length: partData.dimRectLength || partData.dim_rect_length,
      dim_rect_width: partData.dimRectWidth || partData.dim_rect_width,
      dim_rect_height: partData.dimRectHeight || partData.dim_rect_height,
      dim_circ_diameterOut: partData.dimCircDiameterOut || partData.dim_circ_diameterOut,
      dim_circ_diameterIn: partData.dimCircDiameterIn || partData.dim_circ_diameterIn,
      dim_weight_value: partData.dimWeightValue || partData.dim_weight_value,
      // S'assurer que les unités sont des strings (pas des objets)
      // Priorité: valeur snake_case directe > camelCase > objet.name
      dim_rect_unit: partData.dim_rect_unit || partData.dimRectUnit ||
                     (partData.rectUnit?.name) || (typeof partData.rectUnit === 'string' ? partData.rectUnit : null),
      dim_circ_unit: partData.dim_circ_unit || partData.dimCircUnit ||
                     (partData.circUnit?.name) || (typeof partData.circUnit === 'string' ? partData.circUnit : null),
      dim_weight_unit: partData.dim_weight_unit || partData.dimWeightUnit ||
                       (partData.weightUnit?.name) || (typeof partData.weightUnit === 'string' ? partData.weightUnit : null),
      // Garder aussi les objets relation pour compatibilité
      rectUnit: partData.rectUnit,
      circUnit: partData.circUnit,
      weightUnit: partData.weightUnit,
      // IMPORTANT: Garder les spécifications
      hardnessSpecs: partData.hardnessSpecs || [],
      ecdSpecs: partData.ecdSpecs || [],
      steel: partData.steel,
      description: apiData.partDescription || partData.description || ''
    };

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
        load_data: apiData.loadData,
        observation: apiData.trialData?.observation,
        conclusion: apiData.trialData?.conclusion
      })
      .setPartData(normalizedPartData)
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
