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
             console.log(result);
           });

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
