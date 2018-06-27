import math from 'mathjs'
/**
 *
 * @param {Number} num
 * @param {String} type
 * @param {Number} size
 */
const formatCurrency = function (num, size = 2) {
  if (num === null) return 'N/A'
  num = num || 0
  if (typeof num === 'string') {
    num = parseFloat(num)
  }
  return num.toFixed(size).toString().replace(/(\d)(?=(\d{3})+?\.)/g, '$1,')
}

const floatFixed = function (value, size = null) {
  let result = parseFloat(math.format(value, { precision: 14 }))
  if (size > 0) {
    result = math.round(result, size)
  }
  return result
}

export {
  floatFixed,
  formatCurrency
}
