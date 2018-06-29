import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Route, Switch } from 'dva/router'
import IndexPage from '../routes/IndexPage'
import { Layout } from 'antd'
import SiderMenu from '../components/SiderMenu'
import logo from '../assets/logo.svg'
import LoanAdd from '../routes/loan/LoanAdd'
import LoanList from '../routes/loan/LoanList'
import Repayment from '../routes/loan/Repayment'
import RepaymentStatis from '../routes/statis/RepaymentStatis'
import Receipt from '../routes/funds/Receipt'
import CashFlow from '../routes/statis/CashFlow'
import Home from '../routes/Home'

const { Header, Content } = Layout

export default class BasicLayout extends Component {
  static propTypes = {
    location: PropTypes.object
  }
  render() {
    const { location } = this.props
    return (
      <Layout>
        <SiderMenu logo={logo} location={location} />
        <Layout>
          <Header>Header</Header>
          <Content>
            <Switch>
              <Route path='/' exact component={Home} />
              <Route path='/loan/add' exact component={LoanAdd} />
              <Route path='/loan' exact component={LoanList} />
              <Route path='/loan/repayment/:loanId' exact component={Repayment} />
              <Route path='/statis/repayment' exact component={RepaymentStatis} />
              <Route path='/funds/receipt' exact component={Receipt} />
              <Route path='/statis/cashflow' exact component={CashFlow} />
            </Switch>
          </Content>
        </Layout>
      </Layout>
    )
  }
}
