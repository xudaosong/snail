const mongoose = require('mongoose')
const moment = require('moment')
const { response } = require('../utils/require')
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
      $gte: startDate,
      $lte: endDate
    }
  })
  ctx.response.body = response(results)
}

exports.add = async (ctx, next) => {
  let receipt = []
  ctx.request.body.forEach((item) => {
    receipt.push(new Receipt(item))
  })
  ctx.response.body = await Receipt.insertMany(receipt).then(async function (result) {
    await result.forEach(async (item) => {
      result.sub = await Loan.find({ 'platform': item.platform }, { _id: 1 }).then((loans) => {
        return Repayment.find({
          repaymentDate: {
            $gte: new Date(moment(item.receiptDate).format('YYYY-MM-DD')),
            $lte: new Date(moment(item.receiptDate).add(1, 'days').format('YYYY-MM-DD'))
          },
          loan: { $in: loans }
        }).updateMany({}, {
          $set: {
            status: '已还款'
          }
        }).then((result) => {
          console.log(result)
          return result
        })
      })
    })
    return response(result)
  })
}
