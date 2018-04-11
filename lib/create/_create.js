var JSData = require('js-data');

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
  return Promise.reject("_create not implemented");
};



//   /**
//    * Internal method used by Adapter#create
//    *
//    * @method DataStoreAdapter#_create
//    * @private
//    * @param {Object} mapper The mapper.
//    * @param {(Object|Object[])} records The record or records to be created.
//    * @return {Promise}
//    */
//   _create : function _createHelper(mapper, records) {
//
//     var _this3 = this;
//
//     return new jsData.utils.Promise(
//       function (resolve, reject) {
//         try {
//           var apiResponse   = void 0;
//           var idAttribute   = mapper.idAttribute;
//           var incompleteKey = _this3.datastore.key(_this3.getKind(mapper));
//
//           _this3.checkIdAttribute(mapper, records)
//           .then(function() {
//             // Allocate ids
//             _this3.datastore.allocateIds(incompleteKey, records.length, function (err, keys) {
//               if ( err ) {
//                 return reject(err);
//               }
//               var entities = records.map(function (_record, i) {
//                 if (_record[idAttribute]) {
//                   keys[i] = _this3.datastore.key([_this3.getKind(mapper), _record[idAttribute]]);
//                 }
//                 jsData.utils.set(_record, idAttribute, keys[i].path[1]);
//                 return {
//                   key  : keys[i],
//                   data : _record
//                 };
//               });
//               // Save records
//               _this3.datastore.save(entities, function (err, _apiResponse) {
//                 if ( err ) {
//                   return reject(err);
//                 }
//                 return resolve([singular ? records[0] : records, _apiResponse]);
//               });
//             });
//           });
//
//         } catch ( e ) {
//           return reject(e);
//         }
//       });
//   },
