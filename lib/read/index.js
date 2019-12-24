module.exports = function (adapter) {
  adapter._find    = require('./_find');
  adapter._findAll = require('./_findAll');
};
