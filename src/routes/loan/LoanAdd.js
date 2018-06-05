import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { Form, Button, Card, Modal } from 'antd'
import moment from 'moment'
import { GenerateFormItem } from '../../components/Form'
import { RED_ENVELOPE_TYPE, REPAYMENT_MODE, INTEREST_TYPE, TERM_UNIT } from '../../utils/consts'
import _ from 'lodash'

@connect(({ loan }) => {
  const { platform = [] } = loan
  return {
    platform
  }
})
@Form.create()
export default class LoanAdd extends Component {
  static propTypes = {
    form: PropTypes.object,
    dispatch: PropTypes.func,
    platform: PropTypes.array
  }
  getFormItems() {
    const { platform } = this.props
    return [
      {
        name: 'platform',
        type: 'select',
        label: '平台',
        placeholder: '请选择平台',
        required: true,
        dataSource: _.map(platform, function (item) {
          return {
            name: item.name,
            value: item.name
          }
        })
      }, {
        name: 'interestDate',
        type: 'date',
        label: '起息时间',
        placeholder: '请输入起息时间',
        required: true,
        defaultValue: moment()
      }, {
        name: 'name',
        type: 'text',
        label: '名称',
        placeholder: '请输入标的名称',
        required: true
      }, {
        name: 'principal',
        type: 'number',
        label: '投资本金',
        placeholder: '请输入投资本金',
        required: true
      }, {
        name: 'interestRate',
        type: 'percent',
        label: '利率',
        placeholder: '请输入利率',
        required: true
      }, {
        name: 'term',
        type: 'number',
        label: '期限',
        placeholder: '请输入期限',
        required: true
      }, {
        name: 'termUnit',
        type: 'select',
        label: '期限单位',
        placeholder: '请选择期限单位',
        required: true,
        defaultValue: _.keys(TERM_UNIT)[0],
        dataSource: _.map(TERM_UNIT, (value, key) => { return { name: value, value: key } })
      }, {
        name: 'repaymentMode',
        type: 'select',
        label: '还款方式',
        placeholder: '请选择还款方式',
        required: true,
        defaultValue: _.keys(REPAYMENT_MODE)[0],
        dataSource: _.map(REPAYMENT_MODE, (value, key) => { return { name: value, value: key } })
      }, {
        name: 'interestManagementFee',
        type: 'percent',
        label: '利息管理费',
        placeholder: '请输入利息管理费',
        defaultValue: 0,
        required: true
      }, {
        name: 'remark',
        type: 'textarea',
        label: '备注',
        placeholder: '请输入备注',
        defaultValue: ''
      }
    ]
  }
  getRewardFormItems = (namespace, label = '') => {
    return [
      {
        name: `${namespace}.redEnvelopeType`,
        type: 'select',
        label: `${label}红包类型`,
        placeholder: `请选择${label}红包类型`,
        defaultValue: _.keys(RED_ENVELOPE_TYPE)[0],
        dataSource: _.map(RED_ENVELOPE_TYPE, (value, key) => { return { name: value, value: key } })
      }, {
        name: `${namespace}.redEnvelope`,
        type: 'number',
        label: `${label}红包`,
        placeholder: `请输入${label}红包`,
        defaultValue: 0
      }, {
        name: `${namespace}.cashBack`,
        type: 'number',
        label: `${label}投标成功后返现`,
        placeholder: `请输入${label}投标成功后返现`,
        defaultValue: 0
      }, {
        name: `${namespace}.interestType`,
        type: 'select',
        label: `${label}利息类型`,
        placeholder: `请输入${label}利息类型`,
        defaultValue: _.keys(INTEREST_TYPE)[0],
        dataSource: _.map(INTEREST_TYPE, (value, key) => { return { name: value, value: key } })
      }, {
        name: `${namespace}.interestRateIncrease`,
        type: 'percent',
        label: `${label}加息`,
        placeholder: `请输入${label}加息`,
        defaultValue: 0
      }, {
        name: `${namespace}.interestManagementFee`,
        type: 'percent',
        label: `${label}利息管理费`,
        placeholder: `请输入${label}利息管理费`,
        defaultValue: 0
      }
    ]
  }
  handleSubmit = (e) => {
    e.preventDefault()
    const { dispatch, form } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        values.interestRate = parseFloat((values.interestRate / 100).toFixed(6))
        values.interestManagementFee = parseFloat((values.interestManagementFee / 100).toFixed(6))
        values.platformReward.interestRateIncrease = parseFloat((values.platformReward.interestRateIncrease / 100).toFixed(6))
        values.platformReward.interestManagementFee = parseFloat((values.platformReward.interestManagementFee / 100).toFixed(6))
        values.channelReward.interestRateIncrease = parseFloat((values.channelReward.interestRateIncrease / 100).toFixed(6))
        values.channelReward.interestManagementFee = parseFloat((values.channelReward.interestManagementFee / 100).toFixed(6))
        dispatch({ type: 'loan/saveLoan', payload: values }).then((result) => {
          if (result.success) {
            Modal.success({
              title: '出借',
              content: '出借成功'
            })
            form.resetFields()
          } else {
            Modal.error({
              title: '出借',
              content: '出借失败：' + result.errors.join('; ')
            })
          }
        })
      }
    })
  }
  render() {
    return (
      <Card>
        <Form onSubmit={this.handleSubmit}>
          <GenerateFormItem form={this.props.form} options={this.getFormItems()} />
          <fieldset>
            <legend>平台奖励</legend>
            <GenerateFormItem form={this.props.form} options={this.getRewardFormItems('platformReward', '平台奖励')} />
          </fieldset>
          <fieldset>
            <legend>渠道奖励</legend>
            <GenerateFormItem form={this.props.form} options={this.getRewardFormItems('channelReward', '渠道奖励')} />
          </fieldset>
          <Button type='primary' htmlType='submit'>提交</Button>
        </Form>
      </Card>
    )
  }
}
