import request from '../utils/request'
import { CONTXT_PATH } from '../utils/consts'

export async function getReceipt(params) {
  return request(CONTXT_PATH + '/receipt')
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
