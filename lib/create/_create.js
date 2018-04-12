var co     = require('co'),
    JSData = require('js-data'),
    utils  = JSData.utils;

/**
 * Internal method used by Adapter#create
 *
 * @method DatastoreAdapter#_create
 *
 * @param {object} resource
 * @param {object} attrs
 * @param {object} [options]
 *
 * @returns {Promise}
 */
module.exports = function (resource, attrs, options) {

  // Keep a reference to ourselves
  var self = this;

  // Make sure we got data
  if (!attrs) {
    return utils.Promise.reject("No data was given");
  }

  // Make sure the options is an object
  options = options || {};

  // Always return a promise
  return co(function*() {

    // Make sure we have an ID
    attrs[resource.idAttribute] = attrs[resource.idAttribute] || ( yield self.generateId(resource) );

    // Generate the key for this entity
    var key = self.datastore.key([resource.name, attrs[resource.idAttribute]]);

    // Always return a promise
    return new utils.Promise(function (resolve, reject) {

      // Check if it already exists
      self.datastore.get(key, function(err, entity) {
        var exists = !!entity;

        // Upsert if needed
        if ( exists && options.upsert ) {
          return self._update( resource, attrs, options )
                     .then(resolve, reject);
        }

        // Reject if it already exists
        if ( exists ) {
          return reject("Entity already exists");
        }

        // Let's save it then
        self.datastore.save({
          key  : key,
          data : attrs
        }, function(err) {
          if ( err ) {
            return reject(err);
          }

          resolve([ attrs, {} ]);
        });
      });

    });
  });
};
