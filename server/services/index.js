/**
 * Exports centralisés de tous les services
 * Permet d'importer facilement tous les services à partir d'un seul point d'entrée
 */

const fileService = require('./fileService');
const userService = require('./userService');
const trialRequestService = require('./trialRequestService');
const clientService = require('./clientService');
const partService = require('./partService');
const trialService = require('./trialService');
const steelService = require('./steelService');
const nodeService = require('./nodeService');
const reportService = require('./reportService');

module.exports = {
  fileService,
  userService,
  trialRequestService,
  clientService,
  partService,
  trialService,
  steelService,
  nodeService,
  reportService
};
