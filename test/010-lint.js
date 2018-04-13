var path   = require('path'),
    assert = require('assert'),
    fs     = require('fs-extra');

process.env.DEBUG = '1';
var helpers = require('trackthis-helpers');

// Defining globals
/** global: approot */
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

suite.addTest(new Test('Verifying file list',function() {
  assert.equal(files.length>0,true);
}));

// Generate the file list
co(function* () {
  files = (yield fs.scandir(approot))
    .filter(function (filename) {
      if ( filename.substr(-3) !== '.js' ) { return false; }
      if ( filename.substr(-7) === '.min.js' ) { return false; }
      if ( filename.indexOf(path.sep + '.git' + path.sep) >= 0 ) { return false; }
      if ( filename.indexOf(path.sep + '.idea' + path.sep) >= 0 ) { return false; }
      if ( filename.indexOf(path.sep + 'coverage' + path.sep) >= 0 ) { return false; }
      if ( filename.indexOf(path.sep + 'node_modules' + path.sep) >= 0 ) { return false; }
      return true;
    });

  files.forEach(function(filename) {
    suite.addTest(new Test('Lint ' + filename.substr(approot.length), function(done) {
      co(function*() {

        // Load the file's contents
        var contents;
        try {
          contents = (yield fs.readFile(filename)).toString();
        } catch(e) {
          return done(new Error(e));
        }

        // Basic contents validation
        try {
          assert.equal(typeof contents,'string');
          assert.equal(contents.length>0,true);
        } catch(e) {
          return done(e);
        }

        // Start linting
        JSHINT(contents, { esversion : 6, noyield : true, loopfunc : true });
        var hintData;

        // Fetch the lint result
        try {
          hintData = JSHINT.data();
        } catch(e) {
          return done(new Error(e));
        }

        // Return errors if needed
        if(hintData.errors) {
          var err = hintData.errors.shift();
          return done(new Error(`(${err.code}) ${err.scope}:${err.line}:${err.character} ${err.reason}`));
        }

        // Success!
        return done();
      });
    }));
  });

  mocha.run();
});
