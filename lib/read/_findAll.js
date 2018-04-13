var JSData = require('js-data'),
    utils  = JSData.utils;

var operatorMap = {
  '===' : '=',
  '=='  : '=',
  '<'   : '<',
  '>'   : '>',
  '<='  : '<=',
  '>='  : '>=',
};

module.exports = function _findAll(resource, params) {

  // Keep reference to ourselves
  var self = this;
  params   = self.normalizeQuery(params);

  // Always return a promise
  return new utils.Promise(function (resolve) {

    // Initialize query list
    var unprocessed = [ params ],
        queries     = [];

    // Convert IN operators to multiple queries
    while (unprocessed.length) {
      (function(query) {
        var hasIn = false;
        Object.keys(query.where).forEach(function (keyword) {
          if (hasIn) {
            return;
          }
          var config = query.where[keyword];
          if (Array.isArray(config.in)) {
            hasIn         = true;
            var newParams = JSON.parse(JSON.stringify(query)),
                list      = newParams.where[keyword].in;
            delete newParams.where[keyword].in;
            // Add a query for every IN element
            while (list.length) {
              newParams.where[keyword]['=='] = list.shift();
              unprocessed.push(self.normalizeQuery(JSON.parse(JSON.stringify(newParams))));
            }
          }
        });
        if (!hasIn) {
          queries.push(query);
        }
      })(unprocessed.shift());
    }

    // Start the queries
    queries = queries.map(function (params) {
      var query = self.datastore.createQuery(self.namespace, resource.name);

      // Add as many filters as we support
      Object.keys(params.where).forEach(function (keyword) {
        var config = params.where[keyword];
        Object.keys(config).forEach(function (operator) {
          if (operatorMap[operator]) {
            var value = config[operator];
            if ('undefined' === typeof value) {
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

      // Run this query
      return new utils.Promise(function (success, fail) {
        self.datastore.runQuery(query, function (err, entities) {
          if (err) {
            return fail(err);
          }
          return success(entities);
        });
      });
    });

    // Wait for all queries to finish
    utils.Promise
      .all(queries)
      .then(function (results) {

        // Flatten the result array
        results = Array.prototype.concat.apply([], results);

        // Deduplicate the result
        var seen = [];
        results  = results.filter(function (entity) {
          if (seen.indexOf(entity[resource.idAttribute]) < 0) {
            seen.push(entity[resource.idAttribute]);
            return true;
          }
          return false;
        });

        // Let js-data handle all filters we do not support
        var jsdQuery = new JSData.Query({
          index : {
            getAll : function () {
              return results;
            }
          }
        });

        // Return the output of that
        resolve([jsdQuery.filter(params).run(), {}]);
      });
  });
};
