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
    suite            = Suite.create(mocha.suite, 'Deleting entities');

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

  suite.addTest(new Test('destroyAll', function (done) {
    co(function*() {
      var result = yield store.destroyAll('guest');
      assert.equal(JSON.stringify(result),'[]');
      done();
    });
  }));

  suite.addTest(new Test('destroy', function (done) {
    co(function*() {

      // Fetch the chairs we're deleting
      var chair, result, chairs = yield store.findAll('chair');

      // Delete them 1-by-1
      while(chairs.length) {
        chair = chairs.shift();
        result = yield store.destroy('chair', chair.id);
        assert.equal(JSON.stringify(result,null,2),JSON.stringify(chair,null,2));
      }

      // Verify that our list is empty now
      assert.equal(JSON.stringify(chairs),'[]');
      done();
    });
  }));

  suite.addTest(new Test('destroyAll (leftovers)', function (done) {
    co(function*() {
      var result = yield store.destroyAll('table');
      assert.equal(JSON.stringify(result),'[]');
      done();
    });
  }));

  mocha.run();
});
