import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { GenerateFormItem } from '../../components/Form'
import { connect } from 'dva'
import { Form, Button, Radio, Icon, Row, Col, Card } from 'antd'
import { formatCurrency } from '../../utils/currency'
import moment from 'moment'
import styles from './statis.less'
import _ from 'lodash'

const RadioButton = Radio.Button
const RadioGroup = Radio.Group

@connect(({ statis, loan }) => {
  const { repayment = {} } = statis
  const { platform = [] } = loan
  return {
    platform,
    repayment
  }
})
@Form.create()
export default class RepaymentStatis extends Component {
  static propTypes = {
    form: PropTypes.object,
    dispatch: PropTypes.func,
    repayment: PropTypes.object,
    platform: PropTypes.array
  }
  state = {
    showMode: 'date'
  }
  componentDidMount() {
    const { dispatch } = this.props
    dispatch({
      type: 'loan/getPlatform'
    })
    dispatch({
      type: 'statis/getRepayment'
    })
  }
  handleSubmit = (e) => {
    e.preventDefault()

    const { dispatch, form } = this.props

    form.validateFields((err, fieldsValue) => {
      if (err) return
      let values = {}
      if (fieldsValue['platform'] !== 'all') {
        values['platform'] = fieldsValue['platform']
      }
      values.startDate = fieldsValue['dateRange'][0].format('YYYY-MM-DD')
      values.endDate = fieldsValue['dateRange'][1].format('YYYY-MM-DD')
      dispatch({
        type: 'statis/getRepayment',
        payload: values
      })
    })
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
        defaultValue: [moment().startOf('month'), moment().endOf('month')]
      }
    ]
  }
  renderRow(repaymentList, showMode) {
    if (showMode === 'date') {
      showMode = 'repaymentDate'
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
      let repaymentTotal = 0
      let feeTotal = 0
      _.map(repaymentGroup[key], (item, index) => {
        principalTotal += item.principal
        interestTotal += item.totalInterest
        amountTotal += item.amountReceivable
        repaymentTotal += item.totalRepayment
        feeTotal += item.totalInterestManagementFee
        dom.push(
          <tr key={item.repaymentDate + item.platform}>
            {index === 0 && <td rowSpan={repaymentGroup[key].length > 1 ? repaymentGroup[key].length + 1 : 1}>{item[showMode]}</td>}
            <td>{showMode === 'repaymentDate' ? item.platform : item.repaymentDate}</td>
            <td className={styles['right']}>{formatCurrency(item.principal)}</td>
            <td className={styles['right']}>{formatCurrency(item.totalInterest)}</td>
            <td className={styles['right']}>{formatCurrency(item.totalRepayment)}</td>
            <td className={styles['right']}>{formatCurrency(item.totalInterestManagementFee)}</td>
            <td className={styles['right']}>{formatCurrency(item.amountReceivable)}</td>
          </tr>
        )
      })
      if (repaymentGroup[key].length > 1) {
        dom.push(
          <tr className={styles['subtotal']} key={key} >
            <td>小计</td>
            <td className={styles['right']}>{formatCurrency(principalTotal)}</td>
            <td className={styles['right']}>{formatCurrency(interestTotal)}</td>
            <td className={styles['right']}>{formatCurrency(repaymentTotal)}</td>
            <td className={styles['right']}>{formatCurrency(feeTotal)}</td>
            <td className={styles['right']}>{formatCurrency(amountTotal)}</td>
          </tr>
        )
      }
    }
    return dom
  }
  render() {
    const { repayment } = this.props
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
          <RadioGroup onChange={(e) => this.setState({ showMode: e.target.value })} defaultValue={showMode}>
            <RadioButton value='date'><Icon type='calendar' /></RadioButton>
            <RadioButton value='platform'><Icon type='appstore-o' /></RadioButton>
          </RadioGroup>
        </div>
        <Row style={{ marginBottom: 15 }} type='flex' justify='space-between'>
          <Col span={4}>
            <div className={styles['title']}>应收本金</div>
            <div className={styles['money']}>{repayment.principal && formatCurrency(repayment.principal)}</div>
          </Col>
          <Col span={4}>
            <div className={styles['title']}>应收利息</div>
            <div className={styles['money']}>{repayment.totalInterest && formatCurrency(repayment.totalInterest)}</div>
          </Col>
          <Col span={4}>
            <div className={styles['title']}>应收还款</div>
            <div className={styles['money']}>{repayment.totalRepayment && formatCurrency(repayment.totalRepayment)}</div>
          </Col>
          <Col span={4}>
            <div className={styles['title']}>利息管理费</div>
            <div className={styles['money']}>{repayment.totalInterestManagementFee && formatCurrency(repayment.totalInterestManagementFee)}</div>
          </Col>
          <Col span={4}>
            <div className={styles['title']}>应收净额</div>
            <div className={styles['money']}>{repayment.amountReceivable && formatCurrency(repayment.amountReceivable)}</div>
          </Col>
        </Row>
        <table className={styles['table']}>
          <thead>
            <tr>
              <th>回款日期</th>
              <th>回款平台</th>
              <th className={styles['right']}>应收本金</th>
              <th className={styles['right']}>应收利息</th>
              <th className={styles['right']}>应收还款</th>
              <th className={styles['right']}>利息管理费</th>
              <th className={styles['right']}>应收净额</th>
            </tr>
          </thead>
          <tbody>
            {this.renderRow(repaymentList, showMode)}
          </tbody>
        </table>
      </Card>
    )
  }
}
