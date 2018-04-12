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
    co(function* () {
      var tmp_table = (yield store.findAll('table', {limit:1})).shift();
      var table     = yield store.update('table', tmp_table.id, {code : 'new_code'});
      assert.equal(table.id, tmp_table.id);
      assert.equal(table.code, 'new_code');
      assert.notEqual(table.code, localdb.table[0].code);
      var check = yield store.find('table', tmp_table.id);
      assert.equal(check.id, tmp_table.id);
      assert.equal(check.code, 'new_code');
      assert.notEqual(check.code, localdb.table[0].code);
      done();
    });
  }));

  suite.addTest(new Test('updateMany', function (done) {
    done();
  }));


  suite.addTest(new Test('updateAll', function (done) {

    // Loop through all chairs we need to store
    var queue = Promise.resolve();

    // while (localdb.chair.length) {
    //   queue = queue.then((function (chair) {
    //     return co(function* () {
    //
    //       // Fetch the table this chair belongs to
    //       var tables = yield store.findAll('table', {
    //         where : {'code' : {'===' : chair.table_id}},
    //         limit : 1
    //       });
    //
    //       // Assign the table's ID to the chair
    //       var table      = tables.shift();
    //       chair.table_id = table.id;
    //
    //       // Store the chair & fetch the result of it
    //       var result = JSON.parse(JSON.stringify(yield store.create('chair', chair)));
    //
    //       // Test if the outcome is correct
    //       delete result.id;
    //       delete chair.id;
    //       assert.equal(JSON.stringify(result), JSON.stringify(chair));
    //     });
    //   }).bind(null, localdb.chair.shift()));
    // }

    // Finish up our tests
    queue.then(done);
  }));

  mocha.run();
});