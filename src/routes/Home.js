import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Card } from 'antd'
import { connect } from 'dva'
import PortfolioChart from '../components/Charts/PortofolioChart'
import InterestChart from '../components/Charts/InterestChart'

@connect(({ loan }) => {
  const { loanList = [], platform = [] } = loan
  return {
    platform,
    loanList
  }
})
export default class Home extends Component {
  render() {
    return (
      <Card>
        <div>Home</div>
        <PortfolioChart />
        <InterestChart />
      </Card>
    )
  }
}
