/*
 *  js-data-datastore
 */

'use strict';

var jsData        = require('js-data');
var jsDataAdapter = require('js-data-adapter');

var slicedToArray = function () {

  function sliceIterator(arr, i) {
    var _arr = [];
    var _n   = true;
    var _d   = false;
    var _e   = undefined;

    try {
      for ( var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true ) {
        _arr.push(_s.value);

        if ( i && _arr.length === i ) break;
      }
    } catch ( err ) {
      _d = true;
      _e = err;
    } finally {
      try {
        if ( !_n && _i["return"] ) _i["return"]();
      } finally {
        if ( _d ) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if ( Array.isArray(arr) ) {
      return arr;
    } else if ( Symbol.iterator in Object(arr) ) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var __super__ = jsDataAdapter.Adapter.prototype;

var equal = function equal(query, field, value) {
  return query.filter(field, '=', value);
};

/**
 * Default predicate functions for the filtering operators.
 *
 * @name module:js-data-cloud-datastore.OPERATORS
 * @property {Function} == Equality operator.
 * @property {Function} > "Greater than" operator.
 * @property {Function} >= "Greater than or equal to" operator.
 * @property {Function} < "Less than" operator.
 * @property {Function} <= "Less than or equal to" operator.
 */
var OPERATORS = {
  '=='  : equal,
  '===' : equal,
  '>'   : function _(query, field, value) {
    return query.filter(field, '>', value);
  },
  '>='  : function _(query, field, value) {
    return query.filter(field, '>=', value);
  },
  '<'   : function _(query, field, value) {
    return query.filter(field, '<', value);
  },
  '<='  : function _(query, field, value) {
    return query.filter(field, '<=', value);
  }
};

var unique = function unique(array) {
  var seen  = {};
  var final = [];
  array.forEach(function (item) {
    if ( item in seen ) {
      return;
    }
    final.push(item);
    seen[item] = 0;
  });
  return final;
};

var defineProperty = function (obj, key, value) {
  if ( key in obj ) {
    Object.defineProperty(obj, key, {
      value        : value,
      enumerable   : true,
      configurable : true,
      writable     : true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};


function DataStoreAdapter(options) {
  options = options || {};
  if ( 'object' !== typeof options ) {
    return false;
  }
  options.config           = options.config || {};
  options.config.namespace = options.config.namespace || 'development';
  
  // We need either a project or keyfile
  if ( 'undefined' === typeof options.config.projectId &&
       'undefined' === typeof options.config.keyFilename
  ) {
    return false;
  }

  // Remove the project ID if we have a keyfile
  if ( 'undefined' !== typeof options.config.keyFilename ) {
    delete options.config.projectId;
  }

  jsData.utils.classCallCheck(this, DataStoreAdapter);

  jsDataAdapter.Adapter.call(this, options);

  this.datastore = require('@google-cloud/datastore')(options.config);
}

jsDataAdapter.Adapter.extend({

  constructor : DataStoreAdapter,

  /**
   * Apply the specified selection query to the provided Datastore query.
   *
   * @method DataStoreAdapter#filterQuery
   * @param {Object} mapper The mapper.
   * @param {Object} [query] Selection query.
   * @param {Object} [query.where] Filtering criteria.
   * @param {string|Array} [query.orderBy] Sorting criteria.
   * @param {string|Array} [query.sort] Same as `query.sort`.
   * @param {number} [query.limit] Limit results.
   * @param {number} [query.skip] Offset results.
   * @param {number} [query.offset] Same as `query.skip`.
   * @param {Object} [opts] Configuration options.
   * @param {Object} [opts.operators] Override the default predicate functions
   * for specified operators.
   */
  filterQuery : function filterQuery(dsQuery, query, opts) {
    var _this = this;

    query = jsData.utils.plainCopy(query || {});
    opts || (opts = {});
    opts.operators || (opts.operators = {});
    query.where || (query.where = {});
    query.orderBy || (query.orderBy = query.sort);
    query.orderBy || (query.orderBy = []);
    query.skip || (query.skip = query.offset);

    // Transform non-keyword properties to "where" clause configuration
    jsData.utils.forOwn(query, function (config, keyword) {
      if ( jsDataAdapter.reserved.indexOf(keyword) === -1 ) {
        if ( jsData.utils.isObject(config) ) {
          query.where[keyword] = config;
        } else {
          query.where[keyword] = {
            '==' : config
          };
        }
        delete query[keyword];
      }
    });

    // Apply filter
    if ( Object.keys(query.where).length !== 0 ) {
      jsData.utils.forOwn(query.where, function (criteria, field) {
        if ( !jsData.utils.isObject(criteria) ) {
          query.where[field] = {
            '==' : criteria
          };
        }

        jsData.utils.forOwn(criteria, function (value, operator) {
          var isOr      = false;
          var _operator = operator;
          if ( _operator && _operator[0] === '|' ) {
            _operator = _operator.substr(1);
            isOr      = true;
          }
          var predicateFn = _this.getOperator(_operator, opts);
          if ( predicateFn ) {
            if ( isOr ) {
              throw new Error('Operator ' + operator + ' not supported!');
            } else {
              dsQuery = predicateFn(dsQuery, field, value);
            }
          } else {
            throw new Error('Operator ' + operator + ' not supported!');
          }
        });
      });
    }

    // Apply sort
    if ( query.orderBy ) {
      if ( jsData.utils.isString(query.orderBy) ) {
        query.orderBy = [[query.orderBy, 'asc']];
      }
      query.orderBy.forEach(function (clause) {
        if ( jsData.utils.isString(clause) ) {
          clause = [clause, 'asc'];
        }
        dsQuery = clause[1].toUpperCase() === 'DESC' ? dsQuery.order(clause[0], {descending : true}) : dsQuery.order(clause[0]);
      });
    }

    // Apply skip/offset
    if ( query.skip ) {
      dsQuery = dsQuery.offset(+query.skip);
    }

    // Apply limit
    if ( query.limit ) {
      dsQuery = dsQuery.limit(+query.limit);
    }

    return dsQuery;
  },

  _count : function _count(mapper, query, opts) {
    var _this2 = this;

    opts || (opts = {});
    query || (query = {});

    return new jsData.utils.Promise(function (resolve, reject) {
      var dsQuery = _this2.datastore.createQuery(_this2.getKind(mapper, opts));
      dsQuery     = _this2.filterQuery(dsQuery, query, opts).select('__key__');
      _this2.datastore.runQuery(dsQuery, function (err, entities) {
        if ( err ) {
          return reject(err);
        }
        return resolve([entities ? entities.length : 0, {}]);
      });
    });
  },

  /**
   * Internal method used by DataStoreAdapter#_create and
   * DataStoreAdapter#_createMany.
   *
   * @method DataStoreAdapter#_createHelper
   * @private
   * @param {Object} mapper The mapper.
   * @param {(Object|Object[])} records The record or records to be created.
   * @return {Promise}
   */
  _createHelper : function _createHelper(mapper, records) {

    var _this3 = this;

    var singular = !jsData.utils.isArray(records);
    if ( singular ) {
      records = [records];
    }
    records = jsData.utils.plainCopy(records);
    return new jsData.utils.Promise(
      function (resolve, reject) {
        try {
          var apiResponse   = void 0;
          var idAttribute   = mapper.idAttribute;
          var incompleteKey = _this3.datastore.key(_this3.getKind(mapper));

          _this3.checkIdAttribute(mapper, records)
          .then(function() {
            // Allocate ids
            _this3.datastore.allocateIds(incompleteKey, records.length, function (err, keys) {
              if ( err ) {
                return reject(err);
              }
              var entities = records.map(function (_record, i) {
                if (_record[idAttribute]) {
                  keys[i] = _this3.datastore.key([_this3.getKind(mapper), _record[idAttribute]]);
                }
                jsData.utils.set(_record, idAttribute, keys[i].path[1]);
                return {
                  key  : keys[i],
                  data : _record
                };
              });
              // Save records
              _this3.datastore.save(entities, function (err, _apiResponse) {
                if ( err ) {
                  return reject(err);
                }
                return resolve([singular ? records[0] : records, _apiResponse]);
              });
            });
          });

        } catch ( e ) {
          return reject(e);
        }
      });
  },

  /**
   * Create a new record. Internal method used by Adapter#create.
   *
   * @method DataStoreAdapter#_create
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The record to be created.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _create : function _create(mapper, props, opts) {
    return this._createHelper(mapper, props, opts);
  },

  /**
   * Create multiple records in a single batch. Internal method used by
   * Adapter#createMany.
   *
   * @method DataStoreAdapter#_createMany
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The records to be created.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _createMany : function _createMany(mapper, props, opts) {
    return this._createHelper(mapper, props, opts);
  },

  /**
   * Destroy the record with the given primary key. Internal method used by
   * Adapter#destroy.
   *
   * @method DataStoreAdapter#_destroy
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to destroy.
   * response object.
   * @return {Promise}
   */
  _destroy : function _destroy(mapper, id, opts) {
    var _this4 = this;

    return new jsData.utils.Promise(function (resolve, reject) {
      try {
        id      = (parseInt(id, 10) == id) ? parseInt(id, 10) : id;
        var key = _this4.datastore.key([_this4.getKind(mapper, opts), id]);
        _this4.datastore.delete(key, function(err, apiResponse) {
          if ( err ) {
            return reject(err);
          }
          resolve([id, apiResponse]);
        });
      } catch ( e ) {
        return reject(e);
      }
    });
  },

  /**
   * Destroy the records that match the selection query. Internal method used by
   * Adapter#destroyAll.
   *
   * @method DataStoreAdapter#_destroyAll
   * @private
   * @param {Object} mapper the mapper.
   * @param {Object} [query] Selection query.
   * @return {Promise}
   */
  _destroyAll : function _destroyAll(mapper, query, opts) {

    var _this5 = this;

    return new jsData.utils.Promise(function (resolve, reject) {
      try {
        _this5.findAll(mapper, query, opts)
        .then( function (entities) {
          var keys = entities.map(function (entity) {
            return entity[_this5.datastore.KEY];
          });
          _this5.datastore.delete(keys, function (err, apiResponse) {
            if ( err ) {
              return reject(err);
            }
            resolve([undefined, apiResponse]);
          });
        });
      } catch ( e ) {
        return reject(e);
      }
    });
  },

  /**
   * Retrieve the record with the given primary key. Internal method used by
   * Adapter#find.
   *
   * @method DataStoreAdapter#_find
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to retrieve.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _find : function _find(mapper, id, opts) {
    var _this6 = this;

    return new jsData.utils.Promise(function (resolve, reject) {
      // googledatastore create his key based on key value we send.
      // String -> 'name', Int -> 'id
      id      = (parseInt(id, 10) == id) ? parseInt(id, 10) : id;
      var key = _this6.datastore.key([_this6.getKind(mapper, opts), id]);
      _this6.datastore.get(key, function (err, entity) {
        if ( !err && !entity ) {
          err = {
            code    : 404,
            message : 'Not found'
          };
        }
        return err ? reject(err) : resolve([entity ? entity : undefined, {}]);
      });
    });
  },

  /**
   * detect Operators non provided by datastore and create eventually multiple queries to be run
   *
   * @param   {object}    query to check and explode
   * @return  {object[]}  array of queries to be run
   */
  compileFetchQueries : function compileFetchQueries(query) {
    var where,
        _this   = this,
        output  = [],
        filters = [],
        queries = [];
    if ( query.where ) where = query.where;
    else where = query;
    Object.keys(where).map(function (property) {
      // explode 'in' operator
      if ( where[property]['in'] ) {
        output = where[property]['in'].map(function (value) {
          var _new = JSON.parse(JSON.stringify(query)),
              _where;
          if ( _new.where ) _where = _new.where;
          else _where = _new;
          delete _where[property]['in'];
          _where[property] = {'==' : value};
          return _new;
        });
        if (!output.length) {
          delete where[property]['in'];
          where[property] = {'==' : ''};
        }
      } else if ( where[property]['contains'] ) {
        filters[property] = {
          contains : where[property]['contains']
        };
        delete where[property];
      }
    });
    if ( output.length ) {
      //merge all results
      output.map(function (_query) {
        // call recursively itself to explode queries obtained
        var _q  = _this.compileFetchQueries(_query);
        queries = queries.concat(_q.queries);
        filters = filters.concat(_q.filters);
      });
    } else {
      queries.push(query);
    }
    return {
      queries : queries,
      filters : filters
    };
  },

  /**
   * Managare filters not provided by datastore and apply options like sort if more db queries were made
   *
   * @param   {object[]}    queries   queries ran by datastore
   * @param   {record[]}    results   results provided by queries
   * @return  {record[][]}            array containing in first item all the results filtered
   */
  compileFilterQueries : function compileFilterQueries(queries, filters, results) {
    if ( Object.keys(filters).length > 0 ) {
      results = results.filter(function (result) {
        var condition = true;
        Object.keys(filters).forEach(function (field) {
          result[field] = result[field] || '';
          var filter    = Object.keys(filters[field])[0];
          switch ( filter ) {
            case 'contains' :
              if ( !Array.isArray(result[field]) ) {
                condition = false;
              } else {
                condition = result[field].indexOf(filters[field][filter]) >= 0;
              }
              break;
            default :
              break;
          }
        });
        return condition;
      });
    }
    if ( queries.length > 1 ) {
      // TODO: sorting
    }
    return [results];
  },

  /**
   * Retrieve the records that match the selection query. Internal method used
   * by Adapter#findAll.
   *
   * @method DataStoreAdapter#_findAll
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _findAll : function _findAll(mapper, query, opts) {

    var _this7 = this;
    var meta   = {};

    // explode query syntax for unsupported operators (like 'in')
    var fetchedQueries = _this7.compileFetchQueries(query),
        p              = [];
    var queries        = fetchedQueries.queries,
        filters        = fetchedQueries.filters;
    queries.forEach(function (_query) {
      // all queryies are executed
      var dsQuery = _this7.datastore.createQuery(_this7.getKind(mapper, opts));
      dsQuery     = _this7.filterQuery(dsQuery, _query, opts);
      p.push(new jsData.utils.Promise(function (resolve, reject) {
        _this7.datastore.runQuery(dsQuery, function (err, entities) {
          if ( err ) reject(err);
          return resolve(entities);
        });
      }));
    });
    return jsData.utils.Promise.all(p)
      .then(function (res) {
        //all results are merged togheter
        var entities = [];
        res.map(function (result) {
          result.map(function (entity) {
            var found = entities.find(function (_entity) {
              return _entity[mapper.idAttribute] === entity[mapper.idAttribute];
            });
            if ( !found ) entities.push(entity);
          });
        });
        return entities;
      })
      .then(function (res) {
        // all results are sorted and filtered if necessary
        return _this7.compileFilterQueries(queries, filters, res);
      })
      .then(function (res) {
        return res;
      });
  },

  _sum : function _sum(mapper, field, query, opts) {
    var _this8 = this;

    if ( !jsData.utils.isString(field) ) {
      throw new Error('field must be a string!');
    }
    opts || (opts = {});
    query || (query = {});
    var canSelect = !Object.keys(query).length;

    return new jsData.utils.Promise(function (resolve, reject) {
      var dsQuery = _this8.datastore.createQuery(_this8.getKind(mapper, opts));
      dsQuery     = _this8.filterQuery(dsQuery, query, opts);
      if ( canSelect ) {
        dsQuery = dsQuery.select(field);
      }
      _this8.datastore.runQuery(dsQuery, function (err, entities) {
        if ( err ) {
          return reject(err);
        }
        var sum = entities.reduce(function (sum, entity) {
          return sum + (entity.data[field] || 0);
        }, 0);
        return resolve([sum, {}]);
      });
    });
  },

  /**
   * Internal method used by DataStoreAdapter#_update and
   * DataStoreAdapter#_updateAll and DataStoreAdapter#_updateMany.
   *
   * @method DataStoreAdapter#_updateHelper
   * @private
   * @param {Object} mapper The mapper.
   * @param {(Object|Object[])} records The record or records to be updated.
   * @param {(Object|Object[])} props The updates to apply to the record(s).
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _updateHelper : function _updateHelper(mapper, records, props, opts) {
    var _this9 = this;

    var singular = !jsData.utils.isArray(records);
    if ( singular ) {
      records = [records];
      props   = [props];
    }
    return new jsData.utils.Promise(function (resolve, reject) {
      if ( !records.length ) {
        return resolve([singular ? undefined : [], {}]);
      }
      var idAttribute = mapper.idAttribute;
      var entities    = [];
      var _records    = [];
      records.forEach(function (record, i) {
        if ( !record ) {
          return;
        }
        var id = jsData.utils.get(record, idAttribute);
        if ( !jsData.utils.isUndefined(id) ) {
          id      = (parseInt(id, 10) == id) ? parseInt(id, 10) : id;
          for (var key in props[i]) {
            if (props[i][key] != undefined) {
              record[key] = props[i][key];
            }
          }
          entities.push({
            method : 'update',
            key    : _this9.datastore.key([_this9.getKind(mapper, opts), id]),
            data   : record
          });
          _records.push(record);
        }
      });
      if ( !_records.length ) {
        return resolve([singular ? undefined : [], {}]);
      }
      _this9.datastore.save(entities, function (err, apiResponse) {
        return err ? reject(err) : resolve([singular ? _records[0] : _records, apiResponse]);
      });
    });
  },

  /**
   * Apply the given update to the record with the specified primary key.
   * Internal method used by Adapter#update.
   *
   * @method DataStoreAdapter#_update
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id The primary key of the record to be updated.
   * @param {Object} props The update to apply to the record.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _update : function _update(mapper, id, props, opts) {
    var _this10 = this;

    props || (props = {});
    return this._find(mapper, id, opts).then(function (result) {
      if ( result[0] ) {
        props = jsData.utils.plainCopy(props);
        return _this10._updateHelper(mapper, result[0], props, opts);
      }
      throw new Error('Not Found');
    });
  },

  /**
   * Apply the given update to all records that match the selection query.
   * Internal method used by Adapter#updateAll.
   *
   * @method DataStoreAdapter#_updateAll
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The update to apply to the selected records.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _updateAll : function _updateAll(mapper, props, query, opts) {
    var _this11 = this;

    props || (props = {});
    return this._findAll(mapper, query, opts).then(function (result) {
      var _result = slicedToArray(result, 1);

      var records = _result[0];

      records = records.filter(function (record) {
        return record;
      });
      if ( records.length ) {
        props = jsData.utils.plainCopy(props);
        return _this11._updateHelper(mapper, records, records.map(function () {
          return props;
        }), opts);
      }
      return [[], {}];
    });
  },

  /**
   * Update the given records in a single batch. Internal method used by
   * Adapter#updateMany.
   *
   * @method DataStoreAdapter#_updateMany
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object[]} records The records to update.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _updateMany : function _updateMany(mapper, records, opts) {
    var _this12 = this;

    records || (records = []);
    var idAttribute = mapper.idAttribute;
    var tasks       = records.map(function (record) {
      return _this12._find(mapper, jsData.utils.get(record, idAttribute), opts);
    });
    return jsData.utils.Promise.all(tasks).then(function (results) {
      var _records = results.map(function (result) {
        return result[0];
      });
      _records.forEach(function (record, i) {
        if ( !record ) {
          records[i] = undefined;
        }
      });
      _records = _records.filter(function (record) {
        return record;
      });
      records  = records.filter(function (record) {
        return record;
      });
      if ( _records.length ) {
        records = jsData.utils.plainCopy(records);
        return _this12._updateHelper(mapper, _records, records, opts);
      }
      return [[], {}];
    });
  },

  /**
   * load BelongsTo standard relations (foreignKey)
   *
   * @param {*} mapper
   * @param {*} def
   * @param {*} records
   * @param {*} ___opts
   */
  loadBelongsTo : function loadBelongsTo(mapper, def, records, __opts) {
    var _this6   = this,
        singular = false;

    if ( jsData.utils.isObject(records) && !jsData.utils.isArray(records) ) {
      singular = true;
      records  = [records];
    }

    //check for custom relation functions
    if ( mapper.relations[def.type][def.relation].get ) {

      var p = [];
      records.forEach(function (record) {
        p.push(mapper.relations[def.type][def.relation].get({}, {}, record, {})
          .then(function (relatedItems) {
            def.setLocalField(record, relatedItems);
          })
        );
      });
      return Promise.all(p);

    } else {

      var relationDef = def.getRelation();

      if ( singular ) {
        var record = records[0];
        return this.find(relationDef, this.makeBelongsToForeignKey(mapper, def, record), __opts).then(function (relatedItem) {
          def.setLocalField(record, relatedItem);
        });
      } else {
        var keys = [];
        records.forEach(function (record) {
          var key = _this6.makeBelongsToForeignKey(mapper, def, record);
          if ( keys.indexOf(key) < 0 ) keys.push(key);
        });

        var where = {};
        if ( keys.length > 1 ) where[relationDef.idAttribute] = {'in' : keys};
        else where[relationDef.idAttribute] = {'==' : keys.shift()};
        return this.findAll(relationDef, {where : where}, __opts).then(function (relatedItems) {
          records.forEach(function (record) {
            relatedItems.forEach(function (relatedItem) {
              if ( relatedItem[relationDef.idAttribute] === record[def.foreignKey] ) {
                def.setLocalField(record, relatedItem);
              }
            });
          });
        });
      }
    }
  },

  /**
   * load HasMany standard relation (foreignKey)
   *
   * @param {*} mapper
   * @param {*} def
   * @param {*} records
   * @param {*} ___opts
   */
  loadHasMany : function loadHasMany(mapper, def, records, __opts) {
    var _this10  = this,
        singular = false;

    if ( jsData.utils.isObject(records) && !jsData.utils.isArray(records) ) {
      singular = true;
      records  = [records];
    }
    if ( mapper.relations[def.type][def.relation].get ) {

      var p = [];
      records.forEach(function (record) {
        p.push(mapper.relations[def.type][def.relation].get({}, {}, record, {})
          .then(function (relatedItems) {
            def.setLocalField(record, relatedItems);
          })
        );
      });
      return Promise.all(p);

    } else {
      var IDs      = records.map(function (record) {
        return _this10.makeHasManyForeignKey(mapper, def, record);
      });
      var query    = {
        where : {}
      };
      var criteria = query.where[def.foreignKey] = {};
      if ( singular ) {
        // more efficient query when we only have one record
        criteria['=='] = IDs[0];
      } else {
        criteria['in'] = IDs.filter(function (id) {
          return id;
        });
      }
      return this.findAll(def.getRelation(), query, __opts).then(function (relatedItems) {
        records.forEach(function (record) {
          var attached = [];
          // avoid unneccesary iteration when we only have one record
          if ( singular ) {
            attached = relatedItems;
          } else {
            relatedItems.forEach(function (relatedItem) {
              if ( jsData.utils.get(relatedItem, def.foreignKey) === record[mapper.idAttribute] ) {
                attached.push(relatedItem);
              }
            });
          }
          def.setLocalField(record, attached);
        });
      });
    }
  },

  /**
   * load HasMany relation made by LocalKeys
   *
   * @param {*} mapper
   * @param {*} def
   * @param {*} records
   * @param {*} ___opts
   */
  loadHasManyLocalKeys : function loadHasManyLocalKeys(mapper, def, records, __opts) {
    var _this11       = this;
    var record        = void 0;
    var relatedMapper = def.getRelation();

    if ( jsData.utils.isObject(records) && !jsData.utils.isArray(records) ) {
      record = records;
    }

    if ( record ) {
      return _this11.findAll(relatedMapper, {
        where : defineProperty({}, relatedMapper.idAttribute, {
          'in' : _this11.makeHasManyLocalKeys(mapper, def, record)
        })
      }, __opts).then(function (relatedItems) {
        def.setLocalField(record, relatedItems);
      });
    } else {
      var _p = [];
      records.forEach(function (record) {
        if (_this11.makeHasManyLocalKeys(mapper, def, record).length) {
          _p.push(_this11.findAll(relatedMapper, {
            where : defineProperty({}, relatedMapper.idAttribute, {
              'in' : _this11.makeHasManyLocalKeys(mapper, def, record)
            })
          }, __opts));
        } else {
          _p.push([]);
        }
      });
      return Promise.all(_p)
      .then(function (relatedItems) {
        for ( var i in records ) {
          def.setLocalField(records[i], relatedItems[i]);
        }
        return records;
      });
    }
  },

  /**
   * load HasMany relation made by ForeignKeys
   *
   * @param {*} mapper
   * @param {*} def
   * @param {*} records
   * @param {*} ___opts
   */
  loadHasManyForeignKeys : function loadHasManyForeignKeys(mapper, def, records, __opts) {
    var _this12 = this;

    var relatedMapper = def.getRelation();
    var idAttribute   = mapper.idAttribute;
    var record        = void 0;

    if ( jsData.utils.isObject(records) && !jsData.utils.isArray(records) ) {
      record = records;
    }

    if ( record ) {
      return _this12.findAll(def.getRelation(), {
          where : defineProperty({}, def.foreignKeys, {
            'contains' : _this12.makeHasManyForeignKeys(mapper, def, record)
          })
        }, __opts)
        .then(function (relatedItems) {
          def.setLocalField(record, relatedItems);
        });
      return records;
    } else {
      var _p = [];
      records.forEach(function (record) {
        _p.push(_this12.findAll(relatedMapper, {
          where : defineProperty({}, def.foreignKeys, {
            'contains' : _this12.makeHasManyForeignKeys(mapper, def, record)
          })
        }, __opts));
      });
      return Promise.all(_p)
        .then(function (relatedItems) {
          var foreignKeysField = def.foreignKeys;
          for ( var i in records ) {
            def.setLocalField(records[i], relatedItems[i]);
          }
          return records;
        });
    }
  },

  /**
   * load HasOne standard relation (foreignKey)
   *
   * @param {*} mapper
   * @param {*} def
   * @param {*} records
   * @param {*} ___opts
   */
  loadHasOne : function loadHasOne(mapper, def, records, __opts) {
    if ( jsData.utils.isObject(records) && !jsData.utils.isArray(records) ) {
      records = [records];
    }
    return this.loadHasMany(mapper, def, records, __opts).then(function () {
      records.forEach(function (record) {
        var relatedData = def.getLocalField(record);
        if ( jsData.utils.isArray(relatedData) && relatedData.length ) {
          def.setLocalField(record, relatedData[0]);
        } else {
          def.setLocalField(record, undefined);
        }
      });
    });
  },

  /**
   * extract keys for HasMany relation made by foreignKeys
   *
   * @param {*} mapper
   * @param {*} def
   * @param {*} record
   */
  makeHasManyForeignKey : function makeHasManyForeignKey(mapper, def, record) {
    return def.getForeignKey(record);
  },

  /**
   * extract keys for HasMany relations made by localKeys
   *
   * @param {*} mapper
   * @param {*} def
   * @param {*} record
   */
  makeHasManyLocalKeys : function makeHasManyLocalKeys(mapper, def, record) {
    var localKeys = [];
    var itemKeys  = jsData.utils.get(record, def.localKeys) || [];
    itemKeys      = jsData.utils.isArray(itemKeys) ? itemKeys : Object.keys(itemKeys);
    localKeys     = localKeys.concat(itemKeys);
    return unique(localKeys).filter(function (x) {
      return x;
    });
  },

  /**
   * extract key for BelongsTo relation
   *
   * @param {*} mapper
   * @param {*} def
   * @param {*} record
   */
  makeBelongsToForeignKey : function makeBelongsToForeignKey(mapper, def, record) {
    return def.getForeignKey(record);
  },

  /**
   * Resolve the Cloud Datastore kind for the specified Mapper with the given
   * options.
   *
   * @method DataStoreAdapter#getKind
   * @param {Object} mapper The mapper.
   * @param {Object} [opts] Configuration options.
   * @param {Object} [opts.kind] Datastore kind.
   * @return {string} The kind.
   */
  getKind : function getKind(mapper, opts) {
    opts || (opts = {});
    return jsData.utils.isUndefined(opts.kind) ? jsData.utils.isUndefined(mapper.kind) ? mapper.name : mapper.kind : opts.kind;
  },

  /**
   * Resolve the predicate function for the specified operator based on the
   * given options and this adapter's settings.
   *
   * @method DataStoreAdapter#getOperator
   * @param {string} operator The name of the operator.
   * @param {Object} [opts] Configuration options.
   * @param {Object} [opts.operators] Override the default predicate functions
   * for specified operators.
   * @return {*} The predicate function for the specified operator.
   */
  getOperator : function getOperator(operator, opts) {
    opts || (opts = {});
    opts.operators || (opts.operators = {});
    var ownOps = this.operators || {};
    return jsData.utils.isUndefined(opts.operators[operator]) ? ownOps[operator] || OPERATORS[operator] : opts.operators[operator];
  },

  /**
   * check if uniques are usable or not
   */
  checkIdAttribute : function(mapper, records) {
    var self   = this,
        _where = {},
        ids    = [];
    records.forEach(function(record) {
      if (ids.indexOf(record[mapper.idAttribute]) >= 0) {
        delete record[mapper.idAttribute];
      } else {
        ids.push(record[mapper.idAttribute]);
      }
    });
    _where[mapper.idAttribute] = {
      'in' : records.filter(function(record) {
        return !!record[mapper.idAttribute];
      }).map(function(record) {
        return record[mapper.idAttribute];
      })
    };
    return self.findAll(mapper, {
      where : _where
    })
    .then(function(list) {
      ids = list.map(function(item) {
        return item[mapper.idAttribute];
      });
      records.forEach(function(record) {
        if (ids.indexOf(record[mapper.idAttribute]) >= 0) {
          delete record[mapper.idAttribute];
        } else {
          ids.push(record[mapper.idAttribute]);
        }
      });
      return;
    });
  }
});

exports.OPERATORS        = OPERATORS;
exports.DataStoreAdapter = DataStoreAdapter;
exports.version          = require('./package.json')['version'];
