const mongoose = require('mongoose')
const { response } = require('../utils/require')
const moment = require('moment')
const { floatFixed } = require('../utils')
const Repayment = mongoose.model('Repayment')
const Loan = mongoose.model('Loan')
const Receipt = mongoose.model('Receipt')
const _ = require('lodash')

// 在日期范围内按天统计各平台的回款信息和回款小计
// 默认日期范围为当月
exports.getRepayment = async (ctx, next) => {
  const date = new Date()
  // 设置默认为日期范围为当月
  let {
    startDate = moment().startOf('month'),
    endDate = null,
    platform = null,
    status = '0'
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

// 获取每月投资的现金流
// 默认日期为当月所有平台
exports.getCashFlow = async (ctx, next) => {
  // 设置默认为日期范围为当月
  let {
    startMonth = moment().format('YYYY-MM'),
    endMonth = moment().format('YYYY-MM'),
    platform = null
  } = ctx.request.query
  // 生成月份数组，包含当月的开始时间和结束时间
  let months = []
  while (moment(startMonth).isSameOrBefore(endMonth)) {
    startMonth = moment(startMonth)
    months.push({
      month: startMonth.format('YYYY-MM'),
      startDate: new Date(startMonth.startOf('months').format('YYYY-MM-DD HH:mm:ss')),
      endDate: new Date(startMonth.endOf('months').format('YYYY-MM-DD HH:mm:ss'))
    })
    startMonth = startMonth.add(1, 'months').format('YYYY-MM')
  }
  let cashFlow = []
  // 查询条件
  let firstMatch = {}
  // 按平台过滤数据
  if (platform !== null) {
    firstMatch.platform = platform
  }
  // TODO: 是否可以用Promise.all并发来提高效率
  for await (let month of months) {
    // 获取资金流入数据
    let inflow = await Loan.aggregate().match({
      interestDate: {
        $gte: month.startDate,
        $lte: month.endDate
      },
      ...firstMatch
    }).group({ // 按project返回的结果集，通过repaymentDate和platform进行分组，并按分组汇总相关数据
      _id: {
        platform: '$platform'
      },
      inflow: { $sum: '$principal' }
    }).project({ // 配置要返回的数据项，展开分组产生的_id项并移除_id
      _id: 0,
      platform: '$_id.platform',
      inflow: 1
    }).exec()
    // 获取资金流出数据
    let outflow = await Receipt.aggregate().match({
      receiptDate: {
        $gte: month.startDate,
        $lte: month.endDate
      },
      ...firstMatch
    }).group({ // 按project返回的结果集，通过repaymentDate和platform进行分组，并按分组汇总相关数据
      _id: {
        platform: '$platform'
      },
      outflow: { $sum: '$amount' }
    }).project({ // 配置要返回的数据项，展开分组产生的_id项并移除_id
      _id: 0,
      platform: '$_id.platform',
      outflow: 1
    }).exec()
    // 汇总现金流数据
    _.each(_.groupBy(inflow.concat(outflow), 'platform'), (item) => {
      let merge = {
        month: '',
        platform: '',
        inflow: 0,
        outflow: 0,
        netInflow: 0
      }
      _.each(item, (flow) => {
        merge = { ...merge, ...flow }
      })
      merge.month = month.month
      merge.netInflow = merge.inflow - merge.outflow
      merge = floatFixed(merge, ['inflow', 'outflow', 'netInflow'])
      cashFlow.push(merge)
    })
  }
  ctx.response.body = response(cashFlow)
}

// 默认为所有未收的本金
exports.getPortfolio = async (ctx, next) => {
  // 设置默认为日期范围为当月
  let {
    startDate = null,
    endDate = null,
    platform = null
  } = ctx.request.query
  let match = {}
  // 如果不设置开始和结束时间，则默认为所有未还款的本金
  if (startDate === null && endDate === null) {
    match.status = 0
  } else {
    // 按日期过滤数据
    match.repaymentDate = {}
    if (startDate !== null) {
      match.repaymentDate.$gte = new Date(startDate)
    }
    if (endDate !== null) {
      match.repaymentDate.$lt = new Date(moment(endDate).endOf('day'))
    }
  }
  // 按平台过滤数据
  if (platform !== null) {
    match.platform = platform
  }
  const results = await Repayment.aggregate().match(match).group({ // 按project返回的结果集，通过platform进行分组，并按分组汇总相关数据
    _id: {
      platform: '$platform'
    },
    principal: { $sum: '$principal' },
    interest: { $sum: '$interest' },
    platformRewardInterest: { $sum: '$platformRewardInterest' },
    channelRewardInterest: { $sum: '$channelRewardInterest' }
  }).project({ // 配置要返回的数据项，展开分组产生的_id项并移除_id
    _id: 0,
    platform: '$_id.platform',
    principal: 1,
    interest: 1,
    platformRewardInterest: 1,
    channelRewardInterest: 1
  }).exec()
  ctx.response.body = response(results)
}

// 汇总数据
exports.summary = async (ctx, next) => {
  // 设置默认为日期范围为当月
  let {
    startDate = null,
    endDate = null,
    platform = null
  } = ctx.request.query
  let match = {}
  // 如果不设置开始和结束时间，则默认为所有未还款的本金
  if (startDate === null && endDate === null) {
    match.status = 0
  } else {
    // 按日期过滤数据
    match.repaymentDate = {}
    if (startDate !== null) {
      match.repaymentDate.$gte = new Date(startDate)
    }
    if (endDate !== null) {
      match.repaymentDate.$lt = new Date(moment(endDate).endOf('day'))
    }
  }
  // 按平台过滤数据
  if (platform !== null) {
    match.platform = platform
  }
}
