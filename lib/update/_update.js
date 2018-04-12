var co     = require('co'),
    JSData = require('js-data'),
    utils  = JSData.utils;

module.exports = function (resource, id, attrs) {

  // Keep a reference to ourselves
  var self = this;

  // Build the key
  var key = self.datastore.key([resource.name, id]);

  // Return a promise & go async
  return co(function* () {

    // Fetch the original, because we're updating
    var entity = (yield self.datastore.get(key)).shift();

    // Overwrite properties
    Object.keys(attrs).forEach(function (prop) {
      var value = attrs[prop];
      if ('undefined' === typeof value) {
        return;
      }
      entity[prop] = value;
    });

    // Save it again
    yield self.datastore.save({
      key  : key,
      data : entity
    });

    // Report our success
    return [entity, {}];
  });
};
