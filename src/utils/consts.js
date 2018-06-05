// 后端接口前缀
export const CONTXT_PATH = '/api/v1'
// 还款方式
export const REPAYMENT_MODE = { 1: '等额本息', 2: '一次性还本付息', 3: '按月付息到期还本' }
// 红包类型
export const RED_ENVELOPE_TYPE = { 1: '投标成功后直接返还', 2: '红包算入本金并计算利息', 3: '红包按期返还，不算利息' }
// 利息类型
export const INTEREST_TYPE = { 1: '等额本息', 2: '365特权加息' }
// 借款期限单位
export const TERM_UNIT = { '月': '月', '日': '日' }
