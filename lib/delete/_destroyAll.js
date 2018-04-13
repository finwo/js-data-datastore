var co = require('co');

module.exports = function (resource, params) {

  // Keep a reference to ourselves
  var self = this;

  // Go async, it saves us some headache
  return co(function*() {

    // Fetch all entities we need to delete
    var entities = (yield self._findAll(resource,params)).shift();

    // Map the entities into keys
    var keys = entities.map(function(entity) {
      return entity[self.datastore.KEY];
    });

    // Destroy them all
    yield self.datastore.delete(keys);

    // Return our success (delete might throw, which stops this code)
    return [ undefined, {} ];
  });
};
