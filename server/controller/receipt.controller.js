const mongoose = require('mongoose')
const moment = require('moment')
const { response } = require('../utils/require')
const _ = require('lodash')
const Receipt = mongoose.model('Receipt')
const Repayment = mongoose.model('Repayment')
const Loan = mongoose.model('Loan')

exports.getList = async (ctx, next) => {
  const date = new Date()
  // 设置默认为日期范围为当月
  const {
    startDate = new Date(date.getFullYear(), date.getMonth(), 1),
    endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  } = ctx.request.query
  const results = await Receipt.getList({
    receiptDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  })
  ctx.response.body = response(results)
}

exports.add = async (ctx, next) => {
  let receipt = []
  ctx.request.body.forEach((item) => {
    receipt.push(new Receipt(item))
  })
  // 1. 在实收表记录实收数据
  // 2. 根据实收记录，按平台和收款时间从回款表中找出每笔回款
  // 2.1. 更新每笔回款的状态为已收款
  // 2.2. 如果该笔还款为最后一期，则修改Loan的状态为已完成
  ctx.response.body = await Receipt.insertMany(receipt).then(async function (result) {
    // console.log('result', result)
    for await (let item of result) {
      // console.log('item', item)
      let repayments = await Repayment.find({
        platform: item.platform,
        repaymentDate: {
          $gte: new Date(moment(item.receiptDate).format('YYYY-MM-DD')),
          $lte: new Date(moment(item.receiptDate).add(1, 'days').format('YYYY-MM-DD'))
        }
      }).exec()
      // console.log('repayments', repayments)
      await Repayment.updateMany({ _id: { $in: _.map(repayments, '_id') } }, {
        $set: {
          status: 1
        }
      }).exec()
      // 如果还款为最后一期，则修改Loan的status为2（已完成）
      // TODO: 目前是同步方式，速度较慢，有优化空间
      let payOff = []
      for await (let repayment of repayments) {
        let count = await Repayment.find({ loan: repayment.loan, status: 0 }).count().exec()
        if (count === 0) { // 所有的期数都已还清
          payOff.push(repayment.loan)
        }
      }
      // console.log('payOff', payOff)
      if (payOff.length > 0) {
        await Loan.updateMany({
          _id: {
            '$in': payOff
          }
        }, { status: 2 }).exec()
      }
      // return repayments
    }
    // console.log('end')
    return response(result)
  })
}
