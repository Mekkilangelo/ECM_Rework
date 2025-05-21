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

module.exports = {
  fileService,
  userService,
  orderService,
  clientService,
  partService,
  testService,
  steelService
};
