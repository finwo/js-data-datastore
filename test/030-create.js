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
    suite            = Suite.create(mocha.suite, 'Creating entities');

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

  suite.addTest(new Test('createMany', function (done) {
    co(function* () {
      var result = yield store.createMany('table', localdb.table);
      assert.equal(result.length, 3);
      done();
    });
  }));

  suite.addTest(new Test('create', function (done) {

    // Loop through all chairs we need to store
    var queue = Promise.resolve();
    while (localdb.chair.length) {
      queue = queue.then((function (chair) {
        return co(function* () {

          // Fetch the table this chair belongs to
          var tables = yield store.findAll('table', {
            where : {'code' : {'===' : chair.table_id}},
            limit : 1
          });

          assert.equal(tables.length,1);

          // Assign the table's ID to the chair
          var table      = tables.shift();
          chair.table_id = table.id;

          // Store the chair & fetch the result of it
          var result = JSON.parse(JSON.stringify(yield store.create('chair', chair)));

          // Test if the outcome is correct
          delete result.id;
          delete chair.id;
          assert.equal(JSON.stringify(result), JSON.stringify(chair));
        });
      }).bind(null, localdb.chair.shift()), done);
    }

    // Finish up our tests
    queue.then(done);
  }));

  suite.addTest(new Test('create (guests)', function (done) {
    var queue = Promise.resolve();
    while(localdb.guest.length) {
      queue = queue.then((function(guest) {
        return co(function*() {

          // Fetch the table this guest has used
          var tables = yield store.findAll('table', {
            where: { 'code': {'in': guest.table_ids}}
          });

          // Index the tables, saves look-ups later
          var table = {};
          tables.forEach(function(t) {
            table[t.code] = t;
          });

          // Assign the guest to tables
          guest.table_ids = guest.table_ids.map(function(table_code) {
            return table[table_code].id;
          });

          // Fetch the chair the guest uses
          guest.chair_id = (yield store.findAll('chair', {
            where: { 'code': guest.chair_id }
          })).shift().id;

          // Insert the guest into our database
          var result = JSON.parse(JSON.stringify(yield store.create('guest', guest)));

          // Prepare comparison
          var actual   = {},
              expected = {};
          delete result.unique;
          delete guest.unique;

          Object.keys(result).qsort().forEach(function(key) {
            actual[key] = result[key];
          });

          Object.keys(guest).qsort().forEach(function(key) {
            expected[key] = guest[key];
          });

          // Verify the result
          assert.equal(JSON.stringify(actual),JSON.stringify(expected));
        });
      }).bind(null,localdb.guest.shift()), done);
    }
    queue.then(done);
  }));

  mocha.run();
});
