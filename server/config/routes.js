const platform = require('../controller/platform.controller')
const loan = require('../controller/Loan.controller')

module.exports = function (router) {
  router
    .get('/api/v1/platform', platform.getList)
    .post('/api/v1/platform', platform.add)

  router
    .get('/api/v1/loan', loan.getList)
    .post('/api/v1/loan', loan.add)
}
