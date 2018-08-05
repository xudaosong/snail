import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { GenerateFormItem } from '../../components/Form'
import { Form, Button, DatePicker, Radio, Icon, Row, Col, Card } from 'antd'
import { formatCurrency } from '../../utils/currency'
import styles from './statis.less'
import moment from 'moment'
import _ from 'lodash'

const RadioButton = Radio.Button
const RadioGroup = Radio.Group
const FormItem = Form.Item
const MonthPicker = DatePicker.MonthPicker

@connect(({ statis, loan }) => {
  const { cashflow = {} } = statis
  const { platform = [] } = loan
  return {
    platform,
    cashflow
  }
})
@Form.create()
export default class CashFlow extends Component {
  static propTypes = {
    form: PropTypes.object,
    dispatch: PropTypes.func,
    cashflow: PropTypes.array,
    platform: PropTypes.array
  }
  state = {
    showMode: 'date',
    startMonth: moment(),
    endMonth: moment()
  }
  componentDidMount() {
    const { dispatch } = this.props
    dispatch({
      type: 'loan/getPlatform'
    })
    dispatch({
      type: 'statis/getCashFlow'
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
      }
    ]
  }
  disabledStartDate = (startMonth) => {
    const endMonth = this.state.endMonth
    if (!startMonth || !endMonth) {
      return false
    }
    return startMonth.valueOf() > endMonth.valueOf()
  }
  disabledEndDate = (endMonth) => {
    const startMonth = this.state.startMonth
    if (!endMonth || !startMonth) {
      return false
    }
    return endMonth.valueOf() <= startMonth.valueOf()
  }
  handleMonthChange = (name, value) => {
    this.setState({ [name]: value })
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
      values.startMonth = fieldsValue['startMonth'].format('YYYY-MM')
      values.endMonth = fieldsValue['endMonth'].format('YYYY-MM')
      dispatch({
        type: 'statis/getCashFlow',
        payload: values
      })
    })
  }
  renderRow(cashflow, showMode) {
    if (showMode === 'date') {
      showMode = 'month'
    }
    const cashflowGroup = _.groupBy(cashflow, showMode)
    let keys = _.keys(cashflowGroup)
    if (showMode === 'platform') {
      // 按平台名称降序排序
      keys = keys.sort((a, b) => a < b)
    }
    let dom = []
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i]
      let inflowTotal = 0
      let outflowTotal = 0
      let netInflowTotal = 0
      _.map(cashflowGroup[key], (item, index) => {
        inflowTotal += item.inflow
        outflowTotal += item.outflow
        netInflowTotal += item.netInflow
        dom.push(
          <tr key={item.month + item.platform}>
            {index === 0 && <td rowSpan={cashflowGroup[key].length > 1 ? cashflowGroup[key].length + 1 : 1}>{item[showMode]}</td>}
            <td>{showMode === 'month' ? item.platform : item.month}</td>
            <td className={styles['right']}>{formatCurrency(item.inflow)}</td>
            <td className={styles['right']}>{formatCurrency(item.outflow)}</td>
            <td className={styles['right']}>{formatCurrency(item.netInflow)}</td>
          </tr>
        )
      })
      if (cashflowGroup[key].length > 1) {
        dom.push(
          <tr key={key}>
            <td>小计</td>
            <td className={styles['right']}>{formatCurrency(inflowTotal)}</td>
            <td className={styles['right']}>{formatCurrency(outflowTotal)}</td>
            <td className={styles['right']}>{formatCurrency(netInflowTotal)}</td>
          </tr>
        )
      }
    }
    return dom
  }
  render() {
    const { cashflow, form } = this.props
    const { showMode } = this.state
    const { getFieldDecorator } = form
    return (
      <Card>
        <div className={styles['tableListForm']}>
          <Form className={styles['searchForm']} layout='inline' onSubmit={this.handleSubmit}>
            <GenerateFormItem form={this.props.form} options={this.getFormItems()} />
            <FormItem key={'startMonth'} label='日期'>
              {getFieldDecorator('startMonth', {
                initialValue: this.state.startMonth
              })(
                <MonthPicker
                  style={{ width: 120 }}
                  placeholder='起始月份'
                  disabledDate={this.disabledStartDate}
                  onChange={(value) => this.handleMonthChange('startMonth', value)}
                />
              )}
            </FormItem>
            <FormItem key={'endMonth'}>
              {getFieldDecorator('endMonth', {
                initialValue: this.state.endMonth
              })(
                <MonthPicker
                  style={{ width: 120 }}
                  placeholder='截止月份'
                  disabledDate={this.disabledEndDate}
                  onChange={(value) => this.handleMonthChange('endMonth', value)}
                />
              )}
            </FormItem>
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
          <Col span={8}>
            <div className={styles['title']}>现金总流入</div>
            <div className={styles['money']}>{cashflow && formatCurrency(_.sumBy(cashflow, 'inflow'))}</div>
          </Col>
          <Col span={8}>
            <div className={styles['title']}>现金总流出</div>
            <div className={styles['money']}>{cashflow && formatCurrency(_.sumBy(cashflow, 'outflow'))}</div>
          </Col>
          <Col span={8}>
            <div className={styles['title']}>总净流入</div>
            <div className={styles['money']}>{cashflow && formatCurrency(_.sumBy(cashflow, 'netInflow'))}</div>
          </Col>
        </Row>
        <table className={styles['table']}>
          <thead>
            <tr>
              <th>日期</th>
              <th>平台</th>
              <th className={styles['right']}>现金流入</th>
              <th className={styles['right']}>现金流出</th>
              <th className={styles['right']}>净流入</th>
            </tr>
          </thead>
          <tbody>
            {this.renderRow(cashflow, showMode)}
          </tbody>
        </table>
      </Card>
    )
  }
}
