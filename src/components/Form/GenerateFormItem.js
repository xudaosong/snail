import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { Form, Input, InputNumber, Select, DatePicker } from 'antd'
import _ from 'lodash'

const { TextArea } = Input
const Option = Select.Option
const FormItem = Form.Item

export default class GenerateFormItem extends Component {
  static propTypes = {
    options: PropTypes.array,
    form: PropTypes.object
  }
  formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 7 }
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 12 },
      md: { span: 10 }
    }
  }
  render() {
    const { options, form } = this.props
    const { getFieldDecorator } = form
    return (
      <Fragment>
        {_.map(options, (item) => {
          let element = null
          switch (item.type) {
            case 'text':
              element = <Input placeholder={item.placeholder} />
              break
            case 'textarea':
              element = <TextArea
                style={{ minHeight: 32 }}
                placeholder={item.placeholder}
                rows={4}
              />
              break
            case 'percent':
              element = (
                <InputNumber style={{ width: '80%' }} placeholder={item.placeholder} min={0} max={100} />
              )
              break
            case 'number':
              element = <InputNumber style={{ width: '100%' }} placeholder={item.placeholder} />
              break
            case 'select':
              element = (
                <Select placeholder={item.placeholder}>
                  {_.map(item.dataSource, (item) => <Option key={item.value} value={item.value}>{item.name}</Option>)}
                </Select>
              )
              break
            case 'date':
              element = <DatePicker style={{ width: '100%' }} placeholder={item.placeholder} />
              break
          }
          return (
            <FormItem key={item.name} {...this.formItemLayout} label={item.label}>
              {getFieldDecorator(item.name, {
                initialValue: item.defaultValue,
                rules: [{ required: item.required }]
              })(
                element
              )}
              {item.type === 'percent' && <span className='ant-form-text'>%</span>}
            </FormItem>
          )
        })}
        <FormItem />
      </Fragment>
    )
  }
}
