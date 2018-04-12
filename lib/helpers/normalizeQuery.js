var utils = require('js-data').utils;

module.exports = function (query) {

  // Keep a reference to ourselves
  var self = this;

  // Sanity checks
  query         = query         || {};
  query.limit   = query.limit   || 0;
  query.orderBy = query.orderBy || [];
  query.skip    = query.skip    || 0;
  query.where   = query.where   || {};

  // Transform non-keyword properties to "where" clause configuration
  utils.forOwn(query, function (config, keyword) {
    if (self.reserved.indexOf(keyword) >= 0) {
      return undefined;
    }
    if (utils.isObject(config)) {
      query.where[keyword] = config;
    } else {
      query.where[keyword] = {
        '==' : config
      };
    }
    if ( query.where[keyword]['==='] ) {
      query.where[keyword]['=='] = query.where[keyword]['==='];
      delete query.where[keyword]['==='];
    }
    if ( query.where[keyword]['='] ) {
      query.where[keyword]['=='] = query.where[keyword]['='];
      delete query.where[keyword]['='];
    }
    delete query[keyword];
  });

  if (!query.limit) {
    delete query.limit;
  }

  if (!query.orderBy.length) {
    delete query.orderBy;
  }

  if (!query.skip) {
    delete query.skip;
  }

  return query;
};
