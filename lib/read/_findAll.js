var JSData = require('js-data'),
    utils  = JSData.utils;

var operatorMap = {
  '==' : '=',
  '<'  : '<',
  '>'  : '>',
  '<=' : '<=',
  '>=' : '>=',
};

module.exports = function (resource, params) {

  // Keep reference to ourselves
  var self = this;

  // Always return a promise
  return new utils.Promise(function (resolve, reject) {

    // Initialize query
    var query = self.datastore.createQuery(self.namespace, resource.name);
    params    = self.normalizeQuery(params);

    // Add as many filters as we support
    Object.keys(params.where).forEach(function (keyword) {
      var config = params.where[keyword];
      Object.keys(config).forEach(function (operator) {
        if (operatorMap[operator]) {
          var value = config[operator];
          if ( 'undefined' === typeof value ) {
            return;
          }
          if (keyword === resource.idAttribute) {
            value   = self.datastore.key([resource.name, value]);
            keyword = '__key__';
          }
          query = query.filter(keyword, operatorMap[operator], value);
        }
      });
    });

    // Let's run the query to fetch our set
    self.datastore.runQuery(query, function (err, entities) {

      // Hand over the error to the promise
      if ( err ) {
        return reject(err);
      }

      // Or try to let js-data handle all non-processed filters
      var jsdQuery = new JSData.Query({
        index: {
          getAll: function() {
            return entities;
          }
        }
      });

      // Return whatever the js-data query doesn't filter out
      resolve([ jsdQuery.filter(params).run(), {}]);
    });
  });
};
