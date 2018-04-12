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

  var opts = {
    config : {
      namespace : 'test',

      // projectId   : process.env.DATASTORE_PROJECT_ID || process.env.DATASTORE_PROJECTID || 'testing',
      // apiEndpoint : url.format(apiEndPoint),
      // port        : apiEndPoint.port

      keyFilename : path.join(approot, 'client-secret.json')
    }
  };

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
      console.log(JSON.parse(JSON.stringify(result)));
      done();
    });
  }));

  suite.addTest(new Test('create', function (done) {
    co(function* () {

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
        }).bind(null, localdb.chair.shift()));
      }

      // Finish up our tests
      queue.then(done);
    });
  }));

  mocha.run();
});
