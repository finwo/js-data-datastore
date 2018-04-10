module.exports = function (resource, props) {
  var tasks = [],
      self  = this;
  Object.keys(props).forEach(function (key) {
    tasks.push(self.create(resource, props[key]));
  });
  return Promise
    .all(tasks)
    .then(function (results) {
      return [results, {}];
    });
};
