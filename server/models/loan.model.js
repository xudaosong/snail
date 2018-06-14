const mongoose = require('mongoose')
const Schema = mongoose.Schema

const LoanRewardSchema = new Schema({
  // 红包
  redEnvelope: {
    type: Number,
    default: 0
  },
  // 红包类型
  redEnvelopeType: {
    type: Number,
    default: 1,
    // 1：投标成功后直接返还；2：红包算入本金并计算利息，3：红包按期返还，不算利息
    min: 1,
    max: 3
  },
  // 加息
  interestRateIncrease: {
    type: Number,
    default: 0
  },
  // 利息管理费
  interestManagementFee: {
    type: Number,
    default: 0
  },
  // 投标成功后返现
  cashBack: {
    type: Number,
    default: 0
  },
  // 利息类型
  interestType: {
    type: Number,
    // 1: 等额本息
    // 2: 第一期等额本息的利息做为后面每期的奖励，如365易贷的特权加息
    // 3. 等额本息固定利息，如广信贷
    // 4. 一次性还本付息，如饭团金服
    min: 1,
    max: 4
  }
}, { id: false, _id: false }
)

const LoanSchema = new Schema({
  // 投资平台
  platform: {
    type: String,
    default: '',
    trim: true,
    required: '请输入平台名称'
  },
  // 项目名称
  name: {
    type: String,
    default: '',
    trim: true,
    required: '请输入项目名称'
  },
  // 投资本金
  principal: {
    type: Number,
    default: 0,
    required: '请输入投资本金'
  },
  // 起息时间
  interestDate: {
    type: Date,
    default: Date.now,
    required: '请输入起息时间'
  },
  // 利率
  interestRate: {
    type: Number,
    default: 0,
    required: '请输入利率'
  },
  // 借款期限
  term: {
    type: Number,
    default: 0,
    required: '请输入期限'
  },
  // 借款期限单位
  // 1: 月 2: 日
  termUnit: {
    type: Number,
    min: 1,
    max: 2
  },
  // 还款方式
  repaymentMode: {
    type: Number,
    required: '请输入还款方式',
    // 1: '等额本息', 2: '一次性还本付息', 3: '按月付息到期还本'
    min: 1,
    max: 3
  },
  // 利息管理费
  interestManagementFee: {
    type: Number,
    default: 0
  },
  // 备注
  remark: {
    type: String
  },
  // 平台奖励
  platformReward: {
    type: LoanRewardSchema
  },
  // 渠道奖励
  channelReward: {
    type: LoanRewardSchema
  },
  __v: {
    type: Number,
    select: false
  }
})

LoanSchema.method('toJSON', function () {
  var obj = this.toObject()
  obj.id = obj._id
  delete obj._id
  return obj
})

LoanSchema.statics.getList = async function (option = {}) {
  let results = []
  if (option.name) {
    option.name = new RegExp(option.name)
  }
  await this.find(option)
    .sort({ platform: 'asc', interestDate: 'desc' })
    .then(function (doc) {
      results = doc
    }).catch(function (err) {
      results = err
    })
  return results
}

mongoose.model('LoanReward', LoanRewardSchema, 'LoanReward')
mongoose.model('Loan', LoanSchema, 'Loan')
