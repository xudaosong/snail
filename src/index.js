import React from 'react'
import ReactDOM from 'react-dom'
import { LocaleProvider } from 'antd'
import dva from 'dva'
// import createHistory from 'history/createBrowserHistory'
import zhCN from 'antd/lib/locale-provider/zh_CN'

import './index.css'
// const browserHistory = createHistory()

// 1. Initialize
const app = dva({
  // history: browserHistory
})

// 2. Plugins
// app.use({});

// 3. Model
app.model(require('./models/loan').default)
app.model(require('./models/statis').default)
app.model(require('./models/funds').default)

// 4. Router
app.router(require('./router').default)

// 5. Start
const App = app.start()

function Root({ lang = null }) {
  ReactDOM.render(
    <LocaleProvider locale={zhCN}>
      <App />
    </LocaleProvider>,
    document.getElementById('root')
  )
}
Root({})

export default Root
