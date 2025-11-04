/**
 * Exports centralisés de tous les services
 * Permet d'importer facilement tous les services à partir d'un seul point d'entrée
 */

const fileService = require('./fileService');
const userService = require('./userService');
const orderService = require('./orderService');
const clientService = require('./clientService');
const partService = require('./partService');
const testService = require('./testService');
const steelService = require('./steelService');
const nodeService = require('./nodeService');
const reportService = require('./reportService');

module.exports = {
  fileService,
  userService,
  orderService,
  clientService,
  partService,
  testService,
  steelService,
  nodeService,
  reportService
};
