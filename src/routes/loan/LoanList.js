import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { Table, Card, Form, Button, Popconfirm } from 'antd'
import moment from 'moment'
import { routerRedux, Link } from 'dva/router'
import { GenerateFormItem } from '../../components/Form'
import { TERM_UNIT, REPAYMENT_MODE, LOAN_STATUS } from '../../utils/consts'
import { formatCurrency } from '../../utils/currency'
import styles from './loan.less'
import _ from 'lodash'

@connect(({ loan }) => {
  const { loanList = [], platform = [] } = loan
  return {
    platform,
    loanList
  }
})
@Form.create()
export default class LoanList extends Component {
  static propTypes = {
    form: PropTypes.object,
    dispatch: PropTypes.func,
    platform: PropTypes.array,
    loanList: PropTypes.array
  }
  state = {
    searchForm: {}
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
    key: 'principal',
    align: 'right',
    render: (v) => formatCurrency(v)
  }, {
    title: '起息时间',
    dataIndex: 'interestDate',
    key: 'interestDate',
    align: 'right',
    render: (item) => moment(item).format('YYYY-MM-DD')
  }, {
    title: '利率',
    dataIndex: 'interestRate',
    key: 'interestRate',
    align: 'right',
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
    align: 'right',
    render: (term, record) => `${record.term} ${TERM_UNIT[record.termUnit]}`
  }, {
    title: '还款方式',
    dataIndex: 'repaymentMode',
    key: 'repaymentMode',
    align: 'right',
    render: (v) => REPAYMENT_MODE[v]
  }, {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    align: 'right',
    render: (v) => LOAN_STATUS[v]
  }, {
    title: '备注',
    dataIndex: 'remark',
    key: 'remark',
    align: 'right'
  }, {
    key: 'operate',
    align: 'right',
    width: 180,
    render: (v, record) => (
      <Fragment>
        <Link style={{ paddingRight: 10 }} to={`/loan/repayment/${record.id}`}>还款详情</Link>
        <a style={{ paddingRight: 10 }} href='javascript:;'>提前还款</a>
        <Popconfirm title='确定要删除么？' okText='确定' cancelText='取消' onConfirm={() => this.handleDelete(record.id)}>
          <a href='javascript:;'>删除</a>
        </Popconfirm>
      </Fragment>
    )
  }]
  componentDidMount() {
    const { dispatch } = this.props
    dispatch({
      type: 'loan/getPlatform'
    })
    this.getLoans()
  }
  getFormItems() {
    const { platform } = this.props
    return [
      {
        name: 'platform',
        type: 'select',
        label: '平台',
        style: {
          minWidth: 100
        },
        defaultValue: 'all',
        placeholder: '请选择平台',
        dataSource: [{ name: '全部', value: 'all' }].concat(_.map(platform, function (item) {
          return {
            name: item.name,
            value: item.name
          }
        }))
      }, {
        name: 'status',
        type: 'select',
        label: '状态',
        style: {
          minWidth: 100
        },
        defaultValue: 'all',
        placeholder: '请选择状态',
        dataSource: [{ name: '全部', value: 'all' }].concat(_.map(LOAN_STATUS, function (name, value) {
          return {
            name,
            value
          }
        }))
      }, {
        name: 'name',
        type: 'text',
        label: '名称',
        defaultValue: '',
        placeholder: '请输入名称'
      }
    ]
  }
  getLoans = () => {
    const { dispatch } = this.props
    const { searchForm } = this.state
    dispatch({ type: 'loan/getLoanList', payload: searchForm })
  }
  handleDelete = (loanId) => {
    const { dispatch } = this.props
    dispatch({ type: 'loan/deleteLoan', payload: { loanId } }).then((result) => {
      console.log(result)
      if (result.success) {
        this.getLoans()
      }
    })
  }
  handleRowClick = (record) => {
    const { dispatch } = this.props
    dispatch(routerRedux.push(`/loan/repayment/${record.id}`))
  }
  handleSubmit = (e) => {
    e.preventDefault()

    const { form } = this.props

    form.validateFields((err, fieldsValue) => {
      if (err) return
      let values = {}
      if (fieldsValue['platform'] !== 'all') {
        values['platform'] = fieldsValue['platform']
      }
      if (fieldsValue['status'] !== 'all') {
        values['status'] = fieldsValue['status']
      }
      if (fieldsValue['name']) {
        values['name'] = fieldsValue['name']
      }
      this.setState({ searchForm: values }, this.getLoans)
    })
  }
  render() {
    const { loanList } = this.props
    return (
      <Card>
        <div className={styles['tableListForm']}>
          <Form className={styles['searchForm']} layout='inline' onSubmit={this.handleSubmit}>
            <GenerateFormItem form={this.props.form} options={this.getFormItems()} />
            <div className={styles['submitButtons']}>
              <Button type='primary' htmlType='submit'>查找</Button>
            </div>
          </Form>
        </div>
        <Table
          rowKey='id'
          columns={this.columns}
          dataSource={loanList}
        />
      </Card>
    )
  }
}
