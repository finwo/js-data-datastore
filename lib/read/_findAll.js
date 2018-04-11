var JSData = require('js-data'),
    utils  = JSData.utils;

module.exports = function (resource, params) {

  // Keep reference to ourselves
  var self = this;

  // Always return a promise
  return new utils.Promise(function (resolve, reject) {

    // Initialize query
    var query = self.datastore.createQuery(resource.name);
    params    = self.normalizeQuery(params);

    // Add as many filters as we support
    Object.keys(params.where).forEach(function(keyword) {
      var config = params.where[keyword];
    });

    console.log('params', params);

    // TODO: make this happen in the following steps:
    //
    // 1. Fetch with the most inclusive filter that DataStore supports
    // 2. Pass that into a JSData.Query instance
    // 3. Let js-data handle the rest of the filters
    // 4. Return the result of that

    reject("Not implemented");
  });
};
