import request from '../utils/request'
import { CONTXT_PATH } from '../utils/consts'

export async function getRepayment() {
  return request(CONTXT_PATH + '/statis/repayment')
}
