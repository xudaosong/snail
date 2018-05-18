const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PlatformSchema = new Schema({
  name: {
    type: String,
    default: '',
    trim: true,
    required: '请输入平台名称'
  },
  managementCost: {
    type: Number,
    default: 0,
    required: '请输入利息管理费'
  },
  _id: {
    type: Object,
    default: new mongoose.Types.ObjectId(),
    select: false
  },
  __v: {
    type: Number,
    select: false
  }
})

PlatformSchema.statics.getPlatformList = async function () {
  let results = []
  await this.find().then(function (doc) {
    results = doc
  })
  return results
}

mongoose.model('Platform', PlatformSchema, 'Platform')
