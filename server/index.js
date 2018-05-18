
const config = require('./config/config')
const mongoose = require('./config/mongoose')
const koa = require('./config/koa')

mongoose()
koa().listen(config.port)
