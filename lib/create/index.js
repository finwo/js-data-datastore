module.exports = function (adapter) {
  adapter._create     = require('./_create');
  adapter._createMany = require('./_createMany');
};
