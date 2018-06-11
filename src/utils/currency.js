/**
 *
 * @param {Number} num
 * @param {String} type
 * @param {Number} size
 */
const formatCurrency = function (num, size = 2) {
  if (num === null) return 'N/A'
  num = num || 0
  return num.toFixed(size).toString().replace(/(\d)(?=(\d{3})+?\.)/g, '$1,')
}
export {
  formatCurrency
}
