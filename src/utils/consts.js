// 后端接口前缀
export const CONTXT_PATH = '/api/v1'
// 还款方式
export const REPAYMENT_MODE = { 1: '等额本息', 2: '一次性还本付息', 3: '按月付息到期还本' }
// 红包类型
export const RED_ENVELOPE_TYPE = { 1: '投标成功后直接返还', 2: '红包算入本金并计算利息', 3: '红包按期返还，不算利息' }
// 利息类型
export const INTEREST_TYPE = { 1: '等额本息', 2: '第一期等额本息的利息做为后面每期的奖励，如365易贷的特权加息', 3: '等额本息固定利息，如广信贷', 4: '一次性还本付息，如饭团金服' }
// 借款期限单位
export const TERM_UNIT = { 1: '月', 2: '日' }
// 还款状态
export const REPAYMENT_STATUS = { 0: '待还款', 1: '已还款', 2: '逾期', 3: '坏账' }
// 贷款状态
export const LOAN_STATUS = { 1: '还款中', 2: '已完成', 3: '提前还款' }
