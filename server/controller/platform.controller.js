const mongoose = require('mongoose')
const { response } = require('../utils/require')
const Platform = mongoose.model('Platform')

exports.getList = async (ctx, next) => {
  const results = await Platform.getList()
  ctx.response.body = response(results)
}

exports.add = async (ctx, next) => {
  const platform = new Platform(ctx.request.body)
  ctx.response.body = await platform.save().then(function () {
    return response()
  }).catch(function (err) {
    return response({}, [err], 500)
  })
}
