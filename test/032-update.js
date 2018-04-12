var path   = require('path'),
    assert = require('assert'),
    fs     = require('fs-extra'),
    url    = require('url');

process.env.DEBUG = '1';
var helpers       = require('trackthis-helpers');

// Defining globals
global.approot = path.dirname(__dirname);
global.co      = require('co');
global.Promise = require('bluebird');

var DatastoreAdapter = require('../'),
    DS               = require('js-data').DataStore,
    Mocha            = global.Mocha || require('mocha'),
    Test             = Mocha.Test,
    Suite            = Mocha.Suite,
    mocha            = global.mocha || new Mocha(),
    suite            = Suite.create(mocha.suite, 'Updating entities');

suite.timeout(10000);

// Generate the file list
co(function* () {

  var apiEndPoint = url.parse(process.env.DATASTORE_EMULATOR_HOST || 'http://localhost:8081');

  var opts = require('./resources/opts');

  // Initialize store
  var store = new DS();
  store.registerAdapter('gdatastore', new DatastoreAdapter(opts), {
    'default' : true
  });

  // Load all schemas
  var schemas = require('./resources/schemas')(store),
      localdb = JSON.parse(JSON.stringify(require('./resources/database')));
  Object.keys(schemas).forEach(function (kind) {
    store.defineMapper(kind, schemas[kind]);
  });

  suite.addTest(new Test('update', function (done) {
    new Promise(function (resolve) {
      resolve(
        co(function* () {
          var tmp_table = (yield store.findAll('table', {limit : 1})).shift();
          var table     = yield store.update('table', tmp_table.id, {code : 'new_code'});
          assert.equal(table.id, tmp_table.id);
          assert.equal(table.code, 'new_code');
          assert.notEqual(table.code, localdb.table[0].code);
          var check = yield store.find('table', tmp_table.id);
          assert.equal(check.id, tmp_table.id);
          assert.equal(check.code, 'new_code');
          assert.notEqual(check.code, localdb.table[0].code);
          done();
        })
      );
    }).catch(done);
  }));

  suite.addTest(new Test('updateMany', function (done) {
    new Promise(function (resolve) {
      resolve(
        co(function* () {
          var tables = yield store.findAll('table', {
            where : {
              'max_chairs' : {'>' : 4}
            }
          });

          tables.forEach(function (table) {
            table.max_chairs = 1;
          });
          var tables_updated = yield store.updateMany('table', tables, {});
          var check          = yield store.findAll('table', {
            where : {
              'max_chairs' : {'==' : 1}
            }
          });
          assert.equal(check.length, localdb.table.filter(function (table) {
            return (table.max_chairs > 4) || (table.max_chairs === 1);
          }).length);

          done();
        }));
    }).catch(done);
  }));


  suite.addTest(new Test('updateAll', function (done) {
    new Promise(function (resolve) {
      resolve(
        co(function* () {
          var guests = yield store.updateAll('guest', {age : 20}, {
            where : {
              'age' : {'>=' : 30, '<=' : 35}
            }
          });
          assert.equal(guests.length, localdb.guest.filter(function (guest) {
            return guest.age >= 30 && guest.age <= 35;
          }).length);
          guests.forEach(function (guest) {
            assert.equal(guest.age, 20);
          });
          done();
        })
      );
    }).catch(done);
  }));

  mocha.run();
});
