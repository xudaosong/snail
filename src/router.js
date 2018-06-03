import React from 'react'
import PropTypes from 'prop-types'
import { Router, Route, Switch, routerRedux } from 'dva/router'
import BasicLayout from './layouts/BasicLayout'

const { ConnectedRouter } = routerRedux

// const Routes = [
//   {
//     path: '/',
//     component: () => import('./routes/IndexPage')
//   }
// ]
function RouterConfig({ history }) {
  return (
    <ConnectedRouter history={history}>
      <Router history={history}>
        <Switch>
          <Route path='/' component={BasicLayout} />
        </Switch>
      </Router>
    </ConnectedRouter>
  )
}

RouterConfig.propTypes = {
  history: PropTypes.object
}

export default RouterConfig
