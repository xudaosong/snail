import { getPlatform, saveLoan, getLoan, getRepayment } from '../services/loan'

export default {

  namespace: 'loan',

  state: {
    platform: [],
    loanList: [],
    repaymentList: []
  },

  subscriptions: {
    setup({ dispatch, history }) {
      return history.listen(({ pathname }) => {
        switch (pathname) {
          case '/loan/add':
            dispatch({ type: 'getPlatform' })
            break
          case '/loan':
            dispatch({ type: 'getLoanList' })
            break
        }
      })
    }
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
      const loanList = yield call(getLoan)
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
