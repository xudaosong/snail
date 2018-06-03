const platform = require('../controller/platform.controller')
const loan = require('../controller/loan.controller')
const statis = require('../controller/statis.controller')

module.exports = function (router) {
  router
    .get('/api/v1/platform', platform.getList)
    .post('/api/v1/platform', platform.add)
  router
    .get('/api/v1/loan', loan.getList)
    .post('/api/v1/loan', loan.add)
  router
    .get('/api/v1/loan/repayment', loan.getRepaymentList)
  router
    .get('/api/v1/statis/repayment', statis.getRepayment)
}
