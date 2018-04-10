module.exports = function (adapter) {
  adapter._update     = require('./_update');
  adapter._updateAll  = require('./_updateAll');
  adapter._updateMany = require('./_updateMany');
};

