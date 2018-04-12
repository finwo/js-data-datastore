var JSData = require('js-data'),
    utils  = JSData.utils;

// TODO: make this insert multiple records at once for performance
module.exports = function (resource, props) {
  var tasks = [],
      self  = this;
  Object.keys(props).forEach(function (key) {
    tasks.push(self.create(resource, props[key]));
  });
  return utils.Promise
    .all(tasks)
    .then(function (results) {
      return [results, {}];
    });
};
