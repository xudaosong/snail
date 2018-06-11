import { getRepayment } from '../services/statis'

export default {

  namespace: 'statis',

  state: {
    repayment: {}
  },

  // subscriptions: {
  //   setup({ dispatch, history }) {
  //     return history.listen(({ pathname }) => {
  //       switch (pathname) {
  //         case '/loan/add':
  //           dispatch({ type: 'getPlatform' })
  //           break
  //         case '/loan':
  //           dispatch({ type: 'getLoanList' })
  //           break
  //       }
  //     })
  //   }
  // },

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
    }
  },

  reducers: {
    save(state, action) {
      return { ...state, ...action.payload }
    }
  }

}
