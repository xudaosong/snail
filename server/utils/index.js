const math = require('mathjs')

exports.floatFixed = function (value, size = null) {
  let result = parseFloat(math.format(value, { precision: 14 }))
  if (size > 0) {
    result = math.round(result, size)
  }
  return result
}
