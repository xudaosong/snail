const mongoose = require('mongoose')
const Decimal = require('../utils/decimal')
const ObjectId = require('mongodb').ObjectId
const moment = require('moment')
const Schema = mongoose.Schema

const RepaymentSchema = new Schema({
  // 借款标识
  loan: {
    type: Schema.Types.ObjectId,
    ref: 'Loan'
  },
  // 投资平台
  platform: {
    type: String,
    default: '',
    trim: true,
    required: '请输入平台名称'
  },
  // 期数
  period: {
    type: Number,
    required: '请输入期数',
    min: 1,
    max: 60
  },
  // 应收本金
  principal: {
    type: Number,
    default: 0,
    required: '请输入应收本金',
    set: v => Decimal.isDecimal(v) ? v.toNumber() : v
  },
  // 应收利息
  interest: {
    type: Number,
    default: 0,
    required: '请输入应收利息',
    set: v => Decimal.isDecimal(v) ? v.toNumber() : v
  },
  // 平台奖励利息
  platformRewardInterest: {
    type: Number,
    default: 0,
    required: '请输入平台奖励利息',
    set: v => Decimal.isDecimal(v) ? v.toNumber() : v
  },
  // 平台奖励利息管理费
  platformRewardFee: {
    type: Number,
    default: 0,
    required: '请输入平台奖励利息管理费',
    set: v => Decimal.isDecimal(v) ? v.toNumber() : v
  },
  // 渠道奖励利息
  channelRewardInterest: {
    type: Number,
    default: 0,
    required: '请输入渠道奖励利息',
    set: v => Decimal.isDecimal(v) ? v.toNumber() : v
  },
  // 渠道奖励利息管理费
  channelRewardFee: {
    type: Number,
    default: 0,
    required: '请输入渠道奖励利息管理费',
    set: v => Decimal.isDecimal(v) ? v.toNumber() : v
  },
  // 应还日期
  repaymentDate: {
    type: Date,
    required: '请输入应还日期',
    get: v => moment(v).format('YYYY-MM-DD')
  },
  // 利息管理费
  interestManagementFee: {
    type: Number,
    required: '请输入利息管理费',
    set: v => Decimal.isDecimal(v) ? v.toNumber() : v
  },
  // 还款状态
  // 0:'待还款', 1:'已还款', 2:'逾期', 3:'坏账'
  status: {
    type: Number,
    default: 0,
    min: 0,
    max: 3,
    required: '请输入还款状态'
  },
  // 总还款利息
  totalInterest: {
    type: Number,
    set: v => Decimal.isDecimal(v) ? v.toNumber() : v
  },
  // 总利息管理费
  totalInterestManagementFee: {
    type: Number,
    set: v => Decimal.isDecimal(v) ? v.toNumber() : v
  },
  // 总还款金额
  totalRepayment: {
    type: Number,
    set: v => Decimal.isDecimal(v) ? v.toNumber() : v
  },
  // 总应收金额
  amountReceivable: {
    type: Number,
    set: v => Decimal.isDecimal(v) ? v.toNumber() : v
  },
  __v: {
    type: Number,
    select: false
  }
})

RepaymentSchema.method('toJSON', function () {
  var obj = this.toObject()
  obj.id = obj._id
  delete obj._id
  return obj
})

RepaymentSchema.statics.getList = async function (params) {
  let results = []
  await this.find({ loan: new ObjectId(params.loanId) }).then(function (doc) {
    results = doc
  }).catch(function (err) {
    results = err
  })
  return results
}

mongoose.model('Repayment', RepaymentSchema, 'Repayment')
