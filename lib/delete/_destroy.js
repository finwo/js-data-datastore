var co     = require('co'),
    JSData = require('js-data'),
    utils  = JSData.utils;

module.exports = function (resource, id) {

  // Keep a reference to ourselves
  var self = this;

  // Build the key
  var key = self.datastore.key([ resource.name, id ]);

  // Return a promise & go async
  return co(function*() {

    // Destroy the key
    yield self.datastore.delete(key);

    // Report our success (delete would've thrown if something went wrong)
    return [ undefined, {} ];
  });
};
