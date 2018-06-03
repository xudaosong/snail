import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { Table, Card } from 'antd'
import moment from 'moment'
import { routerRedux } from 'dva/router'
import styles from './loan.less'

@connect(({ loan }) => {
  const { repaymentList = [] } = loan
  return {
    repaymentList
  }
})
export default class Repayment extends Component {
  static propTypes = {
    dispatch: PropTypes.func,
    match: PropTypes.object,
    repaymentList: PropTypes.array
  }
  columns = [{
    title: '期号',
    dataIndex: 'period',
    key: 'period',
    className: styles['text-center']
  }, {
    title: '应还日期',
    dataIndex: 'repaymentDate',
    key: 'repaymentDate',
    render: (item) => moment(item).format('YYYY-MM-DD'),
    className: styles['text-center']
  }, {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    className: styles['text-center']
  }, {
    title: '应收本金',
    dataIndex: 'principal',
    key: 'principal',
    className: styles['text-right'],
    render: (item) => item.toFixed(2)
  }, {
    title: '标面收益',
    children: [{
      title: '利息',
      dataIndex: 'interest',
      key: 'interest',
      className: styles['text-right'],
      render: (item) => item.toFixed(2)
    }, {
      title: '管理费',
      dataIndex: 'interestManagementFee',
      key: 'interestManagementFee',
      className: styles['text-right'],
      render: (item) => item.toFixed(2)
    }]
  }, {
    title: '平台奖励',
    children: [{
      title: '利息',
      dataIndex: 'platformRewardInterest',
      key: 'platformRewardInterest',
      className: styles['text-right'],
      render: (item) => item.toFixed(2)
    }, {
      title: '管理费',
      dataIndex: 'platformRewardFee',
      key: 'platformRewardFee',
      className: styles['text-right'],
      render: (item) => item.toFixed(2)
    }]
  }, {
    title: '渠道奖励',
    children: [{
      title: '利息',
      dataIndex: 'channelRewardInterest',
      key: 'channelRewardInterest',
      className: styles['text-right'],
      render: (item) => item.toFixed(2)
    }, {
      title: '管理费',
      dataIndex: 'channelRewardFee',
      key: 'channelRewardFee',
      className: styles['text-right'],
      render: (item) => item.toFixed(2)
    }]
  }, {
    title: '小计',
    children: [{
      title: '总管理费',
      dataIndex: 'totalInterestManagementFee',
      key: 'totalInterestManagementFee',
      className: styles['text-right'],
      render: (item) => item.toFixed(2)
    }, {
      title: '总还款利息',
      dataIndex: 'totalInterest',
      key: 'totalInterest',
      className: styles['text-right'],
      render: (item) => item.toFixed(2)
    }, {
      title: '总还款金额',
      dataIndex: 'totalRepayment',
      key: 'totalRepayment',
      className: styles['text-right'],
      render: (item) => item.toFixed(2)
    }, {
      title: '总应收金额',
      dataIndex: 'amountReceivable',
      key: 'amountReceivable',
      className: styles['text-right'],
      render: (item) => item.toFixed(2)
    }]
  }]
  componentDidMount() {
    const { match: { params = {} } = {} } = this.props
    this.props.dispatch({
      type: 'loan/getRepaymentList',
      payload: {
        loanId: params.loanId
      }
    })
  }
  handleRowClick = (record) => {
    const { dispatch } = this.props
    dispatch(routerRedux.push(`/repayment/${record.id}`))
  }
  render() {
    const { repaymentList } = this.props
    return (
      <Card>
        <Table
          rowKey='id'
          columns={this.columns}
          dataSource={repaymentList}
          bordered
        />
      </Card>
    )
  }
}
