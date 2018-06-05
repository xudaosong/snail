import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { Table, Card } from 'antd'
import moment from 'moment'
import { routerRedux } from 'dva/router'

@connect(({ loan }) => {
  const { loanList = [] } = loan
  return {
    loanList
  }
})
export default class LoanList extends Component {
  static propTypes = {
    dispatch: PropTypes.func,
    loanList: PropTypes.array
  }
  columns = [{
    title: '投资平台',
    dataIndex: 'platform',
    key: 'platform'
  }, {
    title: '名称',
    dataIndex: 'name',
    key: 'name'
  }, {
    title: '投资本金',
    dataIndex: 'principal',
    key: 'principal'
  }, {
    title: '起息时间',
    dataIndex: 'interestDate',
    key: 'interestDate',
    render: (item) => moment(item).format('YYYY-MM-DD')
  }, {
    title: '利率',
    dataIndex: 'interestRate',
    key: 'interestRate',
    render: (item, record) => {
      let interest = (item * 100).toFixed(2)
      if (record.platformReward.interestRateIncrease > 0) {
        interest = interest + '+' + (record.platformReward.interestRateIncrease * 100).toFixed(2)
      }
      if (record.channelReward.interestRateIncrease > 0) {
        interest = interest + '+' + (record.channelReward.interestRateIncrease * 100).toFixed(2)
      }
      interest += '%'
      return interest
    }
  }, {
    title: '借款期限',
    dataIndex: 'term',
    key: 'term',
    render: (term, record) => `${record.term} ${record.termUnit}`
  }, {
    title: '备注',
    dataIndex: 'remark',
    key: 'remark'
  }]
  handleRowClick = (record) => {
    const { dispatch } = this.props
    dispatch(routerRedux.push(`/loan/repayment/${record.id}`))
  }
  render() {
    const { loanList } = this.props
    return (
      <Card>
        <Table
          rowKey='id'
          columns={this.columns}
          dataSource={loanList}
          onRow={(record) => {
            return {
              onClick: () => this.handleRowClick(record)
            }
          }}
        />
      </Card>
    )
  }
}
