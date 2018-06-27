const math = require('mathjs')
const _ = require('lodash')

const _floatFixed = function (value, size = null) {
  let result = parseFloat(math.format(value, { precision: 14 }))
  if (size > 0) {
    result = math.round(result, size)
  }
  return result
}

exports.floatFixed = function (value, keys = [], size = null) {
  if (_.isObject(value)) {
    _.each(keys, (key) => {
      value[key] = _floatFixed(value[key], size)
    })
    return value
  } else {
    if (_.isNumber(keys)) {
      size = keys
    }
    return _floatFixed(value, size)
  }
}
