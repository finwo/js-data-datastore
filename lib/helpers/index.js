module.exports = function(adapter) {
  adapter.generateId     = require('./generateId');
  adapter.normalizeQuery = require('./normalizeQuery');
  adapter.reserved       = require('./reserved');
};
