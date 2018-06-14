const mongoose = require('mongoose')
const { response } = require('../utils/require')
const moment = require('moment')
const { floatFixed } = require('../utils')
const Repayment = mongoose.model('Repayment')

// 在日期范围内按天统计各平台的回款信息和回款小计
// 默认日期范围为当月
exports.getRepayment = async (ctx, next) => {
  const date = new Date()
  // 设置默认为日期范围为当月
  let {
    startDate = moment().startOf('month'),
    endDate = null,
    platform = null,
    status = null
  } = ctx.request.query
  if (endDate === null) {
    endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  } else {
    endDate = moment(endDate).add(1, 'days').format('YYYY-MM-DD')
  }
  let firstMatch = {
    repaymentDate: { $gte: new Date(startDate), $lt: new Date(endDate) } // 按日期过滤数据
  }
  let secondMatch = {}
  if (status) {
    firstMatch.status = parseInt(status)
  }
  if (platform) {
    secondMatch.platform = platform
  }
  const results = await Repayment.aggregate().match(firstMatch).lookup({ // 以loanId关联Loan表的数据，并通过unwind展开Loan
    from: 'Loan',
    localField: 'loan',
    foreignField: '_id',
    as: 'loan'
  }).unwind('loan').project({ // 配置要展示的数据项，并格式化repaymentDate为YYYY-MM-DD格式，以便后续分组
    repaymentDate: { $dateToString: { format: '%Y-%m-%d', date: '$repaymentDate' } },
    platform: '$loan.platform',
    principal: 1,
    totalInterest: 1,
    totalInterestManagementFee: 1,
    totalRepayment: 1,
    amountReceivable: 1
  }).group({ // 按project返回的结果集，通过repaymentDate和platform进行分组，并按分组汇总相关数据
    _id: {
      repaymentDate: '$repaymentDate',
      platform: '$platform'
    },
    principal: { $sum: '$principal' },
    totalInterest: { $sum: '$totalInterest' },
    totalInterestManagementFee: { $sum: '$totalInterestManagementFee' },
    totalRepayment: { $sum: '$totalRepayment' },
    amountReceivable: { $sum: '$amountReceivable' }
  }).project({ // 配置要返回的数据项，展开分组产生的_id项并移除_id
    _id: 0,
    repaymentDate: '$_id.repaymentDate',
    platform: '$_id.platform',
    principal: 1,
    totalInterest: 1,
    totalInterestManagementFee: 1,
    totalRepayment: 1,
    amountReceivable: 1
  }).match(secondMatch).sort({ // 按日期排序
    'repaymentDate': 'asc'
  }).exec().then((data) => {
    let content = {
      principal: 0,
      totalInterest: 0,
      totalInterestManagementFee: 0,
      totalRepayment: 0,
      amountReceivable: 0
    }
    // 汇总还款数据
    for (let i = 0; i < data.length; i++) {
      data[i].principal = floatFixed(data[i].principal, 2)
      data[i].totalInterest = floatFixed(data[i].totalInterest, 2)
      data[i].totalInterestManagementFee = floatFixed(data[i].totalInterestManagementFee, 2)
      data[i].totalRepayment = floatFixed(data[i].totalRepayment, 2)
      data[i].amountReceivable = floatFixed(data[i].amountReceivable, 2)
      content.principal += data[i].principal
      content.totalInterest += data[i].totalInterest
      content.totalInterestManagementFee += data[i].totalInterestManagementFee
      content.totalRepayment += data[i].totalRepayment
      content.amountReceivable += data[i].amountReceivable
    }
    content.principal = floatFixed(content.principal, 2)
    content.totalInterest = floatFixed(content.totalInterest, 2)
    content.totalInterestManagementFee = floatFixed(content.totalInterestManagementFee, 2)
    content.totalRepayment = floatFixed(content.totalRepayment, 2)
    content.amountReceivable = floatFixed(content.amountReceivable, 2)
    // 按还款日期提取分组
    // content.repaymentList = _.groupBy(data, 'repaymentDate')
    content.repaymentList = data
    return content
  })
  ctx.response.body = response(results)
}
