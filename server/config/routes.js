const platform = require('../controller/platform.controller')
const loan = require('../controller/loan.controller')
const statis = require('../controller/statis.controller')
const receipt = require('../controller/receipt.controller')

module.exports = function (router) {
  router
    .get('/api/v1/platform', platform.getList)
    .post('/api/v1/platform', platform.add)
  router
    .get('/api/v1/loan', loan.getList)
    .post('/api/v1/loan', loan.add)
    .delete('/api/v1/loan', loan.delete)
    .post('/api/v1/loan/import', loan.import)
  router
    .post('/api/v1/loan/prepayment', loan.prepayment)
  router
    .get('/api/v1/loan/repayment', loan.getRepaymentList)
  router
    .get('/api/v1/receipt', receipt.getList)
    .post('/api/v1/receipt', receipt.add)
  router
    .get('/api/v1/statis/repayment', statis.getRepayment)
  router
    .get('/api/v1/statis/cashflow', statis.getCashFlow)
  router
    .get('/api/v1/statis/portfolio', statis.getPortfolio)
}
