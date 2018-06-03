import request from '../utils/request'
import { CONTXT_PATH } from '../utils/consts'

export async function getPlatform() {
  return request(CONTXT_PATH + '/platform')
}

export async function getLoan(params) {
  return request(CONTXT_PATH + '/loan')
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
