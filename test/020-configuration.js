var path   = require('path'),
    assert = require('assert'),
    fs     = require('fs-extra');

process.env.DEBUG = '1';
var helpers       = require('trackthis-helpers');

// Defining globals
global.approot = path.dirname(__dirname);
global.co      = require('co');
global.Promise = require('bluebird');

// Other libraries
var JSHINT = require('jshint').JSHINT,
    files  = [];

var DatastoreAdapter = require('../'),
    DS               = require('js-data').DataStore,
    Mocha            = global.Mocha || require('mocha'),
    Test             = Mocha.Test,
    Suite            = Mocha.Suite,
    mocha            = global.mocha || new Mocha(),
    suite            = Suite.create(mocha.suite, 'Configuration');

suite.timeout(60000);

// Generate the file list
co(function* () {

  suite.addTest(new Test('Connect to self-defined local instance', function (done) {
    co(function* () {

      var opts = {
        config : {
          namespace   : 'test',
          keyFilename : path.join(approot, 'client-secret.json')
        }
      };

      var store = new DS();
      store.registerAdapter('gdatastore', new DatastoreAdapter(opts), {
        'default' : true
      });

      store.defineMapper('account', {
        idAttribute : 'unique'
      });

      store.findAll('account', {
             'unique' : {
               '===' : 'nonExistantUnique'
             }
           })
           .then(function (result) {
             assert.equal(JSON.stringify(result), '[]');
           });

      // Success!
      done();
    });
  }));

  mocha.run();
});
