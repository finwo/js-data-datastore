var co     = require('co'),
    JSData = require('js-data'),
    utils  = JSData.utils;

module.exports = function (resource, records) {

  // Keep a reference to ourselves
  var self = this;

  // Go async
  return co(function* () {

    // Convert the records into update commands
    var tasks = [];
    while (records.length) {
      (function (record) {
        tasks.push(co(function* () {

          // Fetch the original data
          var entity = (yield self._find(resource, record[resource.idAttribute])).shift();

          // Overwrite properties
          Object.keys(record).forEach(function (prop) {
            var value = record[prop];
            if ('undefined' === typeof value) {
              return;
            }
            entity[prop] = value;
          });

          // Create the update command
          return {
            key  : entity[self.datastore.KEY],
            data : entity
          };
        }));
      })(records.shift());
    }

    // Wait for all of them to complete
    tasks = yield tasks;
    yield self.datastore.update(tasks);
    var output = tasks.map(function(task) {
      return task.data;
    });

    // Report our success (update would've thrown otherwise)
    return [ output, {} ];
  });
};
