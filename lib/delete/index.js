module.exports = function (adapter) {
  adapter._destroy    = require('./_destroy');
  adapter._destroyAll = require('./_destroyAll');
};
