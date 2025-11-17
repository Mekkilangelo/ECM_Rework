/**
 * DOMAIN ENTITY: Report
 * Représentation métier d'un rapport d'essai
 * Immutable et contient la logique métier pure
 */

export class Report {
  constructor({
    id,
    trialId,
    trialData,
    partData,
    clientData,
    sections = [],
    metadata = {}
  }) {
    this.id = id;
    this.trialId = trialId;
    this.trialData = trialData;
    this.partData = partData;
    this.clientData = clientData;
    this.sections = sections;
    this.metadata = {
      createdAt: new Date(),
      version: '2.0',
      ...metadata
    };

    // Propriétés de commodité pour le PDF (compatibilité avec l'ancien système)
    this.testId = trialId;
    this.testCode = trialData?.trial_code || '';
    this.testDate = trialData?.trial_date || null;
    this.testName = trialData?.trial_code || '';
    this.loadNumber = trialData?.load_number || '';
    this.status = trialData?.status || '';
    this.location = trialData?.location || '';
    
    this.partId = partData?.node_id || partData?.id || null;
    this.partName = partData?.name || '';
    
    this.clientId = clientData?.node_id || clientData?.id || null;
    this.clientName = clientData?.name || '';
    
    // Données de recette et trempe (depuis trialData)
    this.recipeData = trialData?.recipe_data || null;
    this.quenchData = trialData?.quench_data || null;
    this.furnaceData = trialData?.furnace_data || null;
    this.resultsData = trialData?.results_data || null;
    this.loadData = trialData?.load_data || null;
  }

  /**
   * Valide si le rapport peut être généré
   */
  isValid() {
    return (
      this.trialId &&
      this.trialData &&
      this.sections.length > 0
    );
  }

  /**
   * Retourne le titre du rapport
   */
  getTitle() {
    return `Rapport d'essai - ${this.trialData?.trial_code || this.trialId}`;
  }

  /**
   * Retourne le nom du fichier PDF
   */
  getFileName() {
    const code = this.trialData?.trial_code || this.trialId;
    const date = new Date().toISOString().split('T')[0];
    return `rapport-${code}-${date}.pdf`;
  }

  /**
   * Clone le rapport avec de nouvelles sections
   */
  withSections(sections) {
    return new Report({
      ...this,
      sections
    });
  }

  /**
   * Ajoute une section au rapport
   */
  addSection(section) {
    return new Report({
      ...this,
      sections: [...this.sections, section]
    });
  }

  /**
   * Retourne les sections activées
   */
  getActiveSections() {
    return this.sections.filter(s => s.isEnabled);
  }

  /**
   * Estime la taille du rapport en pages
   */
  estimatePageCount() {
    // 1 page de garde
    // 1 page par section + photos
    let pages = 1;
    
    this.getActiveSections().forEach(section => {
      pages += section.estimatePages();
    });

    return pages;
  }
}
