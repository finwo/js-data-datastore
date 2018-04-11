module.exports = function(adapter) {
  adapter.normalizeQuery = require('./normalizeQuery');
  adapter.reserved       = require('./reserved');
};
