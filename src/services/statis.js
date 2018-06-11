import request from '../utils/request'
import { CONTXT_PATH } from '../utils/consts'
import { convertUrl } from '../utils'

export async function getRepayment(params) {
  let queryString = convertUrl(params)
  if (queryString.length > 0) {
    queryString = '?' + queryString
  }
  return request(CONTXT_PATH + '/statis/repayment' + queryString)
}
