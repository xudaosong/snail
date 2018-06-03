const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = require('mongodb').ObjectId

const RepaymentSchema = new Schema({
  // 借款标识
  loan: {
    type: Schema.Types.ObjectId,
    ref: 'Loan'
  },
  // 期数
  period: {
    type: Number,
    required: '请输入期数'
  },
  // 应收本金
  principal: {
    type: Number,
    default: 0,
    required: '请输入应收本金'
  },
  // 应收利息
  interest: {
    type: Number,
    required: '请输入应收利息'
  },
  // 平台奖励利息
  platformRewardInterest: {
    type: Number,
    default: 0,
    required: '请输入平台奖励利息'
  },
  // 平台奖励利息管理费
  platformRewardFee: {
    type: Number,
    default: 0,
    required: '请输入平台奖励利息管理费'
  },
  // 渠道奖励利息
  channelRewardInterest: {
    type: Number,
    default: 0,
    required: '请输入渠道奖励利息'
  },
  // 渠道奖励利息管理费
  channelRewardFee: {
    type: Number,
    default: 0,
    required: '请输入渠道奖励利息管理费'
  },
  // 应还日期
  repaymentDate: {
    type: Date,
    required: '请输入应还日期'
  },
  // 利息管理费
  interestManagementFee: {
    type: Number,
    required: '请输入利息管理费'
  },
  // 还款状态
  status: {
    type: String,
    enum: ['待还款', '已还款', '逾期', '坏账']
  },
  // 总还款利息
  totalInterest: {
    type: Number
  },
  // 总利息管理费
  totalInterestManagementFee: {
    type: Number
  },
  // 总还款金额
  totalRepayment: {
    type: Number
  },
  // 总应收金额
  amountReceivable: {
    type: Number
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
