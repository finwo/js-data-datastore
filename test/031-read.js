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
    suite            = Suite.create(mocha.suite, 'Reading entities');

suite.timeout(10000);

// Generate the file list
co(function* () {

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

  suite.addTest(new Test('findAll', function (done) {
    new Promise(function (resolve) {
      resolve(
        co(function* () {
          var tables = yield store.findAll('table', {
            where : {
              'max_chairs' : {'>' : 4}
            }
          });
          assert.equal(tables.length, localdb.table.filter(function (table) {
            return table.max_chairs > 4;
          }).length);
          done();
        })
      );
    }).catch(done);
  }));

  suite.addTest(new Test('find', function (done) {
    new Promise(function (resolve) {
      resolve(
        co(function* () {
          var tmp_table = (yield store.findAll('table', {
            limit : 1
          })).shift();
          var table     = yield store.find('table', tmp_table.id);
          assert.notEqual(table.id, undefined);
          assert.equal(table.id, tmp_table.id);
          done();
        })
      );
    }).catch(done);
  }));

  mocha.run();
});
