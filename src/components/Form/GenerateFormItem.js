import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { Form, Input, InputNumber, Select, DatePicker, Checkbox } from 'antd'
import _ from 'lodash'

const { TextArea } = Input
const Option = Select.Option
const FormItem = Form.Item
const RangePicker = DatePicker.RangePicker

export default class GenerateFormItem extends Component {
  static propTypes = {
    form: PropTypes.object,
    options: PropTypes.array
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
          let { type, name, dataSource, label, defaultValue, required, placeholder, onChange = () => { }, ...rest } = item
          switch (type) {
            case 'text':
              element = <Input placeholder={placeholder} />
              break
            case 'textarea':
              element = <TextArea
                style={{ minHeight: 32 }}
                placeholder={placeholder}
                rows={4}
              />
              break
            case 'percent':
              element = (
                <InputNumber style={{ width: '80%' }} placeholder={placeholder} min={0} max={100} />
              )
              break
            case 'number':
              element = <InputNumber style={{ width: '100%' }} placeholder={placeholder} />
              break
            case 'select':
              element = (
                <Select dropdownMatchSelectWidth={false} {...rest} placeholder={placeholder} onChange={onChange}>
                  {_.map(dataSource, (item) => <Option key={item.value} value={item.value}>{item.name}</Option>)}
                </Select>
              )
              break
            case 'date':
              element = <DatePicker style={{ width: '100%' }} placeholder={placeholder} />
              break
            case 'rangePicker':
              element = <RangePicker style={{ width: 230 }} {...rest} />
              break
            case 'checkbox':
              element = <Checkbox />
              break
          }
          return (
            <FormItem key={name} label={label}>
              {getFieldDecorator(name, {
                initialValue: defaultValue,
                rules: [{ required: required }]
              })(
                element
              )}
              {type === 'percent' && <span className='ant-form-text'>%</span>}
            </FormItem>
          )
        })}
      </Fragment>
    )
  }
}
