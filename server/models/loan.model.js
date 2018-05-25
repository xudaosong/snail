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
    // 1：投标成功后直接返还；2：红包算入本金并计算利息
    enum: [1, 2]
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
    // 2: 365特权加息
    emun: [1, 2]
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
  // 期限
  term: {
    type: Number,
    default: 0,
    required: '请输入期限'
  },
  // 期限单位
  termUnit: {
    type: String,
    enum: ['月', '日'],
    required: '请输入期限'
  },
  // 还款方式
  repaymentMode: {
    type: Number,
    // 1: '等额本息', 2: '一次性还本付息', 3: '按月付息到期还本'
    enum: [1, 2, 3]
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

LoanSchema.statics.getList = async function () {
  let results = []
  await this.find().then(function (doc) {
    results = doc
  }).catch(function (err) {
    results = err
  })
  return results
}

mongoose.model('LoanReward', LoanRewardSchema, 'LoanReward')
mongoose.model('Loan', LoanSchema, 'Loan')
