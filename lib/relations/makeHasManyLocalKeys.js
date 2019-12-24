var jsData = require('js-data'),
    utils  = jsData.utils;

module.exports = function (mapper, def, record) {
  var localKeys = [],
      itemKeys  = utils.get(record, def.localKeys) || [];
  itemKeys      = utils.isArray(itemKeys) ? itemKeys : Object.keys(itemKeys);
  localKeys     = localKeys.concat(itemKeys);
  return localKeys.filter(function (element, index) {
    if (!element) return false;
    return index === localKeys.indexOf(element);
  });
};
