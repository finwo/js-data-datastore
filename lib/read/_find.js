var JSData = require('js-data');

module.exports = function (resource, id) {

  // Keep reference to ourselves
  var self = this;

  // Escape now if we're trying to fetch undefined
  if ( 'undefined' === typeof id ) {
    return JSData.utils.Promise.resolve([ undefined, {} ]);
  }

  // Always return a promise
  return JSData.utils.Promise(function (resolve, reject) {

    // Build the key
    var key = self.datastore.key([resource.name, id]);

    // Try to fetch the record
    self.datastore.get(key, function (err, entity) {

      // Gracefully pass the error to the promise
      if (err) {
        return reject(err);
      }

      // Or resolve with the entity
      resolve([entity, {}]);
    });
  });
};
