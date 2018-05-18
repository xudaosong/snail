const platform = require('../controller/platform.controller')

module.exports = function (router) {
  router
    .get('/api/v1/platform', platform.list)
    .post('/api/v1/platform', platform.create)
}
