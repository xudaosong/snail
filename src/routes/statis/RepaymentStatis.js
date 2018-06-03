import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { Row, Col, Card } from 'antd'
import styles from './statis.less'
import _ from 'lodash'

@connect(({ statis }) => {
  const { repayment = {} } = statis
  return {
    repayment
  }
})
export default class RepaymentStatis extends Component {
  static propTypes = {
    dispatch: PropTypes.func,
    repayment: PropTypes.object
  }
  componentDidMount() {
    const { dispatch } = this.props
    dispatch({
      type: 'statis/getRepayment'
    })
  }
  render() {
    const { repayment } = this.props
    const { repaymentList } = repayment
    const repaymentGroup = _.groupBy(repaymentList, 'repaymentDate')
    let step = 0
    return (
      <Card>
        <Row style={{marginBottom: 15}} type='flex' justify='space-between'>
          <Col span={4}>
            <div>应收本金</div>
            <div>{repayment.principal && repayment.principal.toFixed(2)}</div>
          </Col>
          <Col span={4}>
            <div>应收利息</div>
            <div>{repayment.principal && repayment.totalInterest.toFixed(2)}</div>
          </Col>
          <Col span={4}>
            <div>应收还款</div>
            <div>{repayment.principal && repayment.totalRepayment.toFixed(2)}</div>
          </Col>
          <Col span={4}>
            <div>利息管理费</div>
            <div>{repayment.principal && repayment.totalInterestManagementFee.toFixed(2)}</div>
          </Col>
          <Col span={4}>
            <div>应收净额</div>
            <div>{repayment.principal && repayment.amountReceivable.toFixed(2)}</div>
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
            {_.map(repaymentList, (item, index) => {
              let length = repaymentGroup[item.repaymentDate].length
              let dom = null
              if (length > 1) {
                if (index >= step) {
                  dom = <td rowSpan={length}>{item.repaymentDate}</td>
                  step = index + length
                }
              } else {
                dom = <td>{item.repaymentDate}</td>
              }
              return (
                <tr key={item.repaymentDate + item.platform}>
                  {dom}
                  <td>{item.platform}</td>
                  <td className={styles['right']}>{item.principal.toFixed(2)}</td>
                  <td className={styles['right']}>{item.totalInterest.toFixed(2)}</td>
                  <td className={styles['right']}>{item.totalRepayment.toFixed(2)}</td>
                  <td className={styles['right']}>{item.totalInterestManagementFee.toFixed(2)}</td>
                  <td className={styles['right']}>{item.amountReceivable.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    )
  }
}
