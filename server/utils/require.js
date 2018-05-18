exports.response = function (content = {}, errors = [], code = 200) {
  return {
    content,
    errors,
    code
  }
}
