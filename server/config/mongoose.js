const config = require('./config')
const mongoose = require('mongoose')

module.exports = function () {
  const db = mongoose.connect(config.db)
  const conn = mongoose.connection

  conn.on('error', console.error.bind(console, 'connection error:'))
  conn.once('open', function () {
    console.log('open db')
  })

  require('../models/platform.model')

  return db
}
