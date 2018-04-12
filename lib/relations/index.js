module.exports = function (adapter) {
  adapter.loadBelongsTo           = require('./loadBelongsTo');
  adapter.loadHasMany             = require('./loadHasMany');
  adapter.loadHasManyLocalKeys    = require('./loadHasManyLocalKeys');
  adapter.loadHasManyForeignKeys  = require('./loadHasManyForeignKeys');
  adapter.loadHasOne              = require('./loadHasOne');
  adapter.makeHasManyForeignKey   = require('./makeHasManyForeignKey');
  adapter.makeHasManyLocalKeys    = require('./makeHasManyLocalKeys');
  adapter.makeBelongsToForeignKey = require('./makeBelongsToForeignKey');
};
