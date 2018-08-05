import React, { PureComponent, Fragment } from 'react'
import { Modal } from 'antd'

export default class PrepaymentModal extends PureComponent {
  static propTypes = {
    dispatch: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    portfolio: PropTypes.arrayOf(PropTypes.object)
  }
  state = {
    visible: false
  }
  render() {
    return (
      <Fragment>
        <a href='javascript:;'>提前还款</a>
        <Modal>
          title="Basic Modal"
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          >
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </Modal>
      </Fragment>
    )
  }
}
