// import * as CONSTS from './consts'
import request from './request'
import _ from 'lodash'

const convertUrl = (o) => {
  if (!_.isObject(o)) {
    return ''
  }
  // debugger
  return Object.keys(o).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(o[k])
  }).join('&')
}

export {
  // ...CONSTS,
  request,
  convertUrl
}
