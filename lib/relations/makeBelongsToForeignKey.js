/**
 * extract key for BelongsTo relation
 *
 * @param {object} mapper
 * @param {object} def
 * @param {Record} record
 *
 * @returns {*}
 */
module.exports = function (mapper, def, record) {
  return def.getForeignKey(record);
};
