/**
 * Migration 001 - Seed all file categories and subcategories
 *
 * Consolidates all ref_file_category / ref_file_subcategory values
 * that the application expects to exist.
 */
module.exports = {
  name: '001-seed-file-categories',

  async up(queryInterface, sequelize, transaction) {
    // -- Categories --
    const categories = [
      'general',
      'furnace_report',
      'datapaq',
      'micrographs',
      'micrography',
      'control-location',
      'part_documents',
      'trial_documents',
      'documents',
      'photos',
      'load_design',
      'observations',
      'post_treatment',
      'simulation',
    ];

    for (const name of categories) {
      await sequelize.query(
        'INSERT IGNORE INTO `ref_file_category` (`name`) VALUES (?)',
        { replacements: [name], transaction }
      );
    }

    // -- Subcategories (no FK constraint, documentary only) --
    const subcategories = [
      'heating',
      'cooling',
      'tempering',
      'alarms',
      'x50',
      'x500',
      'x1000',
      'other',
      'simulation',
    ];

    for (const name of subcategories) {
      await sequelize.query(
        'INSERT IGNORE INTO `ref_file_subcategory` (`name`) VALUES (?)',
        { replacements: [name], transaction }
      );
    }
  }
};
