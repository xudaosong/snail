import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { Form, Button, Card, Modal, Row, Col } from 'antd'
import moment from 'moment'
import { GenerateFormItem } from '../../components/Form'
import { RED_ENVELOPE_TYPE, REPAYMENT_MODE, INTEREST_TYPE, TERM_UNIT } from '../../utils/consts'
import _ from 'lodash'
import styles from './loan.less'

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
  gutter = { xs: 8, sm: 16, md: 24 }
  defaults = {
    '易融恒信': {
      termUnit: '1',
      repaymentMode: '1'
    },
    '广信贷': {
      term: 36,
      termUnit: '1',
      repaymentMode: '1',
      platformReward: {
        interestType: '3',                          
        redEnvelopeType: '1'
      },
      channelReward: {
        interestType: '3',
        redEnvelopeType: '1'
      }
    },
    '365易贷': {
      termUnit: '1',
      repaymentMode: '1',
      platformReward: {
        interestType: '2',
        redEnvelopeType: '1'
      },
      channelReward: {
        interestType: '2',
        redEnvelopeType: '1'
      }
    },
    '投复利': {
      termUnit: '1',
      repaymentMode: '1'
    },
    '一起好': {
      termUnit: '1',
      repaymentMode: '1'
    },
    '饭团金服': {
      termUnit: '1',
      repaymentMode: '3',
      platformReward: {
        interestType: '1',
        redEnvelopeType: '2'
      },
      channelReward: {
        interestType: '1',
        redEnvelopeType: '2'
      }
    },
    '丁丁金服': {
      termUnit: '1',
      repaymentMode: '1',
      platformReward: {
        interestType: '1',
        redEnvelopeType: '3'
      },
      channelReward: {
        interestType: '1',
        interestRateIncrease: 1.5,
        redEnvelopeType: '3'
      }
    }
  }
  componentDidMount() {
    const { dispatch } = this.props
    dispatch({
      type: 'loan/getPlatform'
    })
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
        onChange: this.handlePlatformChange,
        dataSource: _.map(platform, function (item) {
          return {
            name: item.name,
            value: item.name
          }
        })
      }, {
        name: 'name',
        type: 'text',
        label: '名称',
        placeholder: '请输入标的名称',
        required: true
      }, {
        name: 'interestDate',
        type: 'date',
        label: '起息时间',
        placeholder: '请输入起息时间',
        required: true,
        defaultValue: moment()
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
        label: '',
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
  handlePlatformChange = (value) => {
    const { form, platform } = this.props
    let defaultValues = this.defaults[value]
    if (defaultValues) {
      let fee = _.find(platform, (o) => o.name === value)
      if (fee && fee.managementCost) {
        defaultValues.interestManagementFee = fee.managementCost * 100
      }
      form.setFieldsValue(defaultValues)
    }
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
    const fields = this.getFormItems()
    const platformFields = this.getRewardFormItems('platformReward', '平台奖励')
    const channelFields = this.getRewardFormItems('channelReward', '渠道奖励')
    return (
      <Card>
        <Form layout='vertical' onSubmit={this.handleSubmit}>
          <Row gutter={this.gutter}>
            <Col span={6}><GenerateFormItem form={this.props.form} options={[fields[0]]} /></Col>
            <Col span={6}><GenerateFormItem form={this.props.form} options={[fields[1]]} /></Col>
            <Col span={6}><GenerateFormItem form={this.props.form} options={[fields[2]]} /></Col>
            <Col span={6}><GenerateFormItem form={this.props.form} options={[fields[3]]} /></Col>
          </Row>
          <Row gutter={this.gutter}>
            <Col span={6}><GenerateFormItem form={this.props.form} options={[fields[4]]} /></Col>
            <Col span={6} className={styles['formitem-float']}><GenerateFormItem form={this.props.form} options={[fields[5], fields[6]]} /></Col>
            <Col span={6}><GenerateFormItem form={this.props.form} options={[fields[7]]} /></Col>
            <Col span={6}><GenerateFormItem form={this.props.form} options={[fields[8]]} /></Col>
          </Row>
          <Row>
            <Col span={24}><GenerateFormItem form={this.props.form} options={[fields[9]]} /></Col>
          </Row>
          <Row gutter={this.gutter}>
            {_.map([platformFields, channelFields], (fields, index) => {
              return (
                <Col key={`reward-${index}`} span={12}>
                  <fieldset>
                    <legend>{index === 0 ? '平台奖励' : '渠道奖励'}</legend>
                    <Row gutter={this.gutter}>
                      <Col span={8}>
                        <GenerateFormItem form={this.props.form} options={[fields[3]]} />
                      </Col>
                      <Col span={8}>
                        <GenerateFormItem form={this.props.form} options={[fields[4]]} />
                      </Col>
                      <Col span={8}>
                        <GenerateFormItem form={this.props.form} options={[fields[5]]} />
                      </Col>
                    </Row>
                    <Row gutter={this.gutter}>
                      <Col span={12}>
                        <GenerateFormItem form={this.props.form} options={[fields[0]]} />
                      </Col>
                      <Col span={12}>
                        <GenerateFormItem form={this.props.form} options={[fields[1]]} />
                      </Col>
                    </Row>
                    <Row gutter={this.gutter}>
                      <Col span={24}>
                        <GenerateFormItem form={this.props.form} options={[fields[2]]} />
                      </Col>
                    </Row>
                  </fieldset>
                </Col>
              )
            })}
          </Row>
          <div className={styles['text-center']}><Button style={{ width: 120 }} type='primary' size='large' htmlType='submit'>提交</Button></div>
        </Form>
      </Card>
    )
  }
}
