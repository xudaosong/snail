import { getPlatform, saveLoan, getLoan, deleteLoan, getRepayment } from '../services/loan'

export default {
  namespace: 'loan',
  state: {
    platform: [],
    loanList: [],
    repaymentList: []
  },
  effects: {
    * getPlatform({ payload }, { call, put }) {  // eslint-disable-line
      const platform = yield call(getPlatform)
      if (platform.success) {
        yield put({
          type: 'save',
          payload: {
            platform: platform.content || []
          }
        })
      }
    },
    * getLoanList({ payload }, { call, put }) {  // eslint-disable-line
      const loanList = yield call(getLoan, payload)
      if (loanList.success) {
        yield put({
          type: 'save',
          payload: {
            loanList: loanList.content || []
          }
        })
      }
    },
    * saveLoan({ payload }, { call, put }) {
      return yield call(saveLoan, payload)
    },
    * deleteLoan({ payload }, { call, put }) {
      return yield call(deleteLoan, payload)
    },
    * getRepaymentList({ payload }, { call, put }) {  // eslint-disable-line
      const repaymentList = yield call(getRepayment, payload)
      if (repaymentList.success) {
        yield put({
          type: 'save',
          payload: {
            repaymentList: repaymentList.content || []
          }
        })
      }
    }
  },
  reducers: {
    save(state, action) {
      return { ...state, ...action.payload }
    }
  }
}
