import request from '../utils/request'
import { CONTXT_PATH } from '../utils/consts'
import { convertUrl } from '../utils'

export async function getReceipt(params) {
  let queryString = convertUrl(params)
  if (queryString.length > 0) {
    queryString = '?' + queryString
  }
  return request(CONTXT_PATH + '/receipt' + queryString)
}

export async function saveReceipt(params) {
  return request(CONTXT_PATH + '/receipt', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })
}
