var co     = require('co'),
    JSData = require('js-data'),
    utils  = JSData.utils;

module.exports = function (resource, attrs, params) {

  // Keep a reference to ourselves
  var self = this;

  // Go async, it saves us some headaches
  return co(function* () {

    // Fetch the records we need to update
    var entities = (yield self._findAll(resource, params)).shift();

    // Overwrite properties & map for update
    entities = entities.map(function (original) {
      Object.keys(attrs).forEach(function (prop) {
        var value = attrs[prop];
        if ('undefined' === typeof value) {
          return;
        }
        original[prop] = value;
      });

      return {
        key  : original[self.datastore.KEY],
        data : original
      };
    });

    // Save them all
    yield self.datastore.update(entities);

    // Prepare our output
    var result = entities.map(function(updateEntity) {
      return updateEntity.data;
    });

    // Report our success
    return [ result, {} ];
  });
};
