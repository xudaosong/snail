import React from 'react'
import PropTypes from 'prop-types'
import { Router, Route, Switch } from 'dva/router'
import IndexPage from './routes/IndexPage'

function RouterConfig({ history }) {
  return (
    <Router history={history}>
      <Switch>
        <Route path='/' exact component={IndexPage} />
      </Switch>
    </Router>
  )
}

RouterConfig.propTypes = {
  history: PropTypes.object
}

export default RouterConfig
