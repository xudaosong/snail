const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ReceiptSchema = new Schema({
  // 投资平台
  platform: {
    type: String,
    default: '',
    trim: true,
    required: '请输入平台名称'
  },
  // 收款日期
  receiptDate: {
    type: Date,
    default: 0,
    required: '请输入收款日期'
  },
  // 实付费用
  fee: {
    type: Number,
    default: 0,
    required: '请输入实付费用'
  },
  // 实收本金
  principal: {
    type: Number,
    default: 0,
    required: '请输入实收本金'
  },
  // 实收利息
  interest: {
    type: Number,
    default: 0,
    required: '请输入实收利息'
  },
  // 实收金额
  amount: {
    type: Number,
    default: 0,
    required: '请输入实收金额'
  },
  __v: {
    type: Number,
    select: false
  }
})

ReceiptSchema.method('toJSON', function () {
  var obj = this.toObject()
  obj.id = obj._id
  delete obj._id
  return obj
})

ReceiptSchema.statics.getList = async function (option = {}) {
  let results = []
  await this.find(option)
    .sort({ receiptDate: 'asc', platform: 'asc' })
    .then(function (doc) {
      results = doc
    }).catch(function (err) {
      results = err
    })
  return results
}

mongoose.model('Receipt', ReceiptSchema, 'Receipt')
