var path   = require('path'),
    assert = require('assert'),
    fs     = require('fs-extra');

process.env.DEBUG = '1';
var helpers = require('trackthis-helpers');

// Defining globals
global.approot = path.dirname(__dirname);
global.co      = require('co');
global.Promise = require('bluebird');

// Other libraries
var JSHINT = require('jshint').JSHINT,
    files  = [];

var Mocha = global.Mocha || require('mocha');
var Test  = Mocha.Test;
var Suite = Mocha.Suite;
var mocha = global.mocha || new Mocha();
var suite = Suite.create(mocha.suite,'Linting all javascript files');

suite.timeout(10000);

// Generate the file list
co(function* () {

  suite.addTest(new Test('TestName', function(done) {
    co(function*() {
      //
      // // Load the file's contents
      // var contents;
      // try {
      //   contents = (yield fs.readFile(filename)).toString();
      // } catch(e) {
      //   return done(new Error(e));
      // }
      //
      // // Basic contents validation
      // try {
      //   assert.equal(typeof contents,'string');
      //   assert.equal(contents.length>0,true);
      // } catch(e) {
      //   return done(e);
      // }
      //
      // // Start linting
      // JSHINT(contents, { esversion : 6, noyield : true, loopfunc : true });
      // var hintData;
      //
      // // Fetch the lint result
      // try {
      //   hintData = JSHINT.data();
      // } catch(e) {
      //   return done(new Error(e));
      // }
      //
      // // Return errors if needed
      // if(hintData.errors) {
      //   var err = hintData.errors.shift();
      //   return done(new Error(`(${err.code}) ${err.scope}:${err.line}:${err.character} ${err.reason}`));
      // }

      // Success!
      done();
    });
  }));

  mocha.run();
});


// // Defining vars
//
// var path             = require('path'),
//     co               = require('co'),
//     jsdata           = require('js-data'),
//     Container        = jsdata.Container,
//     Schema           = jsdata.Schema,
//     DatastoreAdapter = require(path.join('..', 'index.js')),
//     assert           = require('assert'),
//     db               = require(path.join(__dirname, 'resources', 'database.js')),
//     schemas          = require(path.join(__dirname, 'resources', 'schemas.js')),
//     config           = {
//       internalName    : 'DataStoreAdapter',
//       name            : 'datastore',
//       options         : {
//         config : {
//           projectId   : 'trackthis-179709',
//           namespace   : 'test',
//           // keyFilename : 'client-secret.json',
//           apiEndpoint : 'http://localhost:8081',
//           port        : 8081
//         }
//       },
//       registerOptions : {
//         'default' : true
//       }
//     };

// //needed to use store inside custom functions (get, load) inside 'log' schema
// global.store = {};
//
// require('co-mocha');
//
// var _find = function (need, array, compare) {
//   return JSON.parse(JSON.stringify(array)).find(function (item) {
//     if ( Array.isArray(item[compare]) ) {
//       return item[compare].indexOf(need) >= 0;
//     } else {
//       return need == item[compare];
//     }
//   });
// };
//
// var _filter = function (need, array, compare) {
//   return JSON.parse(JSON.stringify(array)).filter(function (item) {
//     if ( Array.isArray(need) ) {
//       return need.indexOf(item[compare]) >= 0;
//     } else if ( Array.isArray(item[compare]) ) {
//       return item[compare].indexOf(need) >= 0;
//     } else {
//       return need == item[compare];
//     }
//   });
// };
//
// var _clearDB = function* () {
//   yield store.destroyAll('table');
//   yield store.destroyAll('chair');
//   yield store.destroyAll('guest');
//   yield store.destroyAll('log');
// };
//
// var _createDB = function* (check) {
//
//   yield _clearDB();
//
//   var localdb = JSON.parse(JSON.stringify(db));
//
//   if ( check ) {
//     //create tables
//     var createMany = yield store.createMany('table', localdb.table);
//
//     // create chairs
//     localdb.chair.forEach(function (chair) {
//       chair.table_id = _find(chair.table_id, localdb.table, 'code').id;
//     });
//     yield store.createMany('chair', localdb.chair);
//
//     // create guests
//     localdb.guest.forEach(function (guest) {
//       guest.table_ids = _filter(guest.table_ids, localdb.table, 'code').map(function (table) {
//         return table.id;
//       });
//       guest.chair_id  = _find(guest.chair_id, localdb.chair, 'code').id;
//     });
//     yield store.createMany('guest', localdb.guest);
//
//     // create logs
//     localdb.log.forEach(function (log) {
//       var related  = localdb[log.owner_type].find(function (item) {
//         return ( log.owner_id === item.code ) || ( log.owner_id === item.name );
//       });
//       log.owner_id = related.id || related.unique;
//     });
//     yield store.createMany('log', localdb.log);
//   }
//   return localdb;
// };
//
// describe('\n\n ####### store configuration #######', function () {
//
//   it('initialize store', function* () {
//
//     var Adapter = DatastoreAdapter ;//[config.internalName];
//     process.stdout.write(JSON.stringify(Adapter,null,2));
//     store       = new Container();
//     store.registerAdapter(config.name, new Adapter(config.options), config.registerOptions);
//
//     // Register all schemas
//     Object.keys(schemas).forEach(function (schemaName) {
//       var configuration = {
//         schema    : new Schema(schemas[schemaName].schema),
//         relations : schemas[schemaName].relations
//       };
//       if ( schemas[schemaName].idAttribute ) configuration.idAttribute = schemas[schemaName].idAttribute;
//       store.defineMapper(schemaName, configuration);
//     });
//     assert.notEqual(store, false);
//     global.store = store;
//   });
//
// });
//
// describe('\n\n ####### Mapper Functions #######', function () {
//
//   this.timeout(5000);
//
//   // create
//   describe('create', function () {
//
//     var localdb;
//
//     before('clear db', function* () {
//       localdb = yield _createDB(false);
//     });
//
//     it('create 1 table', function* () {
//       var tmp_table = JSON.parse(JSON.stringify(localdb.table[0]));
//       var table     = yield store.create('table', tmp_table);
//       assert.notEqual(table.id, undefined);
//     });
//
//     it('create 1 table with hasMany[chair][foreignKey]', function* () {
//       var tmp_table    = JSON.parse(JSON.stringify(localdb.table[0]));
//       tmp_table.chairs = _filter(tmp_table.code, localdb.chair, 'table_id');
//       var table        = yield store.create('table', tmp_table, {with : ['chairs']});
//       assert.notEqual(table.id, undefined);
//       assert.notEqual(table.chairs, undefined);
//       assert.equal(table.chairs.length, _filter(db.table[0].code, db.chair, 'table_id').length);
//       table.chairs.forEach(function (chair) {
//         assert.notEqual(chair.id, undefined);
//         assert.equal(chair.table_id, table.id);
//       });
//     });
//
//     it('create 1 chair with belongsTo[table] relation', function* () {
//       var tmp_chair   = JSON.parse(JSON.stringify(localdb.chair[4]));
//       tmp_chair.table = _find(tmp_chair.table_id, localdb.table, 'code');
//       var chair       = yield store.create('chair', tmp_chair, {with : ['table']});
//       assert.notEqual(chair.id, undefined);
//       assert.notEqual(chair.table.id, undefined);
//       assert.equal(chair.table.id, chair.table_id);
//     });
//
//     it('create 1 chair with hasOne[guest] relation', function* () {
//       var tmp_chair   = JSON.parse(JSON.stringify(localdb.chair[0]));
//       tmp_chair.guest = _find(tmp_chair.code, localdb.guest, 'chair_id');
//       var chair       = yield store.create('chair', tmp_chair, {with : ['guest']});
//       assert.notEqual(chair.id, undefined);
//       assert.notEqual(chair.guest.unique, undefined);
//       assert.equal(chair.guest.chair_id, chair.id);
//     });
//
//     it('create 1 guest with belongsTo[chair] relation', function* () {
//       var tmp_guest   = JSON.parse(JSON.stringify(localdb.guest[3]));
//       tmp_guest.chair = _find(tmp_guest.chair_id, localdb.chair, 'code');
//       var guest       = yield store.create('guest', tmp_guest, {with : ['chair']});
//       assert.notEqual(guest.unique, undefined);
//       assert.notEqual(guest.chair.id, undefined);
//       assert.equal(guest.chair.id, guest.chair_id);
//     });
//
//     it('create 1 guest with hasMany[table][localKeys] relation', function* () {
//       var tmp_guest    = JSON.parse(JSON.stringify(localdb.guest[2]));
//       tmp_guest.tables = _filter(tmp_guest.table_ids, localdb.table, 'code');
//       var guest        = yield store.create('guest', tmp_guest, {with : ['tables']});
//       assert.notEqual(guest.unique, undefined);
//       assert.notEqual(guest.tables, undefined);
//       assert.equal(guest.tables.length, _filter(db.guest[2].table_ids, db.table, 'code').length);
//     });
//
//   });
//
//   // createMany
//   describe('createMany', function () {
//
//     var localdb;
//
//     // before('create all entities', function* () {
//     //   localdb = yield _createDB(false);
//     // });
//
//     it('createMany table', function* () {
//       var tmp_tables = JSON.parse(JSON.stringify(localdb.table));
//       var tables     = yield store.createMany('table', tmp_tables);
//       assert.equal(tables.length, db.table.length);
//       tables.forEach(function (table) {
//         assert.notEqual(table.id, undefined);
//       });
//     });
//
//     it('createMany table with hasMany[chair][foreignKey]', function* () {
//       var tmp_tables = JSON.parse(JSON.stringify(localdb.table));
//       tmp_tables.forEach(function (tmp_table) {
//         tmp_table.chairs = _filter(tmp_table.code, localdb.chair, 'table_id');
//       });
//       var tables = yield store.createMany('table', tmp_tables, {with : ['chairs']});
//       tables.forEach(function (table) {
//         assert.notEqual(table.id, undefined);
//         assert.notEqual(table.chairs, undefined);
//         assert.equal(table.chairs.length, _filter(table.code, db.chair, 'table_id').length);
//       });
//     });
//
//     it('createMany table with hasMany[guest][foreignKeyss]', function* () {
//       var tmp_tables = JSON.parse(JSON.stringify(localdb.table));
//       tmp_tables.forEach(function (tmp_table) {
//         tmp_table.guests = _filter(tmp_table.code, localdb.guest, 'table_ids');
//       });
//       var tables = yield store.createMany('table', tmp_tables, {with : ['guests']});
//       tables.forEach(function (table) {
//         assert.notEqual(table.id, undefined);
//         assert.notEqual(table.guests, undefined);
//         assert.equal(table.guests.length, _filter(table.code, db.guest, 'table_ids').length);
//       });
//     });
//
//     it('createMany chair with belongsTo[table] relation', function* () {
//       var tmp_chairs = JSON.parse(JSON.stringify(localdb.chair));
//       tmp_chairs.forEach(function (tmp_chair) {
//         tmp_chair.table = _find(tmp_chair.table_id, localdb.table, 'code');
//       });
//       var chairs = yield store.createMany('chair', tmp_chairs, {with : ['table']});
//       chairs.forEach(function (chair) {
//         assert.notEqual(chair.id, undefined);
//         assert.notEqual(chair.table, undefined);
//         assert.equal(chair.table.id, chair.table_id);
//       });
//     });
//
//     it('createMany chair with hasOne[guest] relation', function* () {
//       var tmp_chairs = JSON.parse(JSON.stringify(localdb.chair));
//       tmp_chairs.forEach(function (tmp_chair) {
//         tmp_chair.guest = _find(tmp_chair.code, localdb.guest, 'chair_id');
//       });
//       var chairs = yield store.createMany('chair', tmp_chairs, {with : ['guest']});
//       chairs.forEach(function (chair) {
//         assert.notEqual(chair.id, undefined);
//         assert.equal(!!chair.guest, !!_find(chair.code, localdb.guest, 'chair_id'));
//       });
//     });
//
//     it('createMany guest with belongsTo[chair] relation', function* () {
//       var tmp_guests = JSON.parse(JSON.stringify(localdb.guest));
//       tmp_guests.forEach(function (tmp_guest) {
//         tmp_guest.chair = _find(tmp_guest.chair_id, localdb.chair, 'code');
//       });
//       var guests = yield store.createMany('guest', tmp_guests, {with : ['chair']});
//       guests.forEach(function (guest) {
//         assert.notEqual(guest.unique, undefined);
//         assert.notEqual(guest.chair.id, undefined);
//         assert.equal(guest.chair.id, guest.chair_id);
//       });
//     });
//
//     it('createMany guest with hasMany[table][localKeys] relation', function* () {
//       var tmp_guests = JSON.parse(JSON.stringify(localdb.guest));
//       tmp_guests.forEach(function (tmp_guest) {
//         tmp_guest.tables = _filter(tmp_guest.table_ids, localdb.table, 'code');
//       });
//       var guests = yield store.createMany('guest', tmp_guests, {with : ['tables']});
//       guests.forEach(function (guest) {
//         assert.notEqual(guest.unique, undefined);
//         assert.notEqual(guest.tables, undefined);
//         assert.equal(guest.tables.length, _find(guest.name, db.guest, 'name').table_ids.length);
//       });
//     });
//
//   });
//
//   // find
//   describe('find', function () {
//
//     var localdb;
//
//     before('create all entities', function* () {
//       localdb = yield _createDB(true);
//     });
//
//     it('find 1 table', function* () {
//       var table = yield store.find('table', localdb.table[0].id);
//       assert.notEqual(table.id, undefined);
//       assert.equal(table.id, localdb.table[0].id);
//     });
//
//     it('find 1 chair', function* () {
//       var chair = yield store.find('chair', localdb.chair[0].id);
//       assert.notEqual(chair.id, undefined);
//       assert.equal(chair.id, localdb.chair[0].id);
//     });
//
//     it('find 1 guest', function* () {
//       var guest = yield store.find('guest', localdb.guest[0].unique);
//       assert.notEqual(guest.unique, undefined);
//       assert.equal(guest.unique, localdb.guest[0].unique);
//     });
//
//     it('find table loading hasMany[chair][foreignKey] relation', function* () {
//       var table = yield store.find('table', localdb.table[0].id, {with : ['chairs']});
//       assert.notEqual(table.id, undefined);
//       assert.equal(table.id, localdb.table[0].id);
//       assert.notEqual(table.chairs, undefined);
//       assert.equal(table.chairs.length, _filter(table.id, localdb.chair, 'table_id').length);
//       table.chairs.forEach(function (chair) {
//         assert.notEqual(chair.id, undefined);
//         assert.equal(chair.table_id, table.id);
//       });
//     });
//
//     it('find table loading hasMany[guest][foreignKeys] and hasMany[log][polimorphic] relation', function* () {
//       var table = yield store.find('table', localdb.table[0].id, {with : ['guests', 'logs']});
//       assert.notEqual(table.id, undefined);
//       assert.equal(table.id, localdb.table[0].id);
//       assert.notEqual(table.guests, undefined);
//       assert.equal(table.guests.length, _filter(table.id, localdb.guest, 'table_ids').length);
//       table.guests.forEach(function (guest) {
//         assert.notEqual(guest.unique, undefined);
//         assert.equal(guest.table_ids.indexOf(table.id) >= 0, true);
//       });
//       assert.notEqual(table.logs, undefined);
//       assert.equal(table.logs.length, _filter('table', _filter(table.id, localdb.log, 'owner_id'), 'owner_type').length);
//       table.logs.forEach(function (log) {
//         assert.notEqual(log.id, undefined);
//         assert.equal(log.owner_id, localdb.table[0].id);
//         assert.equal(log.owner_type, 'table');
//       });
//     });
//
//     it('find chair loading hasOne[guest] and belongsTo[table] relation', function* () {
//       var chair = yield store.find('chair', localdb.chair[3].id, {with : ['guest', 'table']});
//       assert.notEqual(chair.id, undefined);
//       assert.equal(chair.id, localdb.chair[3].id);
//       assert.notEqual(chair.guest, undefined);
//       assert.notEqual(chair.table, undefined);
//       assert.equal(chair.guest.unique, _find(chair.guest.name, localdb.guest, 'name').unique);
//       assert.equal(chair.table.id, chair.table_id);
//     });
//
//     it('find guest loading belongsTo[chair] and hasMany[table][localKeys] relation', function* () {
//       var guest = yield store.find('guest', localdb.guest[0].unique, {with : ['chair', 'tables']});
//       assert.notEqual(guest.unique, undefined);
//       assert.equal(guest.chair_id, _find(localdb.guest[0].chair_id, localdb.chair, 'id').id);
//       assert.equal(guest.chair.id, guest.chair_id);
//       assert.notEqual(guest.chair, undefined);
//       assert.notEqual(guest.tables, undefined);
//       assert.equal(guest.tables.length, _filter(guest.table_ids, localdb.table, 'id').length);
//       guest.tables.forEach(function (table) {
//         assert.notEqual(table.id, undefined);
//       });
//     });
//
//     it('find log loading belongsTo[table, chair, guest][polimorphic]', function* () {
//       var log = yield store.find('log', localdb.log[0].id, {with : ['owner']});
//       assert.notEqual(log.id, undefined);
//       assert.equal(log.id, localdb.log[0].id);
//       assert.notEqual(log.owner, undefined);
//     });
//
//   });
//
//   // findAll
//   describe('findAll', function () {
//
//     var localdb;
//
//     before('create all entities', function* () {
//       localdb = yield _createDB(true);
//     });
//
//     it('findAll table with max_chairs > 4', function* () {
//       var tables = yield store.findAll('table', {
//         where : {
//           'max_chairs' : {'>' : 4}
//         }
//       });
//       assert.equal(tables.length, localdb.table.filter(function (table) {
//         return table.max_chairs > 4;
//       }).length);
//     });
//
//     it('findAll chair ', function* () {
//       var chairs = yield store.findAll('chair');
//       assert.equal(chairs.length, localdb.chair.length);
//     });
//
//     it('findAll guest with age between 30 and 35 loading hasMany[table][LocalKeys]', function* () {
//       var guests = yield store.findAll('guest', {
//         where : {
//           'age' : {'>=' : 30, '<=' : 35}
//         }
//       }, {with : ['tables']});
//       assert.equal(guests.length, localdb.guest.filter(function (guest) {
//         return guest.age >= 30 && guest.age <= 35;
//       }).length);
//       guests.forEach(function (guest) {
//         assert.equal(guest.tables.length, _filter(guest.table_ids, localdb.table, 'id').length);
//       });
//     });
//
//     it('findAll table where max_chairs = 3 loading hasMany[chair][foreignKey], hasMany[log][foreignKey][custom_get] relation', function* () {
//       var tables = yield store.findAll('table', {
//         where : {
//           'max_chairs' : {'==' : 3}
//         }
//       }, {with : ['chairs', 'logs']});
//       assert.equal(tables.length, _filter(3, localdb.table, 'max_chairs').length);
//       tables.forEach(function (table) {
//         assert.equal(table.chairs.length, _filter(table.id, localdb.chair, 'table_id').length);
//         assert.equal(table.log.length, _filter('table', _filter(table.id, localdb.log, 'owner_id'), 'owner_type').length);
//       });
//     });
//
//     it('findAll table where max_chairs > 1 loading hasMany[guest][foreignKeys] and hasMany[log][foreignKey][custom_get] relation', function* () {
//       var tables = yield store.findAll('table', {
//         where : {
//           'max_chairs' : {'>' : 1}
//         }
//       }, {with : ['guests', 'logs']});
//       assert.equal(tables.length, localdb.table.length);
//       tables.forEach(function (table) {
//         assert.equal(table.guests.length, _filter(table.id, localdb.guest, 'table_ids').length);
//         assert.equal(table.logs.length, _filter('table', _filter(table.id, localdb.log, 'owner_id'), 'owner_type').length);
//       });
//     });
//
//     it('findAll guest where age in [29,30,31] loading belongsTo[chair] and hasMany[table][localKeys] relation', function* () {
//       var guests = yield store.findAll('guest', {
//         where : {
//           'age' : {'in' : [29, 30, 31]}
//         }
//       }, {with : ['chair', 'tables']});
//       assert.equal(guests.length, _filter([29, 30, 31], localdb.guest, 'age').length);
//       guests.forEach(function (guest) {
//         assert.notEqual(guest.chair, undefined);
//         assert.notEqual(guest.tables, undefined);
//       });
//     });
//
//     it('findAll log where owner_type = chair loading belongsTo[table, chair, guest][polimorphic]', function* () {
//       var logs = yield store.findAll('log', {
//         where : {
//           'owner_type' : {'==' : 'chair'}
//         }
//       }, {with : ['owner']});
//       assert.equal(logs.length, _filter('chair', localdb.log, 'owner_type').length);
//       logs.forEach(function (log) {
//         assert.equal(log.owner_type, 'chair');
//       });
//     });
//
//   });
//
//   // destroy
//   describe('destroy', function () {
//
//     var localdb;
//
//     before('create all entities', function* () {
//       localdb = yield _createDB(true);
//     });
//
//     it('destroy table', function* () {
//       yield store.destroy('table', localdb.table[2].id);
//       var check      = yield store.findAll('table', {
//         where : {
//           'id' : {'==' : localdb.table[2].id}
//         }
//       });
//       assert.equal(check.length, 0);
//     });
//
//     it('destroy guest', function* () {
//       yield store.destroy('guest', localdb.guest[3].unique);
//       var check      = yield store.findAll('guest', {
//         where : {
//           'unique' : {'==' : localdb.guest[3].unique}
//         }
//       });
//       assert.equal(check.length, 0);
//     });
//
//   });
//
//   // destroyAll
//   describe('destroyAll', function () {
//     var localdb;
//
//     before('create all entities', function* () {
//       localdb = yield _createDB(true);
//     });
//
//     it('destroyAll chair', function* () {
//       yield store.destroyAll('chair');
//       var check = yield store.findAll('chair');
//       assert.equal(check.length, 0);
//     });
//
//     it('destroyAll table where max_chairs <= 5', function* () {
//       var where = {
//         where : {
//           'max_chairs' : {'<=' : 5}
//         }
//       };
//       yield store.destroyAll('table', where);
//       var check  = yield store.findAll('table', where);
//       var check2 = yield store.findAll('table');
//       assert.equal(check.length, 0);
//       assert.equal(check2.length, localdb.table.filter(function (table) {
//         return table.max_chairs > 5;
//       }).length);
//     });
//
//     it('destroyAll guest related to table', function* () {
//       var where = {
//         where : {
//           "table_ids" : {
//             "contains" : localdb.table[0].id
//           }
//         }
//       };
//       yield store.destroyAll('guest', JSON.parse(JSON.stringify(where)));
//       var check  = yield store.findAll('guest', where);
//       var check2 = yield store.findAll('guest');
//       assert.equal(check.length, 0);
//       assert.equal(check2.length, (localdb.guest.length - _filter(localdb.table[0].id, localdb.guest, 'table_ids').length));
//     });
//
//     it('destroyAll log where owner_type in [chair, guest]', function* () {
//       var where = {
//         where : {
//           'owner_type' : {'in' : ['chair', 'guest']}
//         }
//       };
//       yield store.destroyAll('log', JSON.parse(JSON.stringify(where)));
//       var check  = yield store.findAll('log', where);
//       var check2 = yield store.findAll('log');
//       assert.equal(check.length, 0);
//       assert.equal(check2.length, (localdb.log.length - _filter(['chair', 'guest'], localdb.log, 'owner_type').length));
//     });
//
//   });
//
//   // update
//   describe('update', function () {
//
//     var localdb;
//
//     before('create all entities', function* () {
//       localdb = yield _createDB(true);
//     });
//
//     it('update 1 chair', function* () {
//       var tmp_chair = JSON.parse(JSON.stringify(localdb.chair[0]));
//       var chair     = yield store.update('chair', tmp_chair.id, {table_id : ''});
//       assert.equal(chair.id, tmp_chair.id);
//       assert.equal(chair.table_id, '');
//       assert.notEqual(chair.table_id, localdb.chair[0].table_id);
//       var check = yield store.find('chair', tmp_chair.id);
//       assert.equal(check.id, tmp_chair.id);
//       assert.equal(check.table_id, '');
//       assert.notEqual(check.table_id, localdb.chair[0].table_id);
//     });
//
//     it('update 1 guest', function* () {
//       var tmp_guest  = JSON.parse(JSON.stringify(localdb.guest[1]));
//       var new_tables = localdb.table.map(function (item) {
//         return item.id;
//       });
//       var guest      = yield store.update('guest', tmp_guest.unique, {table_ids : new_tables});
//       assert.equal(guest.unique, tmp_guest.unique);
//       assert.equal(guest.table_ids.length, new_tables.length);
//       assert.notEqual(guest.table_ids.length, localdb.guest[1].table_ids.length);
//       var check = yield store.find('guest', tmp_guest.unique, {with : ['tables']});
//       assert.equal(check.unique, tmp_guest.unique);
//       assert.equal(check.tables.length, localdb.table.length);
//       assert.notEqual(check.table_ids, localdb.guest[1].table_ids);
//     });
//   });
//
//   // updateAll
//   describe('updateAll', function () {
//
//     var localdb;
//
//     before('create all entities', function* () {
//       localdb = yield _createDB(true);
//     });
//
//     it('updateAll guest with age between 30 and 35', function* () {
//       var guests = yield store.updateAll('guest', {age : 20}, {
//         where : {
//           'age' : {'>=' : 30, '<=' : 35}
//         }
//       });
//       assert.equal(guests.length, localdb.guest.filter(function (guest) {
//         return guest.age >= 30 && guest.age <= 35;
//       }).length);
//       guests.forEach(function (guest) {
//         assert.equal(guest.age, 20);
//       });
//     });
//
//     it('updateAll table where max_chairs in [3, 4, 5]', function* () {
//       var tables = yield store.updateAll('table', {max_chairs : 4}, {
//         where : {
//           'max_chairs' : {'in' : [3, 4, 5]}
//         }
//       });
//       assert.equal(tables.length, _filter([3, 4, 5], localdb.table, 'max_chairs').length);
//       tables.forEach(function (table) {
//         assert.equal(table.max_chairs, 4);
//       });
//     });
//
//   });
//
//   // updateMany
//   describe('updateMany', function () {
//
//     var localdb;
//
//     before('create all entities', function* () {
//       localdb = yield _createDB(true);
//     });
//
//     it('updateMany table with max_chairs > 4', function* () {
//       var tables = yield store.findAll('table', {
//         where : {
//           'max_chairs' : {'>' : 4}
//         }
//       });
//       tables.forEach(function (table) {
//         table.max_chairs = 1;
//       });
//       var tables_updated = yield store.updateMany('table', tables, {});
//       var check          = yield store.findAll('table', {
//         where : {
//           'max_chairs' : {'==' : 1}
//         }
//       });
//       assert.equal(check.length, localdb.table.filter(function (table) {
//         return table.max_chairs > 4 || table.max_chairs == 1;
//       }).length);
//     });
//
//     it('updateMany guest where age in [29,30,31]', function* () {
//       var guests = yield store.findAll('guest', {
//         where : {
//           'age' : {'in' : [29, 30, 31]}
//         }
//       });
//       guests.forEach(function (guest) {
//         guest.age = 15;
//       });
//       var guests_updated = yield store.updateMany('guest', guests, {});
//       var check          = yield store.findAll('guest', {
//         where : {
//           'age' : {'in' : [29, 30, 31]}
//         }
//       });
//       assert.equal(check.length, 0);
//     });
//
//   });
//
// });
//
// describe('\n\n ####### Record functions #######', function () {
//
//   // loadRelations
//   describe('loadRelations', function () {
//
//     var localdb;
//
//     before('create all entities', function* () {
//       localdb = yield _createDB(true);
//     });
//
//     it('load table hasMany[chair][foreign_key], hasMany[guest][foreign_keys], hasMany[log][custom_get] relations', function* () {
//       var table = yield store.find('table', localdb.table[0].id);
//       assert.notEqual(table.id, undefined);
//       assert.equal(table.id, localdb.table[0].id);
//       yield table.loadRelations(['chairs', 'guests', 'logs']);
//       assert.notEqual(table.chairs, undefined);
//       assert.equal(table.chairs.length, _filter(table.id, localdb.chair, 'table_id').length);
//       assert.notEqual(table.guests, undefined);
//       assert.equal(table.guests.length, _filter(table.id, localdb.guest, 'table_ids').length);
//       assert.notEqual(table.logs, undefined);
//       assert.equal(table.logs.length, _filter('table', _filter(table.id, localdb.log, 'owner_id'), 'owner_type').length);
//     });
//
//     it('load chair belongsTo[table], hasOne[guest], hasMany[log][custom_get] relations', function* () {
//       var chair = yield store.find('chair', localdb.chair[0].id);
//       assert.notEqual(chair.id, undefined);
//       assert.equal(chair.id, localdb.chair[0].id);
//       yield chair.loadRelations(['table', 'guest', 'logs']);
//       assert.notEqual(chair.table, undefined);
//       assert.equal(chair.table.id, chair.table_id);
//       assert.notEqual(chair.guest, undefined);
//       assert.equal(chair.guest.chair_id, chair.id);
//       assert.notEqual(chair.logs, undefined);
//       assert.equal(chair.logs.length, _filter('chair', _filter(chair.id, localdb.log, 'owner_id'), 'owner_type').length);
//     });
//
//     it('load guest belongsTo[chair], hasMany[table][localKeys], hasMany[log][custom_get] relations', function* () {
//       var guest = yield store.find('guest', localdb.guest[3].unique);
//       assert.notEqual(guest.unique, undefined);
//       assert.equal(guest.unique, localdb.guest[3].unique);
//       yield guest.loadRelations(['tables', 'chair', 'logs']);
//       assert.notEqual(guest.tables, undefined);
//       assert.equal(guest.table_ids.length, guest.tables.length);
//       assert.notEqual(guest.chair, undefined);
//       assert.equal(guest.chair_id, guest.chair.id);
//       assert.notEqual(guest.logs, undefined);
//       assert.equal(guest.logs.length, _filter('guest', _filter(guest.unique, localdb.log, 'owner_id'), 'owner_type').length);
//     });
//
//     it('load log belongsTo[guest][custom_load] relations', function* () {
//       var log = yield store.find('log', localdb.log[7].id);
//       assert.notEqual(log.id, undefined);
//       assert.equal(log.id, localdb.log[7].id);
//       yield log.loadRelations(['owner']);
//       assert.notEqual(log.owner, undefined);
//       assert.equal(log.owner_id, localdb.log[7].owner_id);
//       assert.equal(log.owner_type, localdb.log[7].owner_type);
//     });
//
//     it('load log belongsTo[chair][custom_load] relations', function* () {
//       var log = yield store.find('log', localdb.log[3].id);
//       assert.notEqual(log.id, undefined);
//       assert.equal(log.id, localdb.log[3].id);
//       yield log.loadRelations(['owner']);
//       assert.notEqual(log.owner, undefined);
//       assert.equal(log.owner_id, localdb.log[3].owner_id);
//       assert.equal(log.owner_type, localdb.log[3].owner_type);
//     });
//
//     it('load log belongsTo[table][custom_load] relations', function* () {
//       var log = yield store.find('log', localdb.log[1].id);
//       assert.notEqual(log.id, undefined);
//       assert.equal(log.id, localdb.log[1].id);
//       yield log.loadRelations(['owner']);
//       assert.notEqual(log.owner, undefined);
//       assert.equal(log.owner_id, localdb.log[1].owner_id);
//       assert.equal(log.owner_type, localdb.log[1].owner_type);
//     });
//
//   });
//
//   //destroy
//
//   describe('destroy', function () {
//     var localdb;
//
//     before('create all entities', function* () {
//       localdb = yield _createDB(true);
//     });
//
//     it('destroy 1 table', function* () {
//       var table = yield store.find('table', localdb.table[0].id);
//       assert.notEqual(table.id, undefined);
//       assert.equal(table.id, localdb.table[0].id);
//       table.destroy();
//       var check = yield store.findAll('table', {id : {'==' : localdb.table[0].id}});
//       assert.equal(check.length, 0);
//     });
//
//     it('destroy 1 chair', function* () {
//       var chair = yield store.find('chair', localdb.chair[0].id);
//       assert.notEqual(chair.id, undefined);
//       assert.equal(chair.id, localdb.chair[0].id);
//       chair.destroy();
//       var check = yield store.findAll('chair', {id : {'==' : localdb.chair[0].id}});
//       assert.equal(check.length, 0);
//     });
//
//     it('destroy 1 guest', function* () {
//       var guest = yield store.find('guest', localdb.guest[0].unique);
//       assert.notEqual(guest.unique, undefined);
//       assert.equal(guest.unique, localdb.guest[0].unique);
//       guest.destroy();
//       var check = yield store.findAll('guest', {unique : {'==' : localdb.guest[0].unique}});
//       assert.equal(check.length, 0);
//     });
//
//     it('destroy 1 log', function* () {
//       var log = yield store.find('log', localdb.log[0].id);
//       assert.notEqual(log.id, undefined);
//       assert.equal(log.id, localdb.log[0].id);
//       log.destroy();
//       var check = yield store.findAll('log', {id : {'==' : localdb.log[0].id}});
//       assert.equal(check.length, 0);
//     });
//
//   });
//
// });
