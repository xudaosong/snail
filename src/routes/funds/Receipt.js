import React, { Component } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import { connect } from 'dva'
import { Form, Radio, Icon, Row, Col, Card, InputNumber, Button, Checkbox } from 'antd'
import { formatCurrency } from '../../utils/currency'
import { GenerateFormItem } from '../../components/Form'
import styles from './funds.less'
import _ from 'lodash'

const RadioButton = Radio.Button
const RadioGroup = Radio.Group

@connect(({ statis, loan, funds }) => {
  const { platform = [] } = loan
  const { repayment = {} } = statis
  const { receipt = {} } = funds
  return {
    platform,
    repayment,
    receipt
  }
})
@Form.create()
export default class Receipt extends Component {
  static propTypes = {
    form: PropTypes.object,
    dispatch: PropTypes.func,
    platform: PropTypes.array,
    repayment: PropTypes.object,
    receipt: PropTypes.object
  }
  state = {
    showMode: 'platform',
    showReceived: false,
    searchForm: {
      startDate: moment().startOf('month').format('YYYY-MM-DD'),
      endDate: moment().format('YYYY-MM-DD')
    },
    repayment: {},
    receipt: {}
  }
  componentDidMount() {
    const { dispatch } = this.props
    dispatch({
      type: 'loan/getPlatform'
    })
    this.getRepaymentAndReceipt()
  }
  getRepaymentAndReceipt = () => {
    const { dispatch } = this.props
    const { searchForm } = this.state
    dispatch({
      type: 'funds/getReceipt',
      payload: searchForm
    })
    dispatch({
      type: 'statis/getRepayment',
      payload: {
        ...searchForm,
        status: 0
      }
    })
  }
  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps)) {
      this.setState({
        repayment: nextProps.repayment
      })
    }
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
        name: 'dateRange',
        type: 'rangePicker',
        label: '日期',
        defaultValue: [moment().startOf('month'), moment()]
      }
    ]
  }
  handleReceipt(data) {
    const { dispatch } = this.props
    // 过滤出待还款的数据项
    let items = _.filter(data, (o) => o.status !== 1)
    if (items.length === 0) {
      return
    }
    const payload = _.map(items, (item) => {
      return {
        'platform': item.platform,
        'receiptDate': item.repaymentDate,
        'principal': item.principal,
        'interest': item.totalInterest,
        'fee': item.totalInterestManagementFee,
        'amount': item.amountReceivable
      }
    })
    dispatch({
      type: 'funds/saveReceipt',
      payload
    }).then(this.getRepaymentAndReceipt)
  }
  handleValueChange(name, item, value) {
    switch (name) {
      case 'principal':
        item.principal = value
        item.amountReceivable = item.principal + item.totalInterest - item.totalInterestManagementFee
        break
      case 'totalInterest':
        item.totalInterest = value
        item.amountReceivable = item.principal + item.totalInterest - item.totalInterestManagementFee
        break
      case 'amountReceivable':
        item.amountReceivable = value
        item.totalInterest = item.amountReceivable - item.principal - item.totalInterestManagementFee
        break
      case 'totalInterestManagementFee':
        item.totalInterestManagementFee = value
        item.amountReceivable = item.principal + item.totalInterest - item.totalInterestManagementFee
        break
    }
    let { repayment } = this.state
    repayment.repaymentList[item.id] = item
    this.setState({ repayment })
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
      if (fieldsValue['dateRange'].length > 0) {
        values.startDate = fieldsValue['dateRange'][0].format('YYYY-MM-DD')
        values.endDate = fieldsValue['dateRange'][1].format('YYYY-MM-DD')
      }
      this.setState({ searchForm: values }, this.getRepaymentAndReceipt)
    })
  }
  handleShowReceived = (e) => {
    this.setState({ showReceived: e.target.checked })
  }
  renderRow(repaymentList, receiptList, showMode) {
    const { showReceived } = this.state
    if (showMode === 'date') {
      showMode = 'repaymentDate'
    }
    if (showReceived) {
      repaymentList = repaymentList.concat(_.map(receiptList, (item) => ({
        status: 1,
        platform: item.platform,
        repaymentDate: item.receiptDate,
        principal: item.principal,
        totalInterest: item.interest,
        amountReceivable: item.amount,
        totalInterestManagementFee: item.fee
      })))
      repaymentList = _.orderBy(repaymentList, ['repaymentDate'], ['asc'])
    }
    const repaymentGroup = _.groupBy(repaymentList, showMode)
    let keys = _.keys(repaymentGroup)
    if (showMode === 'platform') {
      // 按平台名称降序排序
      keys = keys.sort((a, b) => a < b)
    }
    let dom = []
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i]
      let principalTotal = 0
      let interestTotal = 0
      let amountTotal = 0
      let feeTotal = 0
      let hasReceipt = false
      _.map(repaymentGroup[key], (item, index) => {
        principalTotal += item.principal
        interestTotal += item.totalInterest
        amountTotal += item.amountReceivable
        feeTotal += item.totalInterestManagementFee
        // console.log(item.status, item)
        if (item.status === 1) {
          dom.push(
            <tr key={item.repaymentDate + item.platform}>
              {index === 0 && <td rowSpan={repaymentGroup[key].length > 1 ? repaymentGroup[key].length + 1 : 1}>{showMode === 'platform' ? item.platform : moment(item.repaymentDate).format('YYYY-MM-DD')}</td>}
              <td>{showMode === 'repaymentDate' ? item.platform : moment(item.repaymentDate).format('YYYY-MM-DD')}</td>
              <td className={styles['right']}>{formatCurrency(item.principal)}</td>
              <td className={styles['right']}>{formatCurrency(item.totalInterest)}</td>
              <td className={styles['right']}>{formatCurrency(item.totalInterestManagementFee)}</td>
              <td className={styles['right']}>{formatCurrency(item.amountReceivable)}</td>
              <td className={styles['center']}>已收款</td>
            </tr>
          )
        } else {
          hasReceipt = true
          dom.push(
            <tr key={item.repaymentDate + item.platform}>
              {index === 0 && <td rowSpan={repaymentGroup[key].length > 1 ? repaymentGroup[key].length + 1 : 1}>{item[showMode]}</td>}
              <td>{showMode === 'repaymentDate' ? item.platform : item.repaymentDate}</td>
              <td className={styles['right']}><InputNumber value={item.principal.toFixed(2)} defaultValue={item.principal.toFixed(2)} onChange={(e) => this.handleValueChange('principal', item, e)} /></td>
              <td className={styles['right']}><InputNumber value={item.totalInterest.toFixed(2)} defaultValue={item.totalInterest.toFixed(2)} onChange={(e) => this.handleValueChange('totalInterest', item, e)} /></td>
              <td className={styles['right']}><InputNumber value={item.totalInterestManagementFee.toFixed(2)} defaultValue={item.totalInterestManagementFee.toFixed(2)} onChange={(e) => this.handleValueChange('totalInterestManagementFee', item, e)} /></td>
              <td className={styles['right']}><InputNumber value={item.amountReceivable.toFixed(2)} defaultValue={item.amountReceivable.toFixed(2)} onChange={(e) => this.handleValueChange('amountReceivable', item, e)} /></td>
              <td className={styles['center']}><Button type='primary' onClick={() => this.handleReceipt([item])}>收款</Button></td>
            </tr>
          )
        }
      })
      if (repaymentGroup[key].length > 1) {
        dom.push(
          <tr key={key}>
            <td>小计</td>
            <td className={styles['right']}>{formatCurrency(principalTotal)}</td>
            <td className={styles['right']}>{formatCurrency(interestTotal)}</td>
            <td className={styles['right']}>{formatCurrency(feeTotal)}</td>
            <td className={styles['right']}>{formatCurrency(amountTotal)}</td>
            <td className={styles['center']}>{hasReceipt ? <Button type='primary' onClick={() => this.handleReceipt(repaymentGroup[key])}>全部收款</Button> : '全部已收款'}</td>
          </tr>
        )
      }
    }
    return dom
  }
  render() {
    const { repayment, receipt } = this.props
    const { showMode } = this.state
    const { repaymentList } = repayment
    return (
      <Card>
        <div className={styles['tableListForm']}>
          <Form className={styles['searchForm']} layout='inline' onSubmit={this.handleSubmit}>
            <GenerateFormItem form={this.props.form} options={this.getFormItems()} />
            <div className={styles.submitButtons}>
              <Button type='primary' htmlType='submit'>查找</Button>
            </div>
          </Form>
          <div>
            <Checkbox checked={this.state.showReceived} onChange={this.handleShowReceived}>显示已收款</Checkbox>
            <RadioGroup onChange={(e) => this.setState({ showMode: e.target.value })} defaultValue={showMode}>
              <RadioButton value='date'><Icon type='calendar' /></RadioButton>
              <RadioButton value='platform'><Icon type='appstore-o' /></RadioButton>
            </RadioGroup>
          </div>
        </div>
        <Row style={{ marginBottom: 15 }} type='flex' justify='space-between'>
          <Col span={4}>
            <div className={styles['title']}>已收本金</div>
            <div className={styles['money']}>{receipt.principal && formatCurrency(receipt.principal)}</div>
          </Col>
          <Col span={4}>
            <div className={styles['title']}>已收利息</div>
            <div className={styles['money']}>{receipt.interest && formatCurrency(receipt.interest)}</div>
          </Col>
          <Col span={4}>
            <div className={styles['title']}>已付费用</div>
            <div className={styles['money']}>{receipt.fee && formatCurrency(receipt.fee)}</div>
          </Col>
          <Col span={4}>
            <div className={styles['title']}>已收净额</div>
            <div className={styles['money']}>{receipt.amount && formatCurrency(receipt.amount)}</div>
          </Col>
        </Row>
        <table className={styles['table']}>
          <thead>
            <tr>
              <th>收款平台</th>
              <th>收款日期</th>
              <th className={styles['right']}>实收本金</th>
              <th className={styles['right']}>实收利息</th>
              <th className={styles['right']}>实付费用</th>
              <th className={styles['right']}>实收净额</th>
              <th className={styles['center']}>状态</th>
            </tr>
          </thead>
          <tbody>
            {this.renderRow(repaymentList, receipt.assets, showMode)}
          </tbody>
        </table>
      </Card>
    )
  }
}
