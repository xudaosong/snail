import { getRepayment, getCashFlow, getPortfolio } from '../services/statis'

export default {

  namespace: 'statis',

  state: {
    repayment: {},
    portfolio: [],
    cashflow: []
  },

  effects: {
    * getRepayment({ payload }, { call, put }) {
      const repayment = yield call(getRepayment, payload)
      if (repayment.success) {
        yield put({
          type: 'save',
          payload: {
            repayment: repayment.content || []
          }
        })
      }
    },
    * getCashFlow({ payload }, { call, put }) {
      const response = yield call(getCashFlow, payload)
      if (response.success) {
        yield put({
          type: 'save',
          payload: {
            cashflow: response.content || []
          }
        })
      }
    },
    * getPortfolio({ payload }, { call, put }) {
      const response = yield call(getPortfolio, payload)
      if (response.success) {
        yield put({
          type: 'save',
          payload: {
            portfolio: response.content || []
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
