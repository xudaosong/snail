const path = require('path')
const Koa = require('koa')
const koaStatic = require('koa-static')
const bodyParser = require('koa-bodyparser')
const router = require('koa-router')()

module.exports = function () {
  const app = new Koa()
  app.use(koaStatic(path.join(__dirname, '../public'), { extensions: ['html'] }))
  app.use(bodyParser())
  app.use(router.routes())

  // 注册路由
  require('./routes')(router)
  return app
}
