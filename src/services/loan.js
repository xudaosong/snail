import request from '../utils/request'
import { CONTXT_PATH } from '../utils/consts'
import { convertUrl } from '../utils'

export async function getPlatform() {
  return request(CONTXT_PATH + '/platform')
}

export async function getLoan(params) {
  let queryString = convertUrl(params)
  if (queryString.length > 0) {
    queryString = '?' + queryString
  }
  return request(CONTXT_PATH + '/loan' + queryString)
}

export async function saveLoan(params) {
  return request(CONTXT_PATH + '/loan', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })
}

export async function getRepayment(params) {
  return request(`${CONTXT_PATH}/loan/repayment?loanId=${params.loanId}`)
}
