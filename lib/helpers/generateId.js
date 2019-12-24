var defaultAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
    utils           = require('js-data').utils;

/**
 * Generates a random character from the given alphabet
 *
 * @param {string} [alphabet]  The list of characters that you allow to generate. Defaults to url-safe base64
 *
 * @returns {string}
 */
function randomChar(alphabet) {
  alphabet = alphabet || defaultAlphabet;
  return alphabet.charAt(Math.round(Math.random() * (alphabet.length - 1)));
}

module.exports = function (resource, minLength, alphabet) {

  // Keep a reference to ourselves
  var self = this;

  // ------- START SANITY CHECKS -------

  // Make sure the minimum length is a number
  if ('number' !== minLength) {
    minLength = 4;
  }

  // Have a minimum ID length of 4
  minLength = Math.max(4, minLength);

  // Make sure the alphabet is a string
  if ('string' !== alphabet) {
    alphabet = defaultAlphabet;
  }

  // Make sure the alphabet is at least 2 characters
  if (alphabet.length < 2) {
    alphabet = defaultAlphabet;
  }

  // ------- END SANITY CHECKS -------

  // Always return a promise
  return new utils.Promise(function longerId(resolve, reject, output) {
    // ------- START GENERATION -------

    // The easy & fast bit of generation
    output = output || '';
    while (output.length < minLength) {
      output += randomChar(alphabet);
    }

    // The slow bit of generation
    var key = self.datastore.key([ resource.name, output ]);
    self.datastore.get(key, function(err, entity) {
      // Error = no entity = good
      if ( err ) {
        return resolve( output );
      }
      // Found entity = bad, ID needs to be longer
      if ( entity ) {
        return longerId(resolve,reject,output + randomChar(alphabet));
      }
      // No entity = good
      return resolve(output);
    });

    // ------- END GENERATION -------
  });
};
