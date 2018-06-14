import { getReceipt, saveReceipt } from '../services/funds'

export default {

  namespace: 'funds',

  state: {
    receipt: {}
  },

  effects: {
    * getReceipt({ payload }, { call, put }) {  // eslint-disable-line
      const result = yield call(getReceipt, payload)
      if (result.success) {
        yield put({
          type: 'save',
          payload: {
            receipt: result.content || []
          }
        })
      }
    },
    * saveReceipt({ payload }, { call, put, dispatch }) {
      const saveSesult = yield call(saveReceipt, payload)
      if (saveSesult.success) {
        const getResult = yield call(getReceipt)
        if (getResult.success) {
          yield put({
            type: 'save',
            payload: {
              receiptList: getResult.content || []
            }
          })
        }
      }
    }
  },
  reducers: {
    save(state, action) {
      return { ...state, ...action.payload }
    }
  }
}
