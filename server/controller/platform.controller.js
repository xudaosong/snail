const mongoose = require('mongoose')
const { response } = require('../utils/require')
const Platform = mongoose.model('Platform')

exports.list = async (ctx, next) => {
  console.log(new mongoose.Types.ObjectId())
  const results = await Platform.getPlatformList()
  ctx.response.body = response(results)
}

exports.create = async (ctx, next) => {
  const platform = new Platform(ctx.request.body)
  ctx.response.body = await platform.save().then(function () {
    return response()
  }).catch(function (err) {
    return response({}, [err], 500)
  })
}
