var JSData = require('js-data');

module.exports = function (resource, id) {

  // Keep reference to ourselves
  var self = this;

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
