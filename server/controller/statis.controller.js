const mongoose = require('mongoose')
const { response } = require('../utils/require')
const Repayment = mongoose.model('Repayment')

// 在日期范围内按天统计各平台的回款信息和回款小计
// 默认日期范围为当月
exports.getRepayment = async (ctx, next) => {
  const date = new Date()
  // 设置默认为日期范围为当月
  const {
    startDate = new Date(date.getFullYear(), date.getMonth(), 1),
    endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  } = ctx.request.query
  const results = await Repayment.aggregate().match({ // 按日期过滤数据
    repaymentDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }).lookup({ // 以loanId关联Loan表的数据，并通过unwind展开Loan
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
  }).sort({ // 按日期排序
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
      content.principal += data[i].principal
      content.totalInterest += data[i].totalInterest
      content.totalInterestManagementFee += data[i].totalInterestManagementFee
      content.totalRepayment += data[i].totalRepayment
      content.amountReceivable += data[i].amountReceivable
    }
    // 按还款日期提取分组
    // content.repaymentList = _.groupBy(data, 'repaymentDate')
    content.repaymentList = data
    return content
  })
  ctx.response.body = response(results)
}
