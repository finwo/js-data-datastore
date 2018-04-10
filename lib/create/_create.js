var JSData = require('js-data');

module.exports = function (resource, attrs, options) {

  // Keep a reference to ourselves
  var self = this;

  // Make sure we're always working the same way
  if ( !JSData.utils.isArray(attrs) ) {
    attrs = [attrs];
  }

  // Get a proper copy of the records
  var records = JSData.utils.plainCopy(attrs);

  // Always return a promise
  return new JSData.utils.Promise(function(resolve, reject) {
    reject("Not implemented");
  });

};
